"use client";

import { statuses } from "@/lib/constants";

export function StatusSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {statuses.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </select>
  );
}
