import { AppShell } from "@/components/AppShell";
import { ApplicationTable, Filters } from "@/components/DashboardClient";
import { currentUser } from "@/lib/auth";
import { applicationWhere } from "@/lib/insights";
import { prisma } from "@/lib/prisma";

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await currentUser();
  const paramsObj = await searchParams;
  const params = new URLSearchParams(Object.entries(paramsObj).filter(([, v]) => v) as [string, string][]);
  const applications = user ? await prisma.application.findMany({
    where: applicationWhere(user.id, params),
    include: { job: { include: { company: true } }, resume: true, interviews: { orderBy: { scheduledAt: "asc" } } },
    orderBy: { updatedAt: "desc" }
  }) : [];
  return <AppShell><div className="grid"><div className="topbar"><h1>Applications</h1></div><Filters initialStatus={paramsObj.status} /><ApplicationTable applications={applications as never} /></div></AppShell>;
}
