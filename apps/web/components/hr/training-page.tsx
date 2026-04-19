"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  Plus,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface AssignmentRow {
  id: string;
  targetType: string;
  targetId: string;
  theme: string;
  format: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  createdBy: { id: string; name: string | null; email: string } | null;
  assignee: { id: string; name: string | null; email: string } | null;
}

interface Stats {
  total: number;
  assigned: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

interface DeptLite {
  id: string;
  name: string;
}

const THEMES = ["stress", "sleep", "nutrition", "movement", "hydration", "inner_calm", "digital_balance"] as const;
const FORMATS = ["micro_learning", "live_session", "challenge", "reminder", "coaching"] as const;
const TARGET_TYPES = ["employee", "group", "department"] as const;

const THEME_COLORS: Record<string, string> = {
  stress: "bg-[#FFE6EA] text-[#B42318]",
  sleep: "bg-[#EBE5FF] text-[#5B21B6]",
  nutrition: "bg-[#E6F5EC] text-[#0A6D33]",
  movement: "bg-[#EAF4FF] text-[#0F6FFF]",
  hydration: "bg-[#E0F7FA] text-[#00695C]",
  inner_calm: "bg-[#FFF6E0] text-[#9A6A00]",
  digital_balance: "bg-[#F0F0F0] text-[#56707B]",
};

export function TrainingAssignmentPage() {
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [themeFilter, setThemeFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [departments, setDepartments] = useState<DeptLite[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (themeFilter !== "all") params.set("theme", themeFilter);
      const data = await fetchWithAuth<{ assignments: AssignmentRow[]; stats: Stats }>(
        `/api/web/hr/training?${params}`,
      );
      setAssignments(data.assignments);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load assignments.");
    }
  }

  async function loadDepts() {
    try {
      const data = await fetchWithAuth<{ departments: DeptLite[] }>("/api/web/hr/departments");
      setDepartments(data.departments);
    } catch {
      // soft fail
    }
  }

  useEffect(() => {
    void load();
    void loadDepts();
  }, []);

  useEffect(() => {
    void load();
  }, [statusFilter, themeFilter]);

  async function updateStatus(id: string, status: string) {
    setBusy(true);
    try {
      await fetchWithAuth("/api/web/hr/training", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  const now = Date.now();

  return (
    <>
      <PageHeader
        title="Training Assignments"
        subtitle="Build assignments by target, theme, and format. Track completion and overdue items."
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            New assignment
          </button>
        }
      />

      {stats ? (
        <div className="mb-4 grid gap-3 md:grid-cols-5">
          {[
            { label: "Total", value: stats.total, icon: GraduationCap },
            { label: "Assigned", value: stats.assigned, icon: Clock },
            { label: "In progress", value: stats.inProgress, icon: Clock },
            { label: "Completed", value: stats.completed, icon: CheckCircle2 },
            { label: "Overdue", value: stats.overdue, icon: AlertTriangle },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <GlassCard key={t.label} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#167C80]/10 text-[#167C80]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-[#10242A]">{t.value}</div>
                    <div className="text-[10px] text-[#56707B]">{t.label}</div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : null}

      {showCreate ? (
        <CreateAssignment
          departments={departments}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            void load();
          }}
        />
      ) : null}

      <GlassCard className="mb-4 p-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-wrap gap-1.5">
            {["all", "assigned", "in_progress", "completed", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                  statusFilter === s ? "bg-[#10242A] text-white" : "border border-[#D7E3E7] text-[#3A5661]"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-1.5">
            <select
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
              className="rounded-full border border-[#D7E3E7] px-3 py-1.5 text-xs outline-none"
            >
              <option value="all">All themes</option>
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {error ? <div className="mb-4 rounded-[16px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div> : null}

      <div className="space-y-3">
        {assignments.length === 0 ? (
          <GlassCard className="p-10 text-center text-sm text-[#56707B]">No training assignments.</GlassCard>
        ) : null}
        {assignments.map((a) => {
          const overdue =
            a.dueDate && new Date(a.dueDate).getTime() < now && !["completed", "cancelled"].includes(a.status);
          return (
            <GlassCard key={a.id} className={`p-5 ${overdue ? "border-l-4 border-l-[#B42318]" : ""}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-[#167C80]" />
                    <h3 className="text-sm font-semibold text-[#10242A]">{a.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${THEME_COLORS[a.theme] ?? "bg-[#F0F0F0] text-[#56707B]"}`}>
                      {a.theme.replace("_", " ")}
                    </span>
                    <span className="rounded-full border border-[#D7E3E7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#56707B]">
                      {a.format.replace("_", " ")}
                    </span>
                    {overdue ? (
                      <span className="rounded-full bg-[#FFE6EA] px-2 py-0.5 text-[10px] font-bold uppercase text-[#B42318]">
                        Overdue
                      </span>
                    ) : null}
                  </div>
                  {a.description ? <p className="mt-2 text-sm text-[#3A5661]">{a.description}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#56707B]">
                    <span>Target: {a.targetType} ({a.targetId.slice(0, 8)}…)</span>
                    {a.assignee ? <span>Assignee: {a.assignee.name ?? a.assignee.email}</span> : null}
                    {a.dueDate ? <span>Due: {fmt(a.dueDate)}</span> : null}
                    <span>Created: {fmt(a.createdAt)}</span>
                    {a.completedAt ? <span>Completed: {fmt(a.completedAt)}</span> : null}
                    <span>Status: {a.status.replace("_", " ")}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.status === "assigned" ? (
                    <>
                      <button
                        disabled={busy}
                        onClick={() => void updateStatus(a.id, "in_progress")}
                        className="rounded-full bg-[#167C80] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Start
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => void updateStatus(a.id, "cancelled")}
                        className="rounded-full border border-[#D7E3E7] px-3 py-1.5 text-xs font-semibold text-[#56707B] disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : null}
                  {a.status === "in_progress" ? (
                    <button
                      disabled={busy}
                      onClick={() => void updateStatus(a.id, "completed")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#0A6D33] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Complete
                    </button>
                  ) : null}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </>
  );
}

function CreateAssignment({
  departments,
  onClose,
  onCreated,
}: {
  departments: DeptLite[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    targetType: "department" as (typeof TARGET_TYPES)[number],
    targetId: "",
    theme: "stress" as (typeof THEMES)[number],
    format: "micro_learning" as (typeof FORMATS)[number],
    description: "",
    dueDate: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.targetId.trim()) {
      setError("Title and target are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        targetType: form.targetType,
        targetId: form.targetId,
        theme: form.theme,
        format: form.format,
      };
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.dueDate) payload.dueDate = new Date(form.dueDate).toISOString();

      await fetchWithAuth("/api/web/hr/training", { method: "POST", body: JSON.stringify(payload) });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create assignment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassCard className="mb-4 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#10242A]">New training assignment</h2>
        <button onClick={onClose} className="text-[#56707B]"><X className="h-4 w-4" /></button>
      </div>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <label className="md:col-span-2 flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Title *</span>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Target type</span>
          <select
            value={form.targetType}
            onChange={(e) => setForm((f) => ({ ...f, targetType: e.target.value as typeof form.targetType, targetId: "" }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          >
            {TARGET_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Target *</span>
          {form.targetType === "department" ? (
            <select
              value={form.targetId}
              onChange={(e) => setForm((f) => ({ ...f, targetId: e.target.value }))}
              className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          ) : (
            <input
              value={form.targetId}
              onChange={(e) => setForm((f) => ({ ...f, targetId: e.target.value }))}
              placeholder={form.targetType === "employee" ? "Employee user ID" : "Group ID"}
              className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
            />
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Theme</span>
          <select
            value={form.theme}
            onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value as typeof form.theme }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          >
            {THEMES.map((t) => (
              <option key={t} value={t}>{t.replace("_", " ")}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Format</span>
          <select
            value={form.format}
            onChange={(e) => setForm((f) => ({ ...f, format: e.target.value as typeof form.format }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>{f.replace("_", " ")}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Due date (optional)</span>
          <input
            type="datetime-local"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          />
        </label>
        <label className="md:col-span-2 flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          />
        </label>
        {error ? <div className="md:col-span-2 rounded-[14px] bg-[#FFF5F7] px-3 py-2 text-sm text-[#B42318]">{error}</div> : null}
        <div className="md:col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-[#D7E3E7] px-4 py-2 text-sm font-semibold">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create assignment"}
          </button>
        </div>
      </form>
    </GlassCard>
  );
}

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
