import { APP_COOKIE_PATH } from '../../../lib/app-path';
import { getAccount, jsonBody } from '../../../lib/accounts';
import { db, digest, isAdmin, limited, verifyPassword } from '../../../lib/music';
export const dynamic='force-dynamic';
const fail=(error:string,status=400)=>Response.json({error},{status});
function field(value:unknown,min:number,max:number) { if(typeof value!=='string'||value.trim().length<min||value.trim().length>max) throw new Error('Please check the required fields and their lengths.');return value.trim(); }
export async function POST(request:Request) {
 if(request.headers.get('origin')!==new URL(request.url).origin) return fail('Invalid request origin.',403);
 const user=await getAccount();if(!user)return fail('Sign in before continuing.',401);
 if(!request.headers.get('content-type')?.includes('application/json'))return fail('JSON required.',415);
 try {
 const b=await jsonBody(request);
 if(b.action==='profile') {
 const name=field(b.name,2,32);
 await db().prepare('INSERT INTO profiles(id,name,created) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name').bind(user.userId,name,Date.now()).run();
 } else if(b.action==='unlock') {
 if(await limited('admin:'+user.userId,5,15*60*1000))return fail('Too many attempts. Wait 15 minutes.',429);
 if(await limited('admin-global',100,15*60*1000))return fail('Admin sign-in is temporarily limited. Try later.',429);
 if(!await verifyPassword(field(b.password,1,200)))return fail('Incorrect administrator password.',403);
 const token=crypto.randomUUID()+crypto.randomUUID();
 await db().batch([db().prepare('DELETE FROM admin_sessions WHERE expires<=?').bind(Date.now()),db().prepare('INSERT INTO admin_sessions(token,user_id,expires) VALUES(?,?,?)').bind(await digest(token),user.userId,Date.now()+3600000)]);
 return Response.json({ok:true},{headers:{'Set-Cookie':`music_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=${APP_COOKIE_PATH}; Max-Age=3600`}});
 } else if(b.action==='lock') {
 const raw=request.headers.get('cookie')?.match(/(?:^|;\s*)music_admin=([^;]+)/)?.[1];
 if(raw)await db().prepare('DELETE FROM admin_sessions WHERE token=? AND user_id=?').bind(await digest(raw),user.userId).run();
 return Response.json({ok:true},{headers:{'Set-Cookie':`music_admin=; HttpOnly; Secure; SameSite=Strict; Path=${APP_COOKIE_PATH}; Max-Age=0`}});
 } else if(b.action==='submit') {
 const profile=await db().prepare('SELECT id FROM profiles WHERE id=?').bind(user.userId).first();if(!profile)return fail('Create your profile before submitting.');
 if(await limited('submit:'+user.userId,10,3600000))return fail('You can submit up to 10 pieces per hour.',429);
 const title=field(b.title,1,120),composer=field(b.composer,1,100),instrument=field(b.instrument,1,50),url=field(b.url,1,2000),notes=field(b.notes,10,3000);
 try {if(new URL(url).protocol!=='https:')return fail('Use an HTTPS recording or score link.');}catch{return fail('Enter a valid recording or score link.');}
 const fingerprint=await digest([title,composer,instrument].map(x=>x.toLowerCase().replace(/\s+/g,' ').trim()).join('|'));
 const duplicate=await db().prepare('SELECT status FROM pieces WHERE fingerprint=?').bind(fingerprint).first();if(duplicate)return fail('This piece and instrument have already been submitted.');
 await db().prepare('INSERT INTO pieces(id,user_id,title,composer,instrument,url,notes,fingerprint,status,difficulty,review,created) VALUES(?,?,?,?,?,?,?,?,\'pending\',0,\'\',?)').bind(crypto.randomUUID(),user.userId,title,composer,instrument,url,notes,fingerprint,Date.now()).run();
 } else if(b.action==='review') {
 if(!await isAdmin(user.userId))return fail('Unlock administrator access first.',403);
 const id=field(b.id,1,80),status=field(b.status,1,20),review=typeof b.review==='string'?b.review.trim().slice(0,1000):'';
 if(!['accepted','denied'].includes(status))return fail('Choose accept or deny.');
 const difficulty=Number(b.difficulty);
 if(status==='accepted'&&(!Number.isInteger(difficulty)||difficulty<1||difficulty>1000))return fail('Difficulty must be a whole number from 1 to 1000.');
 if(status==='denied'&&!review)return fail('Give a reason so the submitter understands the decision.');
 const result=await db().prepare('UPDATE pieces SET status=?,difficulty=?,review=?,reviewed=? WHERE id=?').bind(status,status==='accepted'?difficulty:0,review,Date.now(),id).run();
 if(!result.meta.changes)return fail('Submission not found.',404);
 } else return fail('Unknown action.');
 return Response.json({ok:true});
 }catch(e){ const message=e instanceof Error?e.message:'';return fail(message.startsWith('Please check')?message:'Unable to save. Please try again.'); }
}
