import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      className={`public-brand${light ? " public-brand-light" : ""}`}
      href="/"
      aria-label="JobTrack home"
    >
      <span className="public-brand-mark">
        <BriefcaseBusiness size={19} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span>
        jobtrack<span className="public-brand-dot">.</span>
      </span>
    </Link>
  );
}
