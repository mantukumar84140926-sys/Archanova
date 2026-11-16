import PortalDashboard from "../components/portal-dashboard";
import { requireRoles } from "@/lib/supabase/guards";

export default async function AdminPage() {
  await requireRoles(["admin"]);
  return <PortalDashboard role="admin" />;
}
