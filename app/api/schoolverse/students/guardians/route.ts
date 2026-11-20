import {createClient} from "@supabase/supabase-js";
function json(data:unknown,status=200){return Response.json(data,{status,headers:{"Cache-Control":"no-store"}})}
async function context(request:Request){
 const authorization=request.headers.get("authorization")??"";const token=authorization.startsWith("Bearer ")?authorization.slice(7):"";
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,secret=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key||!secret)return {error:json({error:"Secure guardian invitations are not configured on the server."},503)};
 if(!token)return {error:json({error:"Please sign in again."},401)};
 const auth=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await auth.auth.getUser(token);const actor=data.user;
 if(error||!actor||!actor.email_confirmed_at)return {error:json({error:"Your verified sign-in could not be confirmed."},401)};
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 return {actor,admin};
}
async function isSchoolLeader(admin:any,schoolId:string,userId:string){
 const {data,error}=await admin.from("school_memberships").select("role,status").eq("school_id",schoolId).eq("user_id",userId).maybeSingle();
 return !error&&data?.status==="active"&&["school_admin","principal"].includes(data.role);
}
async function findUser(admin:any,email:string){
 for(let page=1;page<=20;page++){const {data,error}=await admin.auth.admin.listUsers({page,perPage:1000});if(error)throw error;const user=data.users.find((u:any)=>u.email?.toLowerCase()===email);if(user)return user;if(data.users.length<1000)break;}
 return null;
}
export async function POST(request:Request){
 const ctx=await context(request);if("error" in ctx)return ctx.error;
 const body=await request.json().catch(()=>null) as {schoolId?:string;studentId?:string;email?:string;relationship?:string;isPrimary?:boolean}|null;
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 const email=(body?.email??"").trim().toLowerCase(),relationship=(body?.relationship??"").trim();
 if(!body||!uuid.test(body.schoolId??"")||!uuid.test(body.studentId??"")||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||relationship.length<2||relationship.length>60)return json({error:"Provide a valid student, guardian email and relationship."},400);
 if(!await isSchoolLeader(ctx.admin,body.schoolId,ctx.actor.id))return json({error:"Only a school administrator or principal can link guardians."},403);
 const {data:student,error:studentError}=await ctx.admin.from("students").select("id,school_id").eq("id",body.studentId).eq("school_id",body.schoolId).maybeSingle();
 if(studentError||!student)return json({error:"Student record not found."},404);
 try{
  let user=await findUser(ctx.admin,email),invited=false;
  if(!user){const {data,error}=await ctx.admin.auth.admin.inviteUserByEmail(email);if(error||!data.user)return json({error:error?.message??"Could not send guardian invitation."},400);user=data.user;invited=true;}
  const {data:membership,error:membershipError}=await ctx.admin.from("school_memberships").select("role,status").eq("school_id",body.schoolId).eq("user_id",user.id).maybeSingle();
  if(membershipError)return json({error:"Could not verify guardian school membership."},500);
  if(membership&&membership.role!=="parent")return json({error:"This account already has another role in this school. Resolve the existing membership before linking it as a guardian."},409);
  if(membership&&membership.status!=="active")return json({error:"This guardian account has a non-active school membership."},409);
  if(!membership){const {error}=await ctx.admin.from("school_memberships").insert({school_id:body.schoolId,user_id:user.id,role:"parent",status:"active"});if(error)return json({error:"Guardian account created but school access could not be assigned. Retry the invitation."},500);}
  const {data:link,error:linkError}=await ctx.admin.from("student_guardians").insert({school_id:body.schoolId,student_id:body.studentId,guardian_user_id:user.id,guardian_email:email,relationship,is_primary:body.isPrimary===true,verified_at:null,verified_by:null}).select("id").single();
  if(linkError)return json({error:linkError.code==="23505"?"This guardian is already linked to the student.": "Could not create guardian link."},linkError.code==="23505"?409:400);
  return json({guardianLinkId:link.id,invited,verified:false},201);
 }catch{return json({error:"Guardian account lookup failed. Please retry."},502);}
}
export async function PATCH(request:Request){
 const ctx=await context(request);if("error" in ctx)return ctx.error;
 const body=await request.json().catch(()=>null) as {schoolId?:string;guardianLinkId?:string}|null;
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 if(!body||!uuid.test(body.schoolId??"")||!uuid.test(body.guardianLinkId??""))return json({error:"A valid school and guardian link are required."},400);
 if(!await isSchoolLeader(ctx.admin,body.schoolId,ctx.actor.id))return json({error:"Only a school administrator or principal can verify guardians."},403);
 const {data,error}=await ctx.admin.from("student_guardians").update({verified_at:new Date().toISOString(),verified_by:ctx.actor.id}).eq("id",body.guardianLinkId).eq("school_id",body.schoolId).is("verified_at",null).select("id").maybeSingle();
 if(error)return json({error:"Could not verify guardian relationship."},400);
 if(!data)return json({error:"Guardian link was not found or is already verified."},404);
 return json({verified:true});
}
