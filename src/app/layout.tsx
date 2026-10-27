import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "JobTrack — Your next chapter, organized.",
    template: "%s | JobTrack",
  },
  description:
    "A focused workspace for your job search. Track applications, manage statuses, and keep every important link together.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
