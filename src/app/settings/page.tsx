import { AppShell } from "@/components/AppShell";
import { SettingsClient } from "@/components/SettingsClient";
import { currentUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await currentUser();
  return <AppShell>{user ? <SettingsClient name={user.name} email={user.email} /> : null}</AppShell>;
}
