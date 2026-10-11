import { APP_COOKIE_PATH } from '../../../lib/app-path';
import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { db, digest, limited } from '../../../lib/music';
import { getAccount, username, email, password, passwordHash, passwordMatches, randomToken, sessionCookie, sessionStatement, SESSION_COOKIE, jsonBody, InputError, timingEqual } from '../../../lib/accounts';
export const dynamic='force-dynamic';
function response(body:Record<string,unknown>,status=200,token?:string,expire=false){const headers=new Headers({'Cache-Control':'no-store'});if(token!==undefined)headers.append('Set-Cookie',sessionCookie(token,expire?0:undefined));if(token!==undefined)headers.append('Set-Cookie',`music_admin=; Path=${APP_COOKIE_PATH}; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);return Response.json(body,{status,headers});}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return response({error:'Invalid request origin.'},403);
 try{
 const b=await jsonBody(request),action=b.action;
 if(!['register','login','logout','recover','change-password'].includes(String(action)))return response({error:'Unknown account action.'},400);
 const current=await getAccount();
 if(action==='logout'){
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(token)await db().prepare('DELETE FROM user_sessions WHERE token=?').bind(await digest(token)).run();
 const admin=(await cookies()).get('music_admin')?.value;
 if(admin)await db().prepare('DELETE FROM admin_sessions WHERE token=?').bind(await digest(admin)).run();
 return response({ok:true},200,'',true);
 }
 // The trusted hosting gateway supplies CF-Connecting-IP. Without it, use a shared fallback.
 const ip=await digest(request.headers.get('cf-connecting-ip')||'unavailable');
 if(await limited('auth-ip:'+ip,60,15*60000))return response({error:'Too many attempts. Please wait 15 minutes.'},429);
 await db().batch([db().prepare('DELETE FROM user_sessions WHERE expires<=?').bind(Date.now()),db().prepare('DELETE FROM rate_limits WHERE expires<?').bind(Date.now()-86400000)]);
 if(action==='register'){
 if(current)return response({error:'Sign out before creating another account.'},400);
 const name=username(b.username),address=email(b.email),pass=password(b.password);
 if(await limited('registration:'+ip,5,3600000))return response({error:'Too many accounts created. Please try again in an hour.'},429);
 const existing=await db().prepare('SELECT id FROM accounts WHERE username=? OR email=?').bind(name,address).first();
 if(existing)return response({error:'That username or email is unavailable. Try signing in instead.'},409);
 // Preserve legacy contributions only with a currently authenticated legacy identity, never by matching email.
 const legacy=env.SITES_LEGACY_MIGRATION==='enabled'?await getChatGPTUser():null;
 const profile=legacy?await db().prepare('SELECT id FROM profiles WHERE id=? AND NOT EXISTS (SELECT 1 FROM accounts WHERE id=?)').bind(legacy.userId,legacy.userId).first<{id:string}>():null;
 const id=profile?.id||crypto.randomUUID(), recoveryCode=randomToken();
 const hash=await passwordHash(pass),recoveryHash=await digest(recoveryCode),session=await sessionStatement(id);
 try{await db().batch([
 profile?db().prepare('UPDATE profiles SET name=? WHERE id=?').bind(name,id):db().prepare('INSERT INTO profiles(id,name,created) VALUES(?,?,?)').bind(id,name,Date.now()),
 db().prepare('INSERT INTO accounts(id,username,email,password_hash,recovery_hash,created) VALUES(?,?,?,?,?,?)').bind(id,name,address,hash,recoveryHash,Date.now()),session.statement]);}
 catch(e){if(String(e).includes('UNIQUE'))return response({error:'That username or email is unavailable. Try signing in instead.'},409);throw e;}
 return response({ok:true,recoveryCode},201,session.token);
 }
 if(action==='login'){
 if(typeof b.identifier!=='string'||b.identifier.length>254||typeof b.password!=='string'||b.password.length>128)return response({error:'Incorrect username/email or password.'},401);
 const identifier=b.identifier.trim().toLowerCase();
 if(await limited('login:'+await digest(identifier),10,15*60000))return response({error:'Too many sign-in attempts. Please wait 15 minutes.'},429);
 const account=await db().prepare('SELECT id,password_hash FROM accounts WHERE username=? OR email=?').bind(identifier,identifier).first<{id:string;password_hash:string}>();
 // A missing account still performs the password derivation.
 const stored=account?.password_hash||'pbkdf2-sha256:100000:00000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000';
 if(!await passwordMatches(b.password,stored)||!account)return response({error:'Incorrect username/email or password.'},401);
 const session=await sessionStatement(account.id);
 const old=(await cookies()).get(SESSION_COOKIE)?.value;
 const statements=[session.statement];if(old)statements.push(db().prepare('DELETE FROM user_sessions WHERE token=?').bind(await digest(old)));
 const oldAdmin=(await cookies()).get('music_admin')?.value;if(oldAdmin)statements.push(db().prepare('DELETE FROM admin_sessions WHERE token=?').bind(await digest(oldAdmin)));
 await db().batch(statements);
 return response({ok:true},200,session.token);
 }
 if(action==='recover'){
 const identifier=typeof b.identifier==='string'?b.identifier.trim().toLowerCase():'';
 if(!identifier||identifier.length>254)return response({error:'Account details or recovery code are incorrect.'},400);
 if(await limited('recovery:'+await digest(identifier),5,15*60000))return response({error:'Too many recovery attempts. Please wait 15 minutes.'},429);
 const pass=password(b.password),code=typeof b.recoveryCode==='string'?b.recoveryCode.trim():'';
 if(!/^[a-f0-9]{64}$/.test(code))return response({error:'Account details or recovery code are incorrect.'},400);
 const account=await db().prepare('SELECT id,recovery_hash FROM accounts WHERE username=? OR email=?').bind(identifier,identifier).first<{id:string;recovery_hash:string}>();
 const codeHash=await digest(code);
 if(!account||!timingEqual(codeHash,account.recovery_hash))return response({error:'Account details or recovery code are incorrect.'},400);
 const recoveryCode=randomToken();
 // Compare-and-swap consumes the code once, even for simultaneous requests.
 const result=await db().prepare('UPDATE accounts SET password_hash=?,recovery_hash=? WHERE id=? AND recovery_hash=?').bind(await passwordHash(pass),await digest(recoveryCode),account.id,codeHash).run();
 if(!result.meta.changes)return response({error:'This recovery code has already been used.'},409);
 await db().batch([db().prepare('DELETE FROM user_sessions WHERE user_id=?').bind(account.id),db().prepare('DELETE FROM admin_sessions WHERE user_id=?').bind(account.id)]);
 return response({ok:true,recoveryCode,signInRequired:true},200,'',true);
 }
 if(action==='change-password'){
 if(!current)return response({error:'Sign in first.'},401);
 const pass=password(b.password);
 if(typeof b.currentPassword!=='string'||b.currentPassword.length>128)return response({error:'Current password is incorrect.'},400);
 if(await limited('password-change:'+current.userId,5,15*60000))return response({error:'Too many attempts. Please wait 15 minutes.'},429);
 const account=await db().prepare('SELECT password_hash FROM accounts WHERE id=?').bind(current.userId).first<{password_hash:string}>();
 if(!account||!await passwordMatches(b.currentPassword,account.password_hash))return response({error:'Current password is incorrect.'},400);
 const recoveryCode=randomToken();
 const result=await db().prepare('UPDATE accounts SET password_hash=?,recovery_hash=? WHERE id=? AND password_hash=?').bind(await passwordHash(pass),await digest(recoveryCode),current.userId,account.password_hash).run();
 if(!result.meta.changes)return response({error:'Account changed. Please sign in again.'},409);
 await db().batch([db().prepare('DELETE FROM user_sessions WHERE user_id=?').bind(current.userId),db().prepare('DELETE FROM admin_sessions WHERE user_id=?').bind(current.userId)]);
 return response({ok:true,recoveryCode,signInRequired:true},200,'',true);
 }
 return response({error:'Unknown account action.'},400);
 }catch(e){return response({error:e instanceof InputError?e.message:'Unable to update your account. Please try again.'},e instanceof InputError?400:503);}
}
