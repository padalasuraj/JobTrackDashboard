import { AppShell } from "@/components/AppShell";
import { ApplicationDetailClient } from "@/components/ApplicationDetailClient";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  const { id } = await params;
  const application = user ? await prisma.application.findFirst({
    where: { id, userId: user.id },
    include: { job: { include: { company: true } }, resume: true, profile: true, events: { orderBy: { timestamp: "desc" } }, interviews: { orderBy: { scheduledAt: "asc" } }, reminders: { orderBy: { scheduledAt: "asc" } }, noteItems: { orderBy: { createdAt: "desc" } } }
  }) : null;
  if (!application || !user) notFound();
  const [resumes, profiles] = await Promise.all([
    prisma.resume.findMany({ where: { userId: user.id } }),
    prisma.profile.findMany({ where: { userId: user.id } })
  ]);
  return <AppShell><ApplicationDetailClient application={application as never} resumes={resumes} profiles={profiles} /></AppShell>;
}
