import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, FlaskConical, ChevronRight, ArrowLeft } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const typeBadge   = (t: string) => t === "mandatory" ? "bg-red-100 text-red-700 border-red-300"   : "bg-blue-100 text-blue-700 border-blue-300";
const statusBadge = (s: string) => s === "active"    ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100 text-gray-700 border-gray-300";

const modStatusStyle = (s: string) => {
  if (s === "upcoming") return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (s === "ongoing")  return "bg-blue-100 text-blue-800 border-blue-300";
  if (s === "finish")   return "bg-green-100 text-green-800 border-green-300";
  if (s === "graded")   return "bg-purple-100 text-purple-800 border-purple-300";
  return "bg-gray-100 text-gray-700 border-gray-300";
};

const emptyForm = { subjectCode: "", subjectName: "", subjectType: "mandatory", teacher_name: "", credit_no: "0", status: "active" };

const AdminModuleSubjects: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate     = useNavigate();

  const [module,   setModule]   = useState<any>(null);
  const [course,   setCourse]   = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing,  setEditing]  = useState<any | null>(null);
  const [form,     setForm]     = useState({ ...emptyForm });
  const [saving,   setSaving]   = useState(false);

  const fetchAll = useCallback(async () => {
    if (!moduleId) return;
    setLoading(true);
    try {
      const m = await pb.collection("academic_modules").getOne(moduleId, { expand: "course,course.degree", requestKey: null });
      setModule(m);
      setCourse(m.expand?.course || null);
      const subs = await pb.collection("academic_subjects").getFullList({
        filter: `module = "${moduleId}"`, sort: "subjectType,subjectCode", requestKey: null,
      });
      setSubjects(subs);
    } finally { setLoading(false); }
  }, [moduleId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const close      = () => { setShowModal(false); setEditing(null); };
  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit   = (r: any) => {
    setEditing(r);
    setForm({ subjectCode: r.subjectCode, subjectName: r.subjectName, subjectType: r.subjectType, teacher_name: r.teacher_name || "", credit_no: String(r.credit_no || 0), status: r.status });
    setShowModal(true);
  };

  const checkUnique = async (): Promise<boolean> => {
    try {
      const ex = await pb.collection("academic_subjects").getFirstListItem(
        pb.filter("subjectName = {:n} && module = {:m}", { n: form.subjectName, m: moduleId! }), { requestKey: null }
      );
      if (editing && ex.id === editing.id) return true;
      alert("A subject with this name already exists in this term."); return false;
    } catch (e: any) { if (e.status === 404) return true; throw e; }
  };

  /* Recalculate parent course credits from mandatory subjects */
  const updateCourseCredits = async () => {
    if (!course?.id) return;
    try {
      const mods = await pb.collection("academic_modules").getFullList({ filter: `course = "${course.id}"`, fields: "id", requestKey: null });
      if (mods.length === 0) { await pb.collection("academic_courses").update(course.id, { credits: 0 }); return; }
      const filterExpr = mods.map((m: any) => `module = "${m.id}"`).join(" || ");
      const subs = await pb.collection("academic_subjects").getFullList({ filter: `(${filterExpr}) && subjectType = "mandatory"`, fields: "credit_no", requestKey: null });
      const total = subs.reduce((sum: number, s: any) => sum + (s.credit_no || 0), 0);
      await pb.collection("academic_courses").update(course.id, { credits: total });
    } catch { /* non-blocking */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (!(await checkUnique())) return;
      const payload = { ...form, module: moduleId, credit_no: parseInt(form.credit_no) };
      if (editing) await pb.collection("academic_subjects").update(editing.id, payload);
      else          await pb.collection("academic_subjects").create(payload);
      await fetchAll();
      await updateCourseCredits();
      close();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subject?")) return;
    try {
      await pb.collection("academic_subjects").delete(id);
      setSubjects(s => s.filter(x => x.id !== id));
      await updateCourseCredits();
    }
    catch (err: any) { alert(err.message); }
  };

  const backPath = course ? `/portal/admin/academic-courses/${course.id}/modules` : "/portal/admin/academic-courses";
  const mandatoryCount = subjects.filter(s => s.subjectType === "mandatory").length;
  const subjectNo      = module?.subject_no || 0;

  return (
    <PortalLayout role="admin">
      <div className="max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-6 flex-wrap">
          <Link to="/portal/admin/academic-courses" className="hover:text-primary transition-colors font-medium">Courses</Link>
          <ChevronRight size={14} className="shrink-0" />
          {course && (
            <>
              <Link to={`/portal/admin/academic-courses/${course.id}/modules`} className="hover:text-primary transition-colors font-medium">{course.courseName}</Link>
              <ChevronRight size={14} className="shrink-0" />
            </>
          )}
          <span className="text-primary font-semibold">{module?.moduleName || "Loading…"}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button onClick={() => navigate(backPath)}
              className="mt-1 p-1.5 rounded-md border border-border hover:bg-surface transition-colors text-text-muted hover:text-primary shrink-0">
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-heading font-bold text-2xl text-primary">
                  {module?.moduleName || "—"} — Subjects
                </h2>
                {module?.status && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${modStatusStyle(module.status)}`}>{module.status}</span>
                )}
              </div>
              <p className="text-text-muted text-sm mt-0.5">
                Term {module?.moduleOrder}
                {subjectNo > 0 ? ` · ${subjects.length} subject${subjects.length !== 1 ? "s" : ""} (min. ${subjectNo})` : ` · ${subjects.length} subject${subjects.length !== 1 ? "s" : ""}`}
                {module?.start_date ? ` · ${module.start_date.slice(0, 10)} → ${module.end_date?.slice(0, 10) || "?"}` : ""}
                {subjectNo > 0 && <span className="ml-2 text-primary font-medium">· min. {subjectNo} required</span>}
              </p>
            </div>
          </div>
          <button onClick={openCreate} className="shrink-0 bg-accent hover:bg-accent-light text-primary font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2">
            <Plus size={17} />Add Subject
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total",     value: subjects.length,                                            c: "text-primary" },
            { label: "Mandatory", value: mandatoryCount,                                             c: "text-red-600" },
            { label: "Optional",  value: subjects.filter(s => s.subjectType === "optional").length,  c: "text-blue-600" },
          ].map(s => (
            <div key={s.label} className="border border-border rounded-lg p-4 bg-surface">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.c}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Subject table */}
        {loading ? <p className="text-center text-text-muted py-12">Loading…</p> : subjects.length === 0 ? (
          <div className="text-center py-14 border border-border rounded-lg bg-surface">
            <FlaskConical size={44} className="mx-auto text-text-muted/30 mb-3" />
            <p className="text-text-muted mb-4">No subjects yet for this term</p>
            <button onClick={openCreate} className="bg-primary text-white font-semibold px-5 py-2 rounded-md">Add First Subject</button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <table className="w-full text-sm">
              <thead><tr className="bg-primary text-white">
                <th className="text-left px-5 py-3">Code</th>
                <th className="text-left px-5 py-3">Subject Name</th>
                <th className="text-center px-4 py-3">Type</th>
                <th className="text-left px-5 py-3">Teacher</th>
                <th className="text-center px-4 py-3">Credits</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Actions</th>
              </tr></thead>
              <tbody>{subjects.map(s => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-accent/10 text-primary rounded">{s.subjectCode}</span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-primary">{s.subjectName}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${typeBadge(s.subjectType)}`}>{s.subjectType}</span>
                  </td>
                  <td className="px-5 py-3 text-text-muted">{s.teacher_name || "—"}</td>
                  <td className="px-4 py-3 text-center">{s.credit_no || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusBadge(s.status)}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-secondary hover:text-primary" title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-500 hover:text-red-700" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-md max-h-[90vh] bg-bg rounded-lg border border-border overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border bg-surface shrink-0">
              <h3 className="font-heading font-bold text-lg text-primary">{editing ? "Edit" : "Add"} Subject</h3>
              <p className="text-xs text-text-muted mt-0.5">{module?.moduleName}</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Subject Code *</label>
                  <input value={form.subjectCode} onChange={e => setForm({ ...form, subjectCode: e.target.value })} required className="input-field" placeholder="e.g. CS101-S1" /></div>
                <div><label className="label">Type *</label>
                  <select value={form.subjectType} onChange={e => setForm({ ...form, subjectType: e.target.value })} className="input-field">
                    <option value="mandatory">Mandatory</option>
                    <option value="optional">Optional</option>
                  </select></div>
              </div>
              <div><label className="label">Subject Name * <span className="text-text-muted font-normal">(unique per term)</span></label>
                <input value={form.subjectName} onChange={e => setForm({ ...form, subjectName: e.target.value })} required className="input-field" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Teacher Name</label>
                  <input value={form.teacher_name} onChange={e => setForm({ ...form, teacher_name: e.target.value })} className="input-field" placeholder="e.g. Dr. Smith" /></div>
                <div><label className="label">Credit No</label>
                  <input type="number" min="0" value={form.credit_no} onChange={e => setForm({ ...form, credit_no: e.target.value })} className="input-field" /></div>
              </div>
              {/* Minimum subjects info */}
              {form.subjectType === "mandatory" && subjectNo > 0 && (
                <p className="text-xs px-3 py-2 rounded border bg-surface border-border text-text-muted">
                  This term has a minimum of {subjectNo} required subjects for student enrollment.
                </p>
              )}
              <div><label className="label">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select></div>
              <div className="flex gap-3 pt-2 border-t border-border">
                <button type="submit" disabled={saving} className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-md">{saving ? "Saving…" : editing ? "Update" : "Add Subject"}</button>
                <button type="button" onClick={close} className="px-5 py-2.5 border border-border rounded-md text-text-muted hover:text-primary font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminModuleSubjects;
