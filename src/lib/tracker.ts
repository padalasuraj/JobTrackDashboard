export const applicationStatuses = [
  ["SAVED", "Saved"],
  ["APPLIED", "Applied"],
  ["ASSESSMENT", "Assessment"],
  ["INTERVIEW", "Interview"],
  ["OFFER", "Offer"],
  ["REJECTED", "Rejected"],
  ["WITHDRAWN", "Withdrawn"],
] as const;
export type ApplicationStatus = (typeof applicationStatuses)[number][0];
export type Application = {
  id: string;
  company: string;
  title: string;
  salary: string;
  location: string;
  workMode: "UNSPECIFIED" | "REMOTE" | "HYBRID" | "ONSITE";
  status: ApplicationStatus;
  applicationUrl: string;
  statusUrl: string;
  appliedDate: string;
  deadline: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};
export type ApplicationInput = Omit<
  Application,
  "id" | "createdAt" | "updatedAt"
>;
export type User = {
  id: string;
  name: string;
  email: string;
  provider: string;
};
export type ApplicationPage = {
  applications: Application[];
  page: number;
  totalPages: number;
  totalElements: number;
  summary: {
    total: number;
    active: number;
    interviews: number;
    offers: number;
  };
};
export const emptyApplication: ApplicationInput = {
  company: "",
  title: "",
  salary: "",
  location: "",
  workMode: "UNSPECIFIED",
  status: "SAVED",
  applicationUrl: "",
  statusUrl: "",
  appliedDate: "",
  deadline: "",
  notes: "",
};
export function statusLabel(status: ApplicationStatus) {
  return applicationStatuses.find(([value]) => value === status)?.[1] || status;
}
export function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
}
export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}
export function isSafeUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !!url.hostname &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export function toApplicationInput(app: Application): ApplicationInput {
  return Object.fromEntries(
    Object.keys(emptyApplication).map((key) => [
      key,
      app[key as keyof Application] ?? "",
    ]),
  ) as ApplicationInput;
}
