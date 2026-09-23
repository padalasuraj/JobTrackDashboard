import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const jobSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  jobId: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  workMode: z.enum(["ONSITE", "HYBRID", "REMOTE", "UNKNOWN"]).default("UNKNOWN"),
  salaryMin: z.coerce.number().int().optional().nullable(),
  salaryMax: z.coerce.number().int().optional().nullable(),
  salaryCurrency: z.string().default("INR"),
  experience: z.string().optional().nullable(),
  employmentType: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  skills: z.string().optional().nullable(),
  jobUrl: z.string().url().optional().nullable().or(z.literal("")),
  applicationUrl: z.string().url().optional().nullable().or(z.literal("")),
  companyUrl: z.string().url().optional().nullable().or(z.literal("")),
  postedDate: z.string().optional().nullable(),
  closingDate: z.string().optional().nullable(),
  source: z.string().optional().nullable()
});

export const applicationSchema = z.object({
  jobId: z.string().min(1),
  resumeId: z.string().optional().nullable(),
  profileId: z.string().optional().nullable(),
  status: z.enum([
    "SAVED",
    "APPLIED",
    "OA",
    "IN_PROGRESS",
    "PHONE_SCREEN",
    "TECHNICAL_INTERVIEW",
    "HR_INTERVIEW",
    "SELECTED",
    "OFFER",
    "REJECTED",
    "WITHDRAWN",
    "ON_HOLD"
  ]).default("SAVED"),
  appliedAt: z.string().optional().nullable(),
  progressUrl: z.string().optional().nullable(),
  recruiterUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export const profileSchema = z.object({
  label: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  github: z.string().optional().nullable(),
  portfolio: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
  skills: z.string().optional().nullable(),
  otherInfo: z.string().optional().nullable()
});

export const resumeSchema = z.object({
  name: z.string().min(1),
  targetRole: z.string().optional().nullable(),
  version: z.string().default("1.0"),
  fileName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isDefault: z.boolean().default(false)
});

export const interviewSchema = z.object({
  applicationId: z.string().min(1),
  round: z.string().min(1),
  type: z.string().optional().nullable(),
  scheduledAt: z.string().datetime(),
  duration: z.coerce.number().int().optional().nullable(),
  meetingUrl: z.string().optional().nullable(),
  interviewer: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  result: z.string().optional().nullable()
});

export const reminderSchema = z.object({
  applicationId: z.string().optional().nullable(),
  type: z.enum(["FOLLOW_UP", "APPLICATION_DEADLINE", "INTERVIEW", "OA", "CUSTOM"]),
  message: z.string().min(1),
  scheduledAt: z.string().datetime(),
  completed: z.boolean().optional()
});
