import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  CircleDot,
  ExternalLink,
  Link2,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import "@/components/public.css";

const previewRows = [
  {
    company: "Acme Studio",
    initial: "A",
    role: "Frontend Developer",
    salary: "₹8–12 LPA",
    status: "Interview",
    color: "violet",
  },
  {
    company: "Northstar",
    initial: "N",
    role: "Software Engineer",
    salary: "₹10–15 LPA",
    status: "Applied",
    color: "blue",
  },
  {
    company: "Orbit Labs",
    initial: "O",
    role: "Java Developer",
    salary: "₹6–10 LPA",
    status: "Saved",
    color: "sand",
  },
];

export default function Home() {
  return (
    <div className="public-site">
      <header className="public-nav public-container">
        <Brand />
        <nav className="public-nav-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <Link href="/login">Sign in</Link>
          <Link
            className="public-button public-button-dark public-nav-cta"
            href="/register"
          >
            Get started <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </nav>
      </header>
      <main>
        <section className="public-hero public-container">
          <div className="public-eyebrow">
            <span /> A little structure. A lot more clarity.
          </div>
          <h1>
            Your next role.
            <br />
            <span>A clearer path.</span>
          </h1>
          <p>
            Keep every application, status, and important link in one calm
            workspace. Less searching through tabs. More moving forward.
          </p>
          <div className="public-hero-actions">
            <Link
              className="public-button public-button-primary"
              href="/register"
            >
              Create your workspace <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className="public-text-link" href="/login">
              Already have an account? Sign in{" "}
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="public-hero-notes">
            <span>
              <Check size={14} aria-hidden="true" /> Free to get started
            </span>
            <span>
              <Check size={14} aria-hidden="true" /> Google or email sign-in
            </span>
            <span>
              <Check size={14} aria-hidden="true" /> Your own private workspace
            </span>
          </div>
          <div
            className="public-preview"
            aria-label="Illustrative preview of the applications workspace"
          >
            <div className="public-preview-bar">
              <div className="public-window-dots">
                <i />
                <i />
                <i />
              </div>
              <span>YOUR JOB SEARCH, ORGANIZED</span>
              <span className="public-preview-label">Sample workspace</span>
            </div>
            <div className="public-preview-body">
              <div className="public-preview-heading">
                <div>
                  <span className="public-mini-eyebrow">MY WORKSPACE</span>
                  <h2>
                    Applications<span>3</span>
                  </h2>
                  <p>Every opportunity. All in one place.</p>
                </div>
                <span className="public-preview-add">
                  <Plus size={15} aria-hidden="true" /> Add application
                </span>
              </div>
              <div className="public-preview-tabs">
                <span className="selected">
                  All applications <b>3</b>
                </span>
                <span>
                  Applied <b>1</b>
                </span>
                <span>
                  Interviews <b>1</b>
                </span>
                <span>
                  Saved <b>1</b>
                </span>
              </div>
              <div className="public-preview-table-wrap">
                <table className="public-preview-table">
                  <thead>
                    <tr>
                      <th>COMPANY & ROLE</th>
                      <th>PACKAGE</th>
                      <th>STATUS</th>
                      <th>YOUR LINKS</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr key={row.company}>
                        <td>
                          <div className="public-preview-company">
                            <span
                              className={`public-company-mark ${row.color}`}
                            >
                              {row.initial}
                            </span>
                            <div>
                              <strong>{row.company}</strong>
                              <small>{row.role}</small>
                            </div>
                          </div>
                        </td>
                        <td>{row.salary}</td>
                        <td>
                          <span
                            className={`public-status ${row.status.toLowerCase()}`}
                          >
                            <CircleDot size={12} aria-hidden="true" />
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <span className="public-preview-links">
                            <span>
                              <ExternalLink size={13} aria-hidden="true" />{" "}
                              Apply
                            </span>
                            <span>
                              <Link2 size={13} aria-hidden="true" /> Status
                            </span>
                          </span>
                        </td>
                        <td>
                          <ArrowUpRight size={16} aria-hidden="true" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="public-preview-bottom">
                <ShieldCheck size={14} aria-hidden="true" />
                <span>
                  Your real workspace starts empty. Add the opportunities that
                  matter to you.
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="public-how public-container" id="how-it-works">
          <div className="public-section-heading">
            <span className="public-mini-eyebrow">THOUGHTFULLY SIMPLE</span>
            <h2>A better way to keep track.</h2>
            <p>
              Just the essentials, from the first application to the next offer.
            </p>
          </div>
          <div className="public-steps">
            <article>
              <span className="public-step-number">01</span>
              <div className="public-step-icon">
                <Plus size={21} aria-hidden="true" />
              </div>
              <h3>Save the opportunity</h3>
              <p>
                Add a company, role, package, and application link. Everything
                you need, without the clutter.
              </p>
            </article>
            <article>
              <span className="public-step-number">02</span>
              <div className="public-step-icon">
                <Link2 size={21} aria-hidden="true" />
              </div>
              <h3>Keep your links together</h3>
              <p>
                Open the job posting or your application status page directly
                from your table.
              </p>
            </article>
            <article>
              <span className="public-step-number">03</span>
              <div className="public-step-icon">
                <CheckCheck size={21} aria-hidden="true" />
              </div>
              <h3>Move your search forward</h3>
              <p>
                Update statuses, find an application quickly, and export your
                records whenever you need them.
              </p>
            </article>
          </div>
        </section>
        <section className="public-bottom-cta public-container">
          <div>
            <span className="public-mini-eyebrow">
              MAKE ROOM FOR WHAT’S NEXT
            </span>
            <h2>Your job search deserves a home.</h2>
            <p>Start with one application. Build a clearer picture.</p>
          </div>
          <Link
            className="public-button public-button-primary"
            href="/register"
          >
            Let’s get organized <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      </main>
      <footer className="public-footer public-container">
        <Brand />
        <p>One workspace. Every opportunity.</p>
        <nav className="public-footer-links" aria-label="Footer navigation">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/login">
            Your workspace <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </nav>
      </footer>
    </div>
  );
}
