import PortalDashboard from "../components/portal-dashboard";
import { requireRoles } from "@/lib/supabase/guards";

export default async function TeacherPage() {
  await requireRoles(["teacher", "admin"]);
  return <PortalDashboard role="teacher" />;
}
