import React, { useCallback, useEffect, useState } from "react";
import {
  Plus, Edit2, Trash2, Search, X, Check, Building2,
  ArrowRightLeft, GraduationCap, Loader2,
} from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

/* ── Types ──────────────────────────────────────────────────────── */
interface TransferRecord {
  id: string; student: string; institution: string; status: string;
  created: string; expand?: { student?: { id: string; name: string; studentId?: string } };
}
interface TransferCourse {
  id: string; transfer_record: string; course_name: string; credits: number;
}
interface Student { id: string; name: string; studentId?: string; }
interface CourseRow { course_name: string; credits: string; }
interface FormState {
  studentId: string; institution: string;
  status: "pending" | "approved" | "rejected";
  courses: CourseRow[];
}

const emptyForm: FormState = {
  studentId: "", institution: "", status: "pending",
  courses: [{ course_name: "", credits: "" }],
};

/* ── Helpers ─────────────────────────────────────────────────────── */
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const STATUS_CFG = {
  pending:  { cls: "bg-yellow-50 text-yellow-700 border-yellow-200", label: "Pending" },
  approved: { cls: "bg-green-50  text-green-700  border-green-200",  label: "Approved" },
  rejected: { cls: "bg-red-50    text-red-700    border-red-200",    label: "Rejected" },
} as const;

