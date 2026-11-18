import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentWorkspace from "@/app/components/student-workspace";

export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (claimsError || !userId) redirect("/login");

  const [{ data: profile }, { data: courses }, { data: enrollments }, { data: progress }, { data: notifications }, { data: announcements }] = await Promise.all([
    supabase.from("profiles").select("display_name, preferred_language").eq("id", userId).maybeSingle(),
    supabase.from("courses").select("id,title,description,category,language,thumbnail_url").eq("status","published").order("created_at",{ascending:false}).limit(24),
    supabase.from("course_enrollments").select("course_id,enrolled_at").eq("student_id",userId),
    supabase.from("student_progress").select("lesson_id,completed,seconds_spent,last_seen_at").eq("student_id",userId),
    supabase.from("notifications").select("id,title,body,link,read_at,created_at").eq("user_id",userId).order("created_at",{ascending:false}).limit(5),
    supabase.from("announcements").select("id,title,body,published_at").eq("is_published",true).order("published_at",{ascending:false}).limit(4)
  ]);

  const enrolledIds = new Set((enrollments ?? []).map((item) => item.course_id));
  const enrolledCourses = (courses ?? []).filter((course) => enrolledIds.has(course.id));
  const completedLessons = (progress ?? []).filter((item) => item.completed).length;
  const totalMinutes = Math.round((progress ?? []).reduce((sum,item) => sum + (item.seconds_spent ?? 0),0)/60);

  return <StudentWorkspace
    name={profile?.display_name || "Learner"}
    courses={courses ?? []}
    enrolledCourses={enrolledCourses}
    enrolledIds={[...enrolledIds]}
    completedLessons={completedLessons}
    totalMinutes={totalMinutes}
    notifications={notifications ?? []}
    announcements={announcements ?? []}
  />;
}
