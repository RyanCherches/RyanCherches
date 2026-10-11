import { APP_COOKIE_PATH } from './app-path';
import { cookies } from 'next/headers';
import { db, digest } from './music';
export const SESSION_COOKIE='repertoire_session';
export const SESSION_SECONDS=60*60*24*7;
const encoder=new TextEncoder();
const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export const randomToken=()=>hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
export function timingEqual(a:string,b:string){let diff=a.length^b.length;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
export async function passwordHash(password:string,salt=randomToken()){
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 const result=await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256);
 return `pbkdf2-sha256:100000:${salt}:${hex(result)}`;
}
export async function passwordMatches(password:string,stored:string){
 const parts=stored.split(':');if(parts.length!==4||parts[0]!=='pbkdf2-sha256'||parts[1]!=='100000')return false;
 return timingEqual(await passwordHash(password,parts[2]),stored);
}
export function sessionCookie(token:string,seconds=SESSION_SECONDS){return `${SESSION_COOKIE}=${token}; Path=${APP_COOKIE_PATH}; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;}
export async function getAccount(){
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
 return db().prepare('SELECT a.id AS userId,a.username,a.email,p.name FROM user_sessions s JOIN accounts a ON a.id=s.user_id JOIN profiles p ON p.id=a.id WHERE s.token=? AND s.expires>?').bind(await digest(token),Date.now()).first<{userId:string;username:string;email:string;name:string}>();
}
export async function sessionStatement(userId:string){
 const token=randomToken();return {token,statement:db().prepare('INSERT INTO user_sessions(token,user_id,expires) VALUES(?,?,?)').bind(await digest(token),userId,Date.now()+SESSION_SECONDS*1000)};
}
export class InputError extends Error {}
export function username(value:unknown){if(typeof value!=='string'||! /^[a-zA-Z0-9_]{3,24}$/.test(value))throw new InputError('Use 3–24 letters, numbers, or underscores for your username.');return value.toLowerCase();}
export function email(value:unknown){if(typeof value!=='string'||value.trim().length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))throw new InputError('Enter a valid email address.');return value.trim().toLowerCase();}
export function password(value:unknown){if(typeof value!=='string'||value.length<12||value.length>128)throw new InputError('Use a password between 12 and 128 characters.');return value;}
export async function jsonBody(request:Request){
 if(!request.headers.get('content-type')?.includes('application/json'))throw new InputError('Send JSON data.');
 const reader=request.body?.getReader();if(!reader)throw new InputError('Request body is missing.');
 const chunks:Uint8Array[]=[];let size=0;for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>12000){await reader.cancel();throw new InputError('Request too large.');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 try{const value=JSON.parse(new TextDecoder().decode(bytes));if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value as Record<string,unknown>;}catch{throw new InputError('Invalid request.');}
}