/* ── Component ───────────────────────────────────────────────────── */
const AdminTransferCredits: React.FC = () => {
  const [records,   setRecords]   = useState<TransferRecord[]>([]);
  const [courseMap, setCourseMap] = useState<Map<string, TransferCourse[]>>(new Map());
  const [students,  setStudents]  = useState<Student[]>([]);
  const [loading,   setLoading]   = useState(true);

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "approved" | "rejected">("");

  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState<TransferRecord | null>(null);
  const [form,      setForm]      = useState<FormState>({ ...emptyForm, courses: [{ course_name: "", credits: "" }] });
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  /* ── Fetch all records + courses ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recs, tcs] = await Promise.all([
        pb.collection("transfer_records").getFullList<TransferRecord>({
          sort: "-created", expand: "student", requestKey: null,
        }),
        pb.collection("transfer_courses").getFullList<TransferCourse>({
          sort: "transfer_record,course_name", requestKey: null,
        }),
      ]);
      const map = new Map<string, TransferCourse[]>();
      tcs.forEach(c => {
        if (!map.has(c.transfer_record)) map.set(c.transfer_record, []);
        map.get(c.transfer_record)!.push(c);
      });
      setRecords(recs);
      setCourseMap(map);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* Fetch students once */
  useEffect(() => {
    pb.collection("users").getFullList<Student>({
      filter: `role = "student"`, fields: "id,name,studentId", sort: "name", requestKey: null,
    }).then(setStudents).catch(console.error);
  }, []);

  /* ── Modal helpers ── */
  const openCreate = () => {
    setEditing(null);
    setForm({ studentId: "", institution: "", status: "pending", courses: [{ course_name: "", credits: "" }] });
    setError(""); setShowModal(true);
  };

  const openEdit = (r: TransferRecord) => {
    const existing = courseMap.get(r.id) || [];
    setEditing(r);
    setForm({
      studentId:   r.student,
      institution: r.institution,
      status:      r.status as "pending" | "approved" | "rejected",
      courses:     existing.length > 0
        ? existing.map(c => ({ course_name: c.course_name, credits: String(c.credits) }))
        : [{ course_name: "", credits: "" }],
    });
    setError(""); setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); setError(""); setSaving(false); };

  /* ── Course row helpers ── */
  const addCourse    = () => setForm(f => ({ ...f, courses: [...f.courses, { course_name: "", credits: "" }] }));
  const removeCourse = (i: number) => setForm(f => ({ ...f, courses: f.courses.filter((_, idx) => idx !== i) }));
  const updateCourse = (i: number, field: keyof CourseRow, val: string) =>
    setForm(f => ({ ...f, courses: f.courses.map((c, idx) => idx === i ? { ...c, [field]: val } : c) }));

  const totalCredits = form.courses.reduce((s, c) => s + (parseFloat(c.credits) || 0), 0);

  /* ── Validation ── */
  const validate = (): string | null => {
    if (!form.studentId)        return "Please select a student.";
    if (!form.institution.trim()) return "Institution name is required.";
    if (form.courses.length === 0) return "Add at least one transferred course.";
    for (const c of form.courses) {
      if (!c.course_name.trim()) return "All courses must have a name.";
      const cr = parseFloat(c.credits);
      if (isNaN(cr) || cr <= 0)  return "All credits must be a number greater than zero.";
    }
    return null;
  };

  /* ── Save ── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(); if (err) { setError(err); return; }
    setSaving(true); setError("");
    try {
      let recordId: string;
      if (editing) {
        await pb.collection("transfer_records").update(editing.id, {
          student: form.studentId, institution: form.institution.trim(), status: form.status,
        });
        recordId = editing.id;
        const old = courseMap.get(editing.id) || [];
        await Promise.all(old.map(c => pb.collection("transfer_courses").delete(c.id)));
      } else {
        const rec = await pb.collection("transfer_records").create({
          student: form.studentId, institution: form.institution.trim(), status: form.status,
        });
        recordId = rec.id;
      }
      await Promise.all(form.courses.map(c => pb.collection("transfer_courses").create({
        transfer_record: recordId, course_name: c.course_name.trim(), credits: parseFloat(c.credits),
      })));
      await fetchData();
      closeModal();
    } catch (err: any) {
      setError(err.message || "Failed to save. Please try again.");
    } finally { setSaving(false); }
  };

  /* ── Delete ── */
  const handleDelete = async (r: TransferRecord) => {
    const studentName = r.expand?.student?.name || "this student";
    if (!confirm(`Delete the transfer record from "${r.institution}" for ${studentName}? All ${(courseMap.get(r.id) || []).length} courses will be permanently removed.`)) return;
    try {
      await pb.collection("transfer_records").delete(r.id);
      setRecords(p => p.filter(x => x.id !== r.id));
      setCourseMap(prev => { const m = new Map(prev); m.delete(r.id); return m; });
    } catch (err: any) { alert(err.message || "Failed to delete."); }
  };

  /* ── Filtered list ── */
  const filtered = records.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false;
    const q = search.toLowerCase();
    return (
      (r.expand?.student?.name || "").toLowerCase().includes(q) ||
      r.institution.toLowerCase().includes(q) ||
      (r.expand?.student?.studentId || "").toLowerCase().includes(q)
    );
  });

  /* ── Stats ── */
  const approvedCount   = records.filter(r => r.status === "approved").length;
  const pendingCount    = records.filter(r => r.status === "pending").length;
  const totalApprCredits = records
    .filter(r => r.status === "approved")
    .reduce((sum, r) => sum + (courseMap.get(r.id) || []).reduce((s, c) => s + c.credits, 0), 0);

  return (
    <PortalLayout role="admin">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-1">Transfer Credits</h2>
            <p className="text-text-muted text-sm">
              Manage credit transfers from external institutions. Approved records count toward each student's total credit tally.
            </p>
          </div>
          <button onClick={openCreate}
            className="shrink-0 bg-accent hover:bg-accent-light text-primary font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2 transition-colors">
            <Plus size={17} /> Add Transfer Record
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Records",          value: records.length,       c: "text-primary" },
            { label: "Approved",               value: approvedCount,        c: "text-green-700" },
            { label: "Pending Review",         value: pendingCount,         c: "text-yellow-700" },
            { label: "Total Approved Credits", value: totalApprCredits,     c: "text-secondary" },
          ].map(s => (
            <div key={s.label} className="border border-border rounded-lg p-4 bg-surface">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.c}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Status tabs */}
          <div className="flex gap-1 bg-surface border border-border rounded-md p-1 shrink-0">
            {([["", "All"], ["pending","Pending"], ["approved","Approved"], ["rejected","Rejected"]] as const).map(([k, lbl]) => (
              <button key={k} onClick={() => setStatusFilter(k)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${statusFilter === k ? "bg-primary text-white" : "text-text-muted hover:text-primary"}`}>
                {lbl}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by student name, ID, or institution…"
              className="w-full pl-10 pr-10 py-2.5 border border-border rounded-md text-sm bg-bg focus:outline-none focus:border-accent transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-muted">Loading transfer records…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-border rounded-xl bg-surface">
            <ArrowRightLeft size={52} className="mx-auto text-text-muted/25 mb-4" />
            <p className="text-primary font-semibold text-lg mb-1">{search || statusFilter ? "No results found" : "No transfer records yet"}</p>
            <p className="text-sm text-text-muted mb-6">{search || statusFilter ? "Try adjusting your search or filter." : "Click 'Add Transfer Record' to get started."}</p>
            {!search && !statusFilter && (
              <button onClick={openCreate}
                className="bg-primary text-white font-semibold px-6 py-2.5 rounded-md hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
                <Plus size={15} /> Add Transfer Record
              </button>
            )}
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg text-left">
                    <th className="px-5 py-3.5 font-semibold text-primary text-xs uppercase tracking-wide">Student</th>
                    <th className="px-4 py-3.5 font-semibold text-primary text-xs uppercase tracking-wide">Institution</th>
                    <th className="px-4 py-3.5 font-semibold text-primary text-xs uppercase tracking-wide text-center">Courses</th>
                    <th className="px-4 py-3.5 font-semibold text-primary text-xs uppercase tracking-wide text-center">Credits</th>
                    <th className="px-4 py-3.5 font-semibold text-primary text-xs uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3.5 font-semibold text-primary text-xs uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3.5 font-semibold text-primary text-xs uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const courses   = courseMap.get(r.id) || [];
                    const total     = courses.reduce((s, c) => s + c.credits, 0);
                    const stu       = r.expand?.student;
                    const stCfg     = STATUS_CFG[r.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
                    return (
                      <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-bg/60 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-primary">{stu?.name || "Unknown"}</p>
                          {stu?.studentId && <p className="text-xs text-text-muted mt-0.5">{stu.studentId}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-text-muted shrink-0" />
                            <span className="text-primary">{r.institution}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {courses.length}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-bold text-primary">{total}</span>
                          <span className="text-xs text-text-muted ml-1">cr</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${stCfg.cls}`}>
                            {stCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-text-muted text-xs whitespace-nowrap">{formatDate(r.created)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(r)}
                              className="p-1.5 text-secondary hover:text-primary hover:bg-bg rounded-md transition-colors" title="Edit">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => handleDelete(r)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-2xl max-h-[92vh] bg-bg rounded-xl border border-border overflow-hidden flex flex-col shadow-2xl">

            {/* Modal header */}
            <div className="px-6 py-4 border-b border-border bg-surface shrink-0 flex items-center justify-between">
              <h3 className="font-heading font-bold text-xl text-primary">
                {editing ? "Edit Transfer Record" : "Add Transfer Record"}
              </h3>
              <button onClick={closeModal} className="text-text-muted hover:text-primary p-1 rounded transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Student */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Student <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.studentId}
                  onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg text-text focus:outline-none focus:border-accent transition-colors"
                  required
                >
                  <option value="">— Select student —</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.studentId ? ` (${s.studentId})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Institution */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Transferred Institution <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" value={form.institution} required
                  onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg text-text focus:outline-none focus:border-accent transition-colors"
                  placeholder="e.g., ABC University"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Approval Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {([ ["pending","Pending","Under review, not counted yet"], ["approved","Approved","Credits added to student total"], ["rejected","Rejected","Credits not counted"] ] as const).map(([val, lbl, hint]) => (
                    <button key={val} type="button"
                      onClick={() => setForm(f => ({ ...f, status: val }))}
                      className={`p-3 rounded-lg border-2 text-left transition-all duration-150 ${form.status === val
                        ? val === "approved" ? "border-green-400 bg-green-50"
                          : val === "rejected" ? "border-red-400 bg-red-50"
                          : "border-yellow-400 bg-yellow-50"
                        : "border-border hover:border-accent/40 bg-bg"}`}
                    >
                      <p className={`text-xs font-semibold ${form.status === val
                        ? val === "approved" ? "text-green-700"
                          : val === "rejected" ? "text-red-700"
                          : "text-yellow-700"
                        : "text-text-muted"}`}>{lbl}</p>
                      <p className="text-[10px] text-text-muted mt-0.5 leading-tight">{hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transferred Courses */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-primary">
                    Transferred Courses <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-text-muted">{form.courses.length} course{form.courses.length !== 1 ? "s" : ""}</span>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  {/* Course table header */}
                  <div className="grid grid-cols-[1fr_80px_40px] gap-2 px-4 py-2.5 bg-bg border-b border-border">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Course Name</p>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide text-center">Credits</p>
                    <div />
                  </div>

                  {/* Course rows */}
                  <div className="divide-y divide-border">
                    {form.courses.map((c, i) => (
                      <div key={i} className="grid grid-cols-[1fr_80px_40px] gap-2 px-4 py-2.5 items-center bg-surface hover:bg-bg/50 transition-colors">
                        <input
                          type="text" value={c.course_name}
                          onChange={e => updateCourse(i, "course_name", e.target.value)}
                          placeholder="e.g., Calculus I"
                          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-bg text-text focus:outline-none focus:border-accent transition-colors"
                        />
                        <input
                          type="number" value={c.credits} min="0.5" step="0.5"
                          onChange={e => updateCourse(i, "credits", e.target.value)}
                          placeholder="0"
                          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-bg text-text focus:outline-none focus:border-accent transition-colors text-center"
                        />
                        <button
                          type="button"
                          onClick={() => form.courses.length > 1 && removeCourse(i)}
                          disabled={form.courses.length <= 1}
                          className="flex items-center justify-center w-8 h-8 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-25 disabled:cursor-default transition-colors mx-auto"
                          title="Remove course"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add course button */}
                  <div className="px-4 py-2.5 border-t border-border bg-bg">
                    <button type="button" onClick={addCourse}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-light transition-colors">
                      <Plus size={15} /> Add Course
                    </button>
                  </div>
                </div>

                {/* Running total */}
                <div className="flex items-center justify-between mt-3 px-4 py-3 bg-primary/5 border border-primary/10 rounded-lg">
                  <span className="text-sm font-semibold text-primary">Total Transferred Credits</span>
                  <span className="text-xl font-bold text-primary">{totalCredits.toFixed(totalCredits % 1 === 0 ? 0 : 1)}</span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2.5">{error}</p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-border">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-md transition-colors flex items-center justify-center gap-2">
                  {saving ? (
                    <><Loader2 size={15} className="animate-spin" /> Saving…</>
                  ) : (
                    <><Check size={15} />{editing ? "Save Changes" : "Create Transfer Record"}</>
                  )}
                </button>
                <button type="button" onClick={closeModal}
                  className="px-5 py-2.5 border border-border rounded-md text-text-muted hover:text-primary font-semibold transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminTransferCredits;
