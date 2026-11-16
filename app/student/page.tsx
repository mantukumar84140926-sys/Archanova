import PortalDashboard from "../components/portal-dashboard";
import { requireRoles } from "@/lib/supabase/guards";

export default async function StudentPage() {
  await requireRoles(["student", "teacher", "admin"]);
  return <PortalDashboard role="student" />;
}
