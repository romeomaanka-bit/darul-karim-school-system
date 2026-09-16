import { DashboardShell } from "../../../components/dashboard-shell";
import { ResourceWorkspace } from "../../../components/resource-workspace";

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <DashboardShell><ResourceWorkspace section={section} /></DashboardShell>;
}
