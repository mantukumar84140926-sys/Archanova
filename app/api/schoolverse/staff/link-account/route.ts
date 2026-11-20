import { createClient } from "@supabase/supabase-js";
function json(data:unknown,status=200){return Response.json(data,{status,headers:{"Cache-Control":"no-store"}})}
export async function POST(request:Request){
 const authorization=request.headers.get("authorization")??"";const token=authorization.startsWith("Bearer ")?authorization.slice(7):"";
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const publishableKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;const secretKey=process.env.SUPABASE_SECRET_KEY;
 if(!url||!publishableKey||!secretKey)return json({error:"Secure staff invitations are not configured on the server."},503);
 if(!token)return json({error:"Please sign in again."},401);
 const auth=createClient(url,publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:authData,error:authError}=await auth.auth.getUser(token);const actor=authData.user;
 if(authError||!actor||!actor.email_confirmed_at)return json({error:"Your verified sign-in could not be confirmed."},401);
 const body=await request.json().catch(()=>null) as {schoolId?:string;staffId?:string;email?:string;role?:string}|null;
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 const email=(body?.email??"").trim().toLowerCase();const role=body?.role??"teacher";const schoolId=body?.schoolId??"",staffId=body?.staffId??"";
 if(!body||!uuid.test(schoolId)||!uuid.test(staffId)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!["teacher","accountant","principal"].includes(role))return json({error:"Provide a valid staff record, email and role."},400);
 const admin=createClient(url,secretKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:membership,error:membershipError}=await admin.from("school_memberships").select("role,status").eq("school_id",schoolId).eq("user_id",actor.id).maybeSingle();
 if(membershipError||!membership||membership.status!=="active"||!["school_admin","principal"].includes(membership.role))return json({error:"Only an active school administrator or principal can invite staff."},403);
 const {data:staff,error:staffError}=await admin.from("staff").select("id,school_id,auth_user_id,email,first_name,last_name,portal_role").eq("id",staffId).eq("school_id",schoolId).maybeSingle();
 if(staffError||!staff)return json({error:"Staff record not found in this school."},404);
 if(staff.auth_user_id)return json({error:"This staff record is already linked to a login account."},409);
 if(staff.portal_role!==role)return json({error:"The selected login role must match the staff record portal role."},400);
 if(staff.email&&staff.email.toLowerCase()!==email)return json({error:"The invitation email must match the staff record email. Update the staff record first."},400);
 let invitedUser:null|{id:string}=null;
 for(let page=1;page<=20;page++){
  const {data,error}=await admin.auth.admin.listUsers({page,perPage:1000});
  if(error)return json({error:"Could not verify the staff account. Try again later."},502);
  const found=data.users.find(u=>u.email?.toLowerCase()===email);
  if(found){invitedUser={id:found.id};break;}
  if(data.users.length<1000)break;
 }
 if(!invitedUser){
  const {data,error}=await admin.auth.admin.inviteUserByEmail(email,{data:{display_name:[staff.first_name,staff.last_name].filter(Boolean).join(" ")}});
  if(error||!data.user)return json({error:error?.message??"Could not send the staff invitation."},400);
  invitedUser={id:data.user.id};
 }
 const {data:existing,error:existingError}=await admin.from("school_memberships").select("role,status").eq("school_id",schoolId).eq("user_id",invitedUser.id).maybeSingle();
 if(existingError)return json({error:"Could not verify the user's school membership."},500);
 if(existing&&existing.role!==role)return json({error:"This account already has a different role in this school. A school administrator must resolve the existing membership first."},409);
 if(existing&&existing.status!=="active")return json({error:"This account has a non-active membership. Reactivate it through the trusted admin process."},409);
 if(!existing){
  const {error}=await admin.from("school_memberships").insert({school_id:schoolId,user_id:invitedUser.id,role,status:"active"});
  if(error)return json({error:"The invitation was created but membership could not be assigned. Retry linking this staff account."},500);
 }
 const {error:linkError}=await admin.from("staff").update({auth_user_id:invitedUser.id,email,portal_role:role}).eq("id",staff.id).eq("school_id",schoolId);
 if(linkError)return json({error:"The account was invited but staff linking failed. Retry linking this staff account."},500);
 return json({linked:true,invited:!existing,role,email},200);
}
