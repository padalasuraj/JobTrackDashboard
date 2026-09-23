import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

const links = [
  ["/dashboard", "Dashboard"],
  ["/add", "Add Job"],
  ["/applications", "Applications"],
  ["/resumes", "Resumes"],
  ["/profiles", "Profiles"],
  ["/interviews", "Interviews"],
  ["/reminders", "Reminders"],
  ["/analytics", "Analytics"],
  ["/settings", "Settings"]
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">JobTrack</div>
        <nav className="nav">
          {links.map(([href, label]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
          <LogoutButton />
        </nav>
        <p className="muted" style={{ marginTop: "1.5rem" }}>{user?.name}<br />{user?.email}</p>
      </aside>
      <section className="content">{children}</section>
    </main>
  );
}
