import {createClient} from "@supabase/supabase-js";
function json(data:unknown,status=200){return Response.json(data,{status,headers:{"Cache-Control":"no-store"}})}
export async function POST(request:Request){
 const authorization=request.headers.get("authorization")??"";const token=authorization.startsWith("Bearer ")?authorization.slice(7):"";
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,secret=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key||!secret)return json({error:"Secure student invitations are not configured on the server."},503);
 if(!token)return json({error:"Please sign in again."},401);
 const auth=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const {data:authData,error:authError}=await auth.auth.getUser(token);const actor=authData.user;
 if(authError||!actor||!actor.email_confirmed_at)return json({error:"Your verified sign-in could not be confirmed."},401);
 const body=await request.json().catch(()=>null) as {schoolId?:string;studentId?:string;email?:string}|null;
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,email=(body?.email??"").trim().toLowerCase();
 if(!body||!uuid.test(body.schoolId??"")||!uuid.test(body.studentId??"")||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return json({error:"Provide a valid student and email address."},400);
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:membership,error:me}=await admin.from("school_memberships").select("role,status").eq("school_id",body.schoolId).eq("user_id",actor.id).maybeSingle();
 if(me||!membership||membership.status!=="active"||!["school_admin","principal"].includes(membership.role))return json({error:"Only a school administrator or principal can invite student accounts."},403);
 const {data:student,error:studentError}=await admin.from("students").select("id,school_id,auth_user_id,email").eq("id",body.studentId).eq("school_id",body.schoolId).maybeSingle();
 if(studentError||!student)return json({error:"Student record not found."},404);
 if(student.auth_user_id)return json({error:"This student already has a linked login."},409);
 if(student.email&&student.email.toLowerCase()!==email)return json({error:"The invitation email must match the student record email. Update the student record first."},400);
 let user=null;
 for(let page=1;page<=20;page++){const {data,error}=await admin.auth.admin.listUsers({page,perPage:1000});if(error)return json({error:"Could not verify the student account."},502);user=data.users.find(u=>u.email?.toLowerCase()===email)??null;if(user||data.users.length<1000)break;}
 let invited=false;
 if(!user){const {data,error}=await admin.auth.admin.inviteUserByEmail(email);if(error||!data.user)return json({error:error?.message??"Could not send student invitation."},400);user=data.user;invited=true;}
 const {data:existing,error:existingError}=await admin.from("school_memberships").select("role,status").eq("school_id",body.schoolId).eq("user_id",user.id).maybeSingle();
 if(existingError)return json({error:"Could not verify existing school membership."},500);
 if(existing&&existing.role!=="student")return json({error:"This account already has another role in this school."},409);
 if(existing&&existing.status!=="active")return json({error:"This student account has a non-active school membership."},409);
 if(!existing){const {error}=await admin.from("school_memberships").insert({school_id:body.schoolId,user_id:user.id,role:"student",status:"active"});if(error)return json({error:"Student account exists but school membership could not be assigned. Retry linking."},500);}
 const {error:linkError}=await admin.from("students").update({auth_user_id:user.id,email}).eq("id",student.id).eq("school_id",body.schoolId);
 if(linkError)return json({error:"Student account exists but the student record could not be linked. Retry linking."},500);
 return json({linked:true,invited,role:"student",email},200);
}
