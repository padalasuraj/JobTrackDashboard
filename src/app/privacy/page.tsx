import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/Brand";
import "@/components/public.css";

export const metadata: Metadata = { title: "Privacy · JobTrack" };

export default function PrivacyPage() {
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
          <ShieldCheck size={21} aria-hidden="true" />
        </div>
        <span className="public-mini-eyebrow">
          YOUR WORKSPACE, YOUR INFORMATION
        </span>
        <h1>Privacy, in plain language.</h1>
        <p className="public-document-lead">
          JobTrack stores the information you need to organize your job search.
          Here is what that means when you use this site.
        </p>
        <section>
          <h2>Your account</h2>
          <p>
            When you register with email, JobTrack stores your name, email
            address, and a password hash. It does not store your password as
            plain text. If you sign in with Google, JobTrack uses your Google
            account identity and verified email address. It does not request
            access to your Gmail inbox.
          </p>
        </section>
        <section>
          <h2>Your applications</h2>
          <p>
            JobTrack stores the companies, roles, packages, statuses, links,
            dates, locations, and notes you choose to enter. The application
            workspace requires sign-in, and application records are associated
            with the account that created them. Avoid adding identity documents,
            financial details, or other sensitive information to notes.
          </p>
        </section>
        <section>
          <h2>Cookies and service providers</h2>
          <p>
            A necessary session cookie keeps you signed in. Google sign-in also
            uses a short-lived cookie to check that the sign-in request belongs
            to you. JobTrack does not add advertising trackers or analytics
            cookies.
          </p>
          <p>
            The providers hosting this site and its database may process
            technical information, such as request logs, to operate their
            services. If you choose Google sign-in, Google handles that part of
            the sign-in process under its{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              privacy policy
            </a>
            . If password reset emails are enabled, an email provider processes
            the recipient address and reset message.
          </p>
        </section>
        <section>
          <h2>Exporting and deleting records</h2>
          <p>
            You can export your applications as a CSV file and delete individual
            applications from your workspace. Deleted records are removed from
            the active application database; hosting providers may retain their
            own backups or logs. For questions about account information or this
            specific deployment, contact the person or organization operating
            this site.
          </p>
        </section>
        <section>
          <h2>A useful habit</h2>
          <p>
            Keep an occasional export of the records you want to retain. Never
            include passwords or private access tokens in saved links.
          </p>
        </section>
        <div className="public-document-end">
          <Link href="/terms">Read the terms of use</Link>
          <Link href="/register">Create an account</Link>
        </div>
      </article>
    </main>
  );
}
