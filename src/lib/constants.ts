export const statuses = [
  ["SAVED", "Saved"],
  ["APPLIED", "Applied"],
  ["OA", "OA"],
  ["IN_PROGRESS", "In Progress"],
  ["PHONE_SCREEN", "Phone Screen"],
  ["TECHNICAL_INTERVIEW", "Technical Interview"],
  ["HR_INTERVIEW", "HR Interview"],
  ["SELECTED", "Selected"],
  ["OFFER", "Offer"],
  ["REJECTED", "Rejected"],
  ["WITHDRAWN", "Withdrawn"],
  ["ON_HOLD", "On Hold"]
] as const;

export const workModes = [
  ["UNKNOWN", "Unknown"],
  ["ONSITE", "Onsite"],
  ["HYBRID", "Hybrid"],
  ["REMOTE", "Remote"]
] as const;

export function labelStatus(value?: string | null) {
  return statuses.find(([key]) => key === value)?.[1] ?? "Unknown";
}

export function salaryLabel(min?: number | null, max?: number | null, currency = "INR") {
  if (!min && !max) return "Not disclosed";
  const fmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  if (min && max) return `${currency} ${fmt.format(min)}-${fmt.format(max)}`;
  if (min) return `${currency} ${fmt.format(min)}+`;
  return `Up to ${currency} ${fmt.format(max ?? 0)}`;
}
