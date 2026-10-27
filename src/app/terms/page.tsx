import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { Brand } from "@/components/Brand";
import "@/components/public.css";

export const metadata: Metadata = { title: "Terms · JobTrack" };

export default function TermsPage() {
  return (
    <main className="public-document">
      <header className="public-document-nav public-container">
        <Brand />
        <Link href="/">
          <ArrowLeft size={14} aria-hidden="true" />
          Back to home
        </Link>
      </header>
      <article className="public-document-body">
        <div className="public-step-icon">
          <ClipboardCheck size={21} aria-hidden="true" />
        </div>
        <span className="public-mini-eyebrow">A FEW SIMPLE EXPECTATIONS</span>
        <h1>Using JobTrack.</h1>
        <p className="public-document-lead">
          JobTrack is a personal organizer for your job search. By using this
          deployment, you agree to use it responsibly.
        </p>
        <section>
          <h2>Your account and information</h2>
          <p>
            Use an email address you control, keep your password private, and
            sign out on shared devices. You are responsible for the content and
            links you save. Only enter information you are permitted to store.
          </p>
        </section>
        <section>
          <h2>What the workspace does</h2>
          <p>
            JobTrack stores application details and links you provide. It does
            not submit job applications, contact employers, or verify the
            availability or accuracy of a job posting. Updating a status in
            JobTrack changes your personal record; it does not change an
            employer’s records.
          </p>
        </section>
        <section>
          <h2>External links</h2>
          <p>
            Application and status links lead to third-party websites. Their
            availability, security, and terms are controlled by those websites.
            Check the address before entering account credentials or personal
            information.
          </p>
        </section>
        <section>
          <h2>Responsible use</h2>
          <p>
            Do not attempt to access other people’s accounts, misuse the
            service, upload harmful content, or interfere with its availability.
            This service is provided as available, without a guarantee of
            uninterrupted access or a particular job-search outcome.
          </p>
        </section>
        <section>
          <h2>Availability and your records</h2>
          <p>
            The site may need time to load after inactivity or be temporarily
            unavailable. Keep an exported copy of important records. The
            operator may change or discontinue this deployment.
          </p>
        </section>
        <div className="public-document-end">
          <Link href="/privacy">Read the privacy information</Link>
          <Link href="/">Back to home</Link>
        </div>
      </article>
    </main>
  );
}
