import { AppShell } from "@/components/AppShell";
import { ResourceManager } from "@/components/ResourceManager";

export default function ProfilesPage() {
  return <AppShell><ResourceManager title="Personal Profiles" endpoint="/profiles" fields={[
    { name: "label", label: "Profile label", required: true },
    { name: "name", label: "Name", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone" },
    { name: "location", label: "Location" },
    { name: "linkedin", label: "LinkedIn" },
    { name: "github", label: "GitHub" },
    { name: "portfolio", label: "Portfolio" },
    { name: "education", label: "Education", type: "textarea" },
    { name: "experience", label: "Experience", type: "textarea" },
    { name: "skills", label: "Skills", type: "textarea" },
    { name: "otherInfo", label: "Other information", type: "textarea" }
  ]} /></AppShell>;
}
