import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
export const db = () => { if(!env.DB) throw new Error('Database is not connected.'); return env.DB; };
export function points(difficulty:number, maximum:number) { return maximum ? Math.max(1,Math.round(100*difficulty/maximum)) : 0; }
export async function digest(value:string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))), b=>b.toString(16).padStart(2,'0')).join(''); }
export async function isAdmin(userId:string) {
 const token=(await cookies()).get('music_admin')?.value;
 if(!token) return false;
 return !!await db().prepare('SELECT token FROM admin_sessions WHERE token=? AND user_id=? AND expires>?').bind(await digest(token),userId,Date.now()).first();
}
export async function limited(key:string,max:number,window:number) {
 const now=Date.now();
 const row=await db().prepare('INSERT INTO rate_limits(key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<=? THEN 1 ELSE count+1 END, expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END RETURNING count').bind(key,now+window,now,now).first<{count:number}>();
 return !row || row.count>max;
}
export async function verifyPassword(password:string) {
 const secret=env.ADMIN_PASSWORD_HASH;
 if(!secret) throw new Error('Admin access has not been configured.');
 const [salt,expected]=secret.split(':');
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const result=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256);
 const actual=Array.from(new Uint8Array(result),b=>b.toString(16).padStart(2,'0')).join('');
 let diff=actual.length^expected.length; for(let i=0;i<actual.length;i++) diff|=actual.charCodeAt(i)^expected.charCodeAt(i); return diff===0;
}
