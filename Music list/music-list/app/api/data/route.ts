import { getAccount } from '../../../lib/accounts';
import { db, isAdmin, points } from '../../../lib/music';
export const dynamic='force-dynamic';
export async function GET() {
 try {
 const user=await getAccount();
 const admin=user ? await isAdmin(user.userId):false;
 const profile=user ? await db().prepare('SELECT name FROM profiles WHERE id=?').bind(user.userId).first():null;
 const all=(await db().prepare("SELECT p.id,p.title,p.composer,p.instrument,p.url,p.difficulty,p.user_id,p.created,a.name FROM pieces p JOIN profiles a ON a.id=p.user_id WHERE p.status='accepted' ORDER BY p.difficulty DESC,p.created ASC").all<{id:string;title:string;composer:string;instrument:string;url:string;difficulty:number;user_id:string;created:number;name:string}>()).results;
 const max=Number(all[0]?.difficulty||0);
 const list=all.map((p,i)=>({...p,rank:i+1,points:points(Number(p.difficulty),max)}));
 const leaders=new Map<string,{name:string,points:number,count:number}>();
 for(const p of list) { const id=String(p.user_id);const a=leaders.get(id)||{name:String(p.name),points:0,count:0};a.points+=p.points;a.count++;leaders.set(id,a); }
 const mine=user?(await db().prepare('SELECT * FROM pieces WHERE user_id=? ORDER BY created DESC').bind(user.userId).all()).results.map(p=>({...p,points:p.status==='accepted'?points(Number(p.difficulty),max):0})):[];
 const queue=admin?(await db().prepare("SELECT p.*,a.name FROM pieces p JOIN profiles a ON a.id=p.user_id ORDER BY CASE WHEN status='pending' THEN 0 ELSE 1 END,created DESC LIMIT 300").all()).results:[];
 return Response.json({user:user?{name:profile?.name||null,username:user.username,email:user.email}:null,admin,list:list.map(({user_id,...p})=>p),mine,queue,leaders:[...leaders.values()].sort((a,b)=>b.points-a.points),total:mine.reduce((s,p)=>s+p.points,0)},{headers:{'Cache-Control':'no-store'}});
 } catch {return Response.json({error:'Unable to load the collection. Please try again.'},{status:503});}
}
