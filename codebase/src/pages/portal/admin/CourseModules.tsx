import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Layers, ChevronRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const MOD_STATUSES = ["upcoming", "ongoing", "finish", "graded"] as const;

const statusStyle = (s: string) => {
  if (s === "upcoming") return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (s === "ongoing")  return "bg-blue-100 text-blue-800 border-blue-300";
  if (s === "finish")   return "bg-green-100 text-green-800 border-green-300";
  if (s === "graded")   return "bg-purple-100 text-purple-800 border-purple-300";
  return "bg-gray-100 text-gray-700 border-gray-300";
};

const emptyForm = { moduleName: "", moduleOrder: "1", description: "", subject_no: "0", start_date: "", end_date: "", actual_end_date: "", status: "upcoming" };

const AdminCourseModules: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate     = useNavigate();

  const [course, setCourse]       = useState<any>(null);
  const [modules, setModules]     = useState<any[]>([]);
  const [subCounts, setSubCounts] = useState<Record<string, number>>({});
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<any | null>(null);
  const [form, setForm]           = useState({ ...emptyForm });
  const [saving, setSaving]       = useState(false);

  const fetchAll = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [c, m] = await Promise.all([
        pb.collection("academic_courses").getOne(courseId, { expand: "degree", requestKey: null }),
        pb.collection("academic_modules").getFullList({ filter: `course ?= "${courseId}"`, sort: "moduleOrder", requestKey: null }),
      ]);
      setCourse(c); setModules(m);
      if (m.length > 0) {
        const modIds = m.map((x: any) => x.id);
        const subs = await pb.collection("academic_subjects").getFullList({
          filter: modIds.map((id: string) => `module = "${id}"`).join(" || "),
          fields: "id,module", requestKey: null,
        });
        const counts: Record<string, number> = {};
        subs.forEach(s => { counts[s.module] = (counts[s.module] || 0) + 1; });
        setSubCounts(counts);
      }
    } finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const close      = () => { setShowModal(false); setEditing(null); };
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, moduleOrder: String((modules.length || 0) + 1) });
    setShowModal(true);
  };
  const openEdit = (r: any) => {
    setEditing(r);
    setForm({
      moduleName: r.moduleName, moduleOrder: String(r.moduleOrder),
      description: r.description || "", subject_no: String(r.subject_no || 0),
      start_date: r.start_date ? r.start_date.slice(0, 10) : "",
      end_date: r.end_date ? r.end_date.slice(0, 10) : "",
      actual_end_date: r.actual_end_date ? r.actual_end_date.slice(0, 10) : "",
      status: r.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload: Record<string, any> = {
        moduleName: form.moduleName, moduleOrder: parseInt(form.moduleOrder),
        course: courseId, description: form.description,
        subject_no: parseInt(form.subject_no), status: form.status,
      };
      if (form.start_date)      payload.start_date      = form.start_date;
      if (form.end_date)        payload.end_date        = form.end_date;
      if (form.actual_end_date) payload.actual_end_date = form.actual_end_date;

      if (editing) {
        await pb.collection("academic_modules").update(editing.id, payload);
        // Auto-complete course when all terms graded
        if (payload.status === "graded" && courseId) {
          const allMods = await pb.collection("academic_modules").getFullList({ filter: `course = "${courseId}"`, requestKey: null });
          const merged  = allMods.map(m => m.id === editing.id ? { ...m, status: "graded" } : m);
          if (merged.every(m => m.status === "graded") && merged.length >= (course?.module_no || 0)) {
            await pb.collection("academic_courses").update(courseId, { status: "completed" });
            alert("All terms graded — course automatically marked as Completed!");
          }
        }
      } else {
        await pb.collection("academic_modules").create(payload);
      }
      await fetchAll(); close();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this term? All linked subjects will be affected.")) return;
    try { await pb.collection("academic_modules").delete(id); setModules(m => m.filter(x => x.id !== id)); }
    catch (err: any) { alert(err.message); }
  };

  return (
    <PortalLayout role="admin">
      <div className="max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-6">
          <Link to="/portal/admin/academic-courses" className="hover:text-primary transition-colors font-medium">Courses</Link>
          <ChevronRight size={14} className="shrink-0" />
          <span className="text-primary font-semibold truncate">{course?.courseName || "Loading…"}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button onClick={() => navigate("/portal/admin/academic-courses")}
              className="mt-1 p-1.5 rounded-md border border-border hover:bg-surface transition-colors text-text-muted hover:text-primary shrink-0">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="font-heading font-bold text-2xl text-primary">
                {course?.courseName || "—"} — Terms
              </h2>
              <p className="text-text-muted text-sm mt-0.5">
                {course?.courseCode}{course?.academic_year ? ` · ${course.academic_year}` : ""}
                {course?.module_no ? ` · ${modules.length} / ${course.module_no} terms created` : ""}
              </p>
            </div>
          </div>
          <button onClick={openCreate} className="shrink-0 bg-accent hover:bg-accent-light text-primary font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2">
            <Plus size={17} />Add Term
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total",           value: modules.length,                                            c: "text-primary" },
            { label: "Upcoming",        value: modules.filter(m => m.status === "upcoming").length,       c: "text-yellow-600" },
            { label: "Ongoing",         value: modules.filter(m => m.status === "ongoing").length,        c: "text-blue-600" },
            { label: "Finish / Graded", value: modules.filter(m => m.status === "finish" || m.status === "graded").length, c: "text-green-600" },
          ].map(s => (
            <div key={s.label} className="border border-border rounded-lg p-4 bg-surface">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.c}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Term table */}
        {loading ? <p className="text-center text-text-muted py-12">Loading…</p> : modules.length === 0 ? (
          <div className="text-center py-14 border border-border rounded-lg bg-surface">
            <Layers size={44} className="mx-auto text-text-muted/30 mb-3" />
            <p className="text-text-muted mb-4">No terms yet for this course</p>
            <button onClick={openCreate} className="bg-primary text-white font-semibold px-5 py-2 rounded-md">Add First Term</button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-primary text-white">
                  <th className="text-center px-4 py-3 w-14">#</th>
                  <th className="text-left px-5 py-3">Term Name</th>
                  <th className="text-center px-4 py-3">Subjects</th>
                  <th className="text-center px-5 py-3">Duration</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3">Actions</th>
                </tr></thead>
                <tbody>{modules.map(m => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                    <td className="px-4 py-4 text-center">
                      <span className="w-8 h-8 rounded-full bg-accent/10 text-primary font-bold text-sm flex items-center justify-center mx-auto">{m.moduleOrder}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-primary">{m.moduleName}</p>
                      {m.description && <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{m.description}</p>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-primary">{subCounts[m.id] || 0}</span>
                      {m.subject_no > 0 && <span className="text-text-muted text-xs"> / {m.subject_no}</span>}
                    </td>
                    <td className="px-5 py-4 text-center text-xs text-text-muted">
                      {m.start_date ? `${m.start_date.slice(0, 10)} → ${m.end_date?.slice(0, 10) || "?"}` : "—"}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusStyle(m.status)}`}>{m.status}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center items-center gap-1.5">
                        <button onClick={() => openEdit(m)} className="p-1.5 text-secondary hover:text-primary" title="Edit"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(m.id)} className="p-1.5 text-red-500 hover:text-red-700" title="Delete"><Trash2 size={14} /></button>
                        <button
                          onClick={() => navigate(`/portal/admin/academic-modules/${m.id}/subjects`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent/10 hover:bg-accent/25 text-primary rounded-md text-xs font-semibold transition-colors"
                        >
                          Subjects <ChevronRight size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-lg max-h-[90vh] bg-bg rounded-lg border border-border overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border bg-surface shrink-0">
              <h3 className="font-heading font-bold text-lg text-primary">{editing ? "Edit" : "Add"} Term</h3>
              <p className="text-xs text-text-muted mt-0.5">{course?.courseName}</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Term Order *</label>
                  <input type="number" min="1" value={form.moduleOrder} onChange={e => setForm({ ...form, moduleOrder: e.target.value })} required className="input-field" /></div>
                <div><label className="label">Required Subjects</label>
                  <input type="number" min="0" value={form.subject_no} onChange={e => setForm({ ...form, subject_no: e.target.value })} className="input-field" /></div>
              </div>
              <div><label className="label">Term Name *</label>
                <input value={form.moduleName} onChange={e => setForm({ ...form, moduleName: e.target.value })} required className="input-field" /></div>
              <div><label className="label">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="input-field resize-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="input-field" /></div>
                <div><label className="label">End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="input-field" /></div>
              </div>
              <div><label className="label">Actual End Date</label>
                <input type="date" value={form.actual_end_date} onChange={e => setForm({ ...form, actual_end_date: e.target.value })} className="input-field" /></div>
              <div><label className="label">Status *</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                  {MOD_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select></div>
              {form.status === "graded" && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 flex items-center gap-2">
                  <CheckCircle2 size={13} />If all terms in this course become Graded, the course auto-completes.
                </p>
              )}
              <div className="flex gap-3 pt-2 border-t border-border">
                <button type="submit" disabled={saving} className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-md">{saving ? "Saving…" : editing ? "Update" : "Add Term"}</button>
                <button type="button" onClick={close} className="px-5 py-2.5 border border-border rounded-md text-text-muted hover:text-primary font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminCourseModules;
