import { hashPassword } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@jobtrack.local" },
    update: {},
    create: { name: "Demo User", email: "demo@jobtrack.local", passwordHash: await hashPassword("Password123"), emailVerifiedAt: new Date() }
  });
  const profile = await prisma.profile.upsert({
    where: { id: "seed-profile" },
    update: {},
    create: { id: "seed-profile", userId: user.id, label: "Full Stack Profile", name: user.name, email: user.email, location: "Bengaluru", skills: "TypeScript, React, Node.js, PostgreSQL" }
  });
  const resume = await prisma.resume.upsert({
    where: { id: "seed-resume" },
    update: {},
    create: { id: "seed-resume", userId: user.id, name: "Full Stack Resume", targetRole: "Software Engineer", version: "1.0", isDefault: true }
  });
  const companies = ["Barclays", "Mastercard", "Juspay"];
  for (const name of companies) {
    await prisma.company.upsert({ where: { name }, update: {}, create: { name, websiteUrl: `https://${name.toLowerCase()}.example.com` } });
  }
  const barclays = await prisma.company.findUniqueOrThrow({ where: { name: "Barclays" } });
  const mastercard = await prisma.company.findUniqueOrThrow({ where: { name: "Mastercard" } });
  const juspay = await prisma.company.findUniqueOrThrow({ where: { name: "Juspay" } });
  const jobs = [
    { companyId: barclays.id, title: "Backend Engineer", jobId: "BAR-2451", location: "Pune", salaryMin: 1200000, salaryMax: 1800000, closingDate: new Date(Date.now() + 2 * 86400000), skills: "Java, Spring, PostgreSQL" },
    { companyId: mastercard.id, title: "Software Engineer II", jobId: "MC-892", location: "Hybrid Bengaluru", salaryMin: 1800000, salaryMax: 2400000, closingDate: new Date(Date.now() + 12 * 86400000), skills: "React, Node.js, Payments" },
    { companyId: juspay.id, title: "Full Stack Developer", jobId: "JP-FS-22", location: "Remote", salaryMin: 1600000, salaryMax: 2200000, closingDate: null, skills: "Haskell, React, APIs" }
  ];
  for (const item of jobs) {
    const job = await prisma.job.create({ data: { ...item, workMode: item.location.includes("Remote") ? "REMOTE" : "HYBRID", salaryCurrency: "INR", jobUrl: "https://example.com/job", applicationUrl: "https://example.com/apply" } });
    const app = await prisma.application.create({
      data: {
        userId: user.id,
        jobId: job.id,
        resumeId: resume.id,
        profileId: profile.id,
        status: item.title.includes("Backend") ? "APPLIED" : item.title.includes("Engineer II") ? "TECHNICAL_INTERVIEW" : "OA",
        appliedAt: new Date(),
        notes: "Seeded development application.",
        events: { create: [{ type: "seed", description: "Application imported from seed data" }] }
      }
    });
    if (item.title.includes("Engineer II")) {
      await prisma.interview.create({ data: { applicationId: app.id, round: "Technical Interview", type: "Technical", scheduledAt: new Date(Date.now() + 86400000), duration: 60, meetingUrl: "https://meet.example.com/mastercard" } });
    }
    await prisma.reminder.create({ data: { userId: user.id, applicationId: app.id, type: "FOLLOW_UP", message: `Follow up with ${companies[jobs.indexOf(item)]}`, scheduledAt: new Date(Date.now() + 3 * 86400000) } });
  }
}

main().finally(async () => prisma.$disconnect());
