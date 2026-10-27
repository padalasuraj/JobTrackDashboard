"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  ExternalLink,
  FileText,
  ListFilter,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { useUser } from "@/components/AppShell";
import { api, ApiError } from "@/lib/api";
import {
  applicationStatuses,
  emptyApplication,
  formatDate,
  initials,
  isSafeUrl,
  toApplicationInput,
  type Application,
  type ApplicationInput,
  type ApplicationPage,
  type ApplicationStatus,
} from "@/lib/tracker";

const filters: [string, string][] = [
  ["", "All applications"],
  ["SAVED", "Saved"],
  ["APPLIED", "Applied"],
  ["INTERVIEW", "Interviews"],
  ["OFFER", "Offers"],
];

export function ApplicationWorkspace() {
  const user = useUser();
  const router = useRouter();
  const [data, setData] = useState<ApplicationPage | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("updated");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<Application | "new" | null>(null);
  const [deleting, setDeleting] = useState<Application | null>(null);
  const [busyId, setBusyId] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({
      search: query,
      status,
      sort,
      page: String(page),
      size: String(size),
    });
    api<ApplicationPage>(`/api/applications?${params}`, {
      signal: controller.signal,
    })
      .then((result) => {
        if (page > 0 && !result.applications.length) {
          setPage((p) => p - 1);
          return;
        }
        setData(result);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        if (err instanceof ApiError && err.status === 401)
          router.replace("/login");
        else setError(err.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [query, status, sort, page, size, refresh, router]);

  function changed(message: string) {
    setRefresh((r) => r + 1);
    setNotice(message);
  }
  async function changeStatus(app: Application, value: ApplicationStatus) {
    setBusyId(app.id);
    try {
      await api(`/api/applications/${app.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: value }),
      });
      changed("Application status updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update status.");
    } finally {
      setBusyId("");
    }
  }
  async function exportCsv() {
    setExporting(true);
    try {
      const response = await fetch("/api/applications/export", {
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(
          "Unable to export your applications. Please try again.",
        );
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "jobtrack-applications.csv";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Your applications have been exported.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }
  const summary = data?.summary;
  const stats = [
    {
      label: "Total applications",
      value: summary?.total,
      Icon: BriefcaseBusiness,
      text: "Every opportunity, in one place",
      className: "teal",
    },
    {
      label: "In progress",
      value: summary?.active,
      Icon: Clock3,
      text: "Applications moving forward",
      className: "blue",
    },
    {
      label: "Interviews",
      value: summary?.interviews,
      Icon: CircleCheck,
      text: "Conversations that count",
      className: "violet",
    },
    {
      label: "Offers received",
      value: summary?.offers,
      Icon: Trophy,
      text: "Your hard work paying off",
      className: "amber",
    },
  ];
  const firstName = user?.name.trim().split(/\s+/)[0] || "there";
  return (
    <div className="applications-workspace">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
          <h1>
            Your applications<span className="heading-period">.</span>
          </h1>
          <p>
            A little more organized. A lot more focused. You’ve got this,{" "}
            {firstName}.
          </p>
        </div>
        <button
          className="button primary add-application"
          onClick={() => setEditing("new")}
        >
          <Plus size={18} /> Add application
        </button>
      </div>
      <div className="summary-grid">
        {stats.map(({ label, value, Icon, text, className }) => (
          <div key={label} className="summary-card">
            <div className="summary-top">
              <span>{label}</span>
              <span className={`summary-icon ${className}`}>
                <Icon size={18} />
              </span>
            </div>
            <strong>{value ?? "—"}</strong>
            <p>{text}</p>
          </div>
        ))}
      </div>
      <section
        className="applications-panel"
        aria-labelledby="applications-title"
      >
        <div className="panel-title-row">
          <div>
            <h2 id="applications-title">
              Application tracker{" "}
              <span className="count-badge">{summary?.total ?? 0}</span>
            </h2>
            <p>All your opportunities. Every important link.</p>
          </div>
          <button
            className="button secondary export-button"
            onClick={exportCsv}
            disabled={exporting || !summary?.total}
          >
            {exporting ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <ArrowDownToLine size={16} />
            )}{" "}
            Export CSV
          </button>
        </div>
        <div className="tracker-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              aria-label="Search applications"
              placeholder="Search company, role or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="icon-button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div className="toolbar-filters">
            <label className="filter-control">
              <ListFilter size={15} />
              <span className="sr-only">Filter by status</span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All statuses</option>
                {applicationStatuses.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-control">
              <span className="sr-only">Sort applications</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(0);
                }}
              >
                <option value="updated">Recently updated</option>
                <option value="applied">Application date</option>
                <option value="company">Company A–Z</option>
              </select>
            </label>
          </div>
        </div>
        <div
          className="tracker-tabs"
          role="group"
          aria-label="Application status"
        >
          {filters.map(([value, label]) => (
            <button
              key={value}
              className={status === value ? "selected" : ""}
              aria-pressed={status === value}
              onClick={() => {
                setStatus(value);
                setPage(0);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {error && (
          <div className="error-banner" role="alert">
            {error}
            <button
              className="text-button"
              onClick={() => setRefresh((r) => r + 1)}
            >
              Try again
            </button>
          </div>
        )}
        <div className="mobile-table-hint">
          <ArrowUpRight size={13} /> Swipe the table to see links and actions
        </div>
        <div className="tracker-table-wrap" aria-busy={loading}>
          <table className="tracker-table">
            <caption className="sr-only">
              Your job applications and saved links
            </caption>
            <thead>
              <tr>
                <th scope="col" className="serial-column">
                  No.
                </th>
                <th scope="col">Company & role</th>
                <th scope="col">Package</th>
                <th scope="col">Status</th>
                <th scope="col">Application link</th>
                <th scope="col">Status link</th>
                <th scope="col">Applied on</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {!data && loading
                ? Array.from({ length: 5 }, (_, index) => (
                    <tr key={index} className="skeleton-row">
                      {Array.from({ length: 8 }, (_, col) => (
                        <td key={col}>
                          <span className="skeleton" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.applications.map((app, index) => (
                    <tr key={app.id}>
                      <td className="serial-column">
                        {page * size + index + 1 < 10 ? "0" : ""}
                        {page * size + index + 1}
                      </td>
                      <td>
                        <button
                          className="company-cell"
                          onClick={() => setEditing(app)}
                          aria-label={`Edit ${app.title} at ${app.company}`}
                        >
                          <span
                            className={`company-avatar avatar-${app.company.charCodeAt(0) % 5}`}
                          >
                            {initials(app.company)}
                          </span>
                          <span>
                            <strong>{app.company}</strong>
                            <span>{app.title}</span>
                            {app.location && <small>{app.location}</small>}
                          </span>
                        </button>
                      </td>
                      <td>
                        <span className="package-value">
                          {app.salary || "Not specified"}
                        </span>
                      </td>
                      <td>
                        <div
                          className={`status-select status-${app.status.toLowerCase()}`}
                        >
                          <span className="status-dot" />
                          <select
                            aria-label={`Status for ${app.company}`}
                            value={app.status}
                            disabled={busyId === app.id}
                            onChange={(e) =>
                              changeStatus(
                                app,
                                e.target.value as ApplicationStatus,
                              )
                            }
                          >
                            {applicationStatuses.map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td>
                        <SavedLink
                          url={app.applicationUrl}
                          label="View application"
                        />
                      </td>
                      <td>
                        <SavedLink url={app.statusUrl} label="Check status" />
                      </td>
                      <td className="date-cell">
                        {formatDate(app.appliedDate)}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            title="Edit application"
                            aria-label={`Edit ${app.company}`}
                            onClick={() => setEditing(app)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="icon-button delete-action"
                            title="Delete application"
                            aria-label={`Delete ${app.company}`}
                            onClick={() => setDeleting(app)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {data && !data.applications.length && !loading && (
          <div className="tracker-empty">
            <span className="empty-icon">
              <BriefcaseBusiness size={30} strokeWidth={1.5} />
            </span>
            <h3>
              {query || status
                ? "No matching applications"
                : "Your next opportunity starts here"}
            </h3>
            <p>
              {query || status
                ? "Try another company, role or status to find what you’re looking for."
                : "Add your first application and keep the details and links together. Simple as that."}
            </p>
            {query || status ? (
              <button
                className="button secondary"
                onClick={() => {
                  setSearch("");
                  setQuery("");
                  setStatus("");
                  setPage(0);
                }}
              >
                Clear filters
              </button>
            ) : (
              <button
                className="button primary"
                onClick={() => setEditing("new")}
              >
                <Plus size={17} /> Add your first application
              </button>
            )}
          </div>
        )}
        <div className="table-pagination">
          <span>
            {data?.totalElements
              ? `${page * size + 1}–${Math.min((page + 1) * size, data.totalElements)} of ${data.totalElements} applications`
              : "0 applications"}
          </span>
          <div>
            <label>
              Rows{" "}
              <select
                aria-label="Rows per page"
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(0);
                }}
              >
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
            </label>
            <button
              className="icon-button"
              aria-label="Previous page"
              disabled={!page || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <span className="page-number">
              {page + 1} / {Math.max(data?.totalPages ?? 1, 1)}
            </span>
            <button
              className="icon-button"
              aria-label="Next page"
              disabled={loading || page + 1 >= (data?.totalPages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
      <div className="workspace-footnote">
        <span>
          <FileText size={14} /> Your search. Your pace. Everything in one
          place.
        </span>
        <span>
          Made for your next move <ArrowUpRight size={14} />
        </span>
      </div>
      {notice && (
        <div className="success-toast" role="status">
          <Check size={17} />
          {notice}
          <button
            className="icon-button"
            aria-label="Dismiss message"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {editing && (
        <ApplicationEditor
          application={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            const isNew = editing === "new";
            setEditing(null);
            changed(
              isNew
                ? "Application added. Here’s to your next move!"
                : "Application updated.",
            );
          }}
        />
      )}
      {deleting && (
        <DeleteDialog
          application={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            changed("Application deleted.");
          }}
        />
      )}
    </div>
  );
}

function SavedLink({ url, label }: { url?: string; label: string }) {
  return url && isSafeUrl(url) ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="saved-link"
    >
      {label}
      <ExternalLink size={13} />
    </a>
  ) : (
    <span className="missing-link">Not added</span>
  );
}

function ApplicationEditor({
  application,
  onClose,
  onSaved,
}: {
  application: Application | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<ApplicationInput>(
    application ? toApplicationInput(application) : { ...emptyApplication },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  function field<K extends keyof ApplicationInput>(
    key: K,
    value: ApplicationInput[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (
      !isSafeUrl(form.applicationUrl) ||
      (form.statusUrl && !isSafeUrl(form.statusUrl))
    ) {
      setError("Use a full link beginning with https:// or http://.");
      return;
    }
    setSaving(true);
    try {
      await api(
        application
          ? `/api/applications/${application.id}`
          : "/api/applications",
        { method: application ? "PUT" : "POST", body: JSON.stringify(form) },
      );
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save application.",
      );
      setSaving(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="application-dialog"
      aria-labelledby="editor-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!saving) onClose();
      }}
      onClick={(e) => {
        if (e.target === dialog.current && !saving) onClose();
      }}
    >
      <form onSubmit={submit}>
        <div className="dialog-heading">
          <span className="dialog-icon">
            <BriefcaseBusiness size={22} />
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label="Close editor"
            disabled={saving}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <h2 id="editor-title">
          {application ? "Edit application" : "A new opportunity"}
        </h2>
        <p className="dialog-description">
          Keep the essentials together. Fields marked * are required.
        </p>
        <div className="editor-fields">
          <div className="editor-grid">
            <label>
              Company name *
              <input
                autoFocus
                required
                maxLength={150}
                placeholder="e.g. Microsoft"
                value={form.company}
                onChange={(e) => field("company", e.target.value)}
                autoComplete="organization"
              />
            </label>
            <label>
              Role / job title *
              <input
                required
                maxLength={150}
                placeholder="e.g. Software Engineer"
                value={form.title}
                onChange={(e) => field("title", e.target.value)}
              />
            </label>
          </div>
          <label>
            Application link *
            <input
              required
              type="url"
              maxLength={2000}
              placeholder="https://careers.company.com/jobs/…"
              value={form.applicationUrl}
              onChange={(e) => field("applicationUrl", e.target.value)}
            />
            <span className="field-hint">
              The job posting or the page where you applied.
            </span>
          </label>
          <label>
            Application status link <span className="optional">Optional</span>
            <input
              type="url"
              maxLength={2000}
              placeholder="https://company.com/candidate/…"
              value={form.statusUrl}
              onChange={(e) => field("statusUrl", e.target.value)}
            />
            <span className="field-hint">
              Your candidate portal or application progress page.
            </span>
          </label>
          <div className="editor-grid">
            <label>
              Package / salary
              <input
                maxLength={100}
                placeholder="e.g. ₹8–12 LPA or $90k / year"
                value={form.salary}
                onChange={(e) => field("salary", e.target.value)}
              />
            </label>
            <label>
              Application status
              <select
                value={form.status}
                onChange={(e) =>
                  field("status", e.target.value as ApplicationStatus)
                }
              >
                {applicationStatuses.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="editor-grid">
            <label>
              Applied on
              <input
                type="date"
                value={form.appliedDate}
                onChange={(e) => field("appliedDate", e.target.value)}
              />
            </label>
            <label>
              Application deadline
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => field("deadline", e.target.value)}
              />
            </label>
          </div>
          <details
            className="optional-details"
            open={Boolean(
              application?.location ||
                application?.notes ||
                (application?.workMode &&
                  application.workMode !== "UNSPECIFIED"),
            )}
          >
            <summary>
              More details <span>Location, work mode & notes</span>
            </summary>
            <div className="editor-grid">
              <label>
                Location
                <input
                  maxLength={150}
                  placeholder="e.g. Bengaluru, India"
                  value={form.location}
                  onChange={(e) => field("location", e.target.value)}
                />
              </label>
              <label>
                Work mode
                <select
                  value={form.workMode}
                  onChange={(e) =>
                    field(
                      "workMode",
                      e.target.value as ApplicationInput["workMode"],
                    )
                  }
                >
                  <option value="UNSPECIFIED">Not specified</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On site</option>
                </select>
              </label>
            </div>
            <label>
              Notes
              <textarea
                maxLength={5000}
                rows={3}
                placeholder="A contact name, interview details, or something to remember…"
                value={form.notes}
                onChange={(e) => field("notes", e.target.value)}
              />
            </label>
          </details>
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
        </div>
        <div className="dialog-footer">
          <button
            type="button"
            className="button secondary"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className="button primary" disabled={saving}>
            {saving ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <Check size={16} />
            )}
            {saving
              ? "Saving…"
              : application
                ? "Save changes"
                : "Add application"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function DeleteDialog({
  application,
  onClose,
  onDeleted,
}: {
  application: Application;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  async function remove() {
    setPending(true);
    try {
      await api(`/api/applications/${application.id}`, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete application.",
      );
      setPending(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="application-dialog delete-dialog"
      aria-labelledby="delete-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onClose();
      }}
    >
      <div className="delete-content">
        <span className="delete-icon">
          <Trash2 size={24} />
        </span>
        <h2 id="delete-title">Delete this application?</h2>
        <p>
          <strong>
            {application.title} at {application.company}
          </strong>{" "}
          will be removed from your tracker. This cannot be undone.
        </p>
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-footer">
          <button
            autoFocus
            className="button secondary"
            disabled={pending}
            onClick={onClose}
          >
            Keep application
          </button>
          <button className="button danger" disabled={pending} onClick={remove}>
            {pending ? "Deleting…" : "Delete application"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
