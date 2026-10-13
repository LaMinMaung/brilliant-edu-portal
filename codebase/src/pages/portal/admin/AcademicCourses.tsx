import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, LibraryBig, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const ordinal = (n: number) =>
  ["First","Second","Third","Fourth","Fifth","Sixth","Seventh","Eighth","Ninth","Tenth"][n - 1] || `Year ${n}`;

const statusStyle = (s: string) => {
  if (s === "active")    return "bg-blue-100 text-blue-800 border-blue-300";
  if (s === "completed") return "bg-purple-100 text-purple-800 border-purple-300";
  return "bg-gray-100 text-gray-700 border-gray-300";
};

const emptyForm = { courseCode:"", courseName:"", degree:"", academic_year:"", year_level:"1", module_no:"1", status:"active" };

const AdminAcademicCourses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses]     = useState<any[]>([]);
  const [degrees, setDegrees]     = useState<any[]>([]);
  const [modCounts, setModCounts] = useState<Record<string, number>>({});
  const [degFilter, setDegFilter] = useState("all");
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<any | null>(null);
  const [form, setForm]           = useState({ ...emptyForm });
  const [selDegree, setSelDegree] = useState<any | null>(null);
  const [saving, setSaving]       = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, d] = await Promise.all([
        pb.collection("academic_courses").getFullList({ sort: "-created", expand: "degree", requestKey: null }),
        pb.collection("degrees").getFullList({ filter: 'status = "active"', sort: "degreeName", requestKey: null }),
      ]);
      setCourses(c); setDegrees(d);
      if (c.length > 0) {
        const mods = await pb.collection("academic_modules").getFullList({ fields: "id,course", requestKey: null });
        const counts: Record<string, number> = {};
        mods.forEach(m => { counts[m.course] = (counts[m.course] || 0) + 1; });
        setModCounts(counts);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const visible = degFilter === "all" ? courses : courses.filter(c => c.degree === degFilter);

  const openCreate = () => { setEditing(null); setSelDegree(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit   = (r: any) => {
    setEditing(r);
    setSelDegree(degrees.find(d => d.id === r.degree) || null);
    setForm({ courseCode: r.courseCode, courseName: r.courseName, degree: r.degree || "", academic_year: r.academic_year || "", year_level: String(r.year_level || 1), module_no: String(r.module_no || 1), status: r.status });
    setShowModal(true);
  };
  const close = () => { setShowModal(false); setEditing(null); setSelDegree(null); };

  const onDegreeChange = (id: string) => {
    setSelDegree(degrees.find(d => d.id === id) || null);
    setForm(f => ({ ...f, degree: id, year_level: "1" }));
  };

  const calcCredits = async (courseId: string): Promise<number> => {
    const mods = await pb.collection("academic_modules").getFullList({ filter: `course = "${courseId}"`, fields: "id", requestKey: null });
    if (mods.length === 0) return 0;
    const filterExpr = mods.map((m: any) => `module = "${m.id}"`).join(" || ");
    const subs = await pb.collection("academic_subjects").getFullList({ filter: `(${filterExpr}) && subjectType = "mandatory"`, fields: "credit_no", requestKey: null });
    return subs.reduce((sum: number, s: any) => sum + (s.credit_no || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const mn = parseInt(form.module_no);
      if (form.status === "completed" && editing) {
        const count = modCounts[editing.id] || 0;
        if (count < mn) { alert(`Cannot mark Completed: need ${mn} modules but only ${count} exist.`); setSaving(false); return; }
      }
      const credits = editing ? await calcCredits(editing.id) : 0;
      const payload = { courseCode: form.courseCode, courseName: form.courseName, degree: form.degree, academic_year: form.academic_year, year_level: parseInt(form.year_level), module_no: mn, credits, status: form.status };
      if (editing) await pb.collection("academic_courses").update(editing.id, payload);
      else          await pb.collection("academic_courses").create(payload);
      await fetchAll(); close();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course? Linked modules and subjects will be affected.")) return;
    try { await pb.collection("academic_courses").delete(id); setCourses(c => c.filter(x => x.id !== id)); }
    catch (err: any) { alert(err.message); }
  };

  const yearOptions = selDegree
    ? Array.from({ length: selDegree.durationYears || 4 }, (_, i) => i + 1)
    : Array.from({ length: 4 }, (_, i) => i + 1);

  return (
    <PortalLayout role="admin">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-1">Course Management</h2>
            <p className="text-text-muted text-sm">Manage academic courses. Click <span className="font-semibold text-primary">View Modules →</span> to drill into a course's modules and subjects.</p>
          </div>
          <button onClick={openCreate} className="bg-accent hover:bg-accent-light text-primary font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2">
            <Plus size={17} />Add Course
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total",     value: courses.length,                                    c: "text-primary" },
            { label: "Active",    value: courses.filter(c => c.status === "active").length,    c: "text-blue-600" },
            { label: "Completed", value: courses.filter(c => c.status === "completed").length, c: "text-purple-600" },
            { label: "Inactive",  value: courses.filter(c => c.status === "inactive").length,  c: "text-gray-500" },
          ].map(s => (
            <div key={s.label} className="border border-border rounded-lg p-4 bg-surface">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.c}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Degree filter */}
        <div className="mb-5">
          <select value={degFilter} onChange={e => setDegFilter(e.target.value)} className="input-field max-w-xs">
            <option value="all">All Degrees</option>
            {degrees.map(d => <option key={d.id} value={d.id}>{d.degreeName} ({d.academic_year || "—"})</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? <p className="text-center text-text-muted py-12">Loading...</p> : visible.length === 0 ? (
          <div className="text-center py-14 border border-border rounded-lg bg-surface">
            <LibraryBig size={44} className="mx-auto text-text-muted/30 mb-3" />
            <p className="text-text-muted mb-4">No courses found</p>
            <button onClick={openCreate} className="bg-primary text-white font-semibold px-5 py-2 rounded-md">Add First Course</button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-primary text-white">
                  <th className="text-left px-5 py-3">Code</th>
                  <th className="text-left px-5 py-3">Course Name</th>
                  <th className="text-left px-4 py-3">Degree</th>
                  <th className="text-center px-4 py-3">Year Level</th>
                  <th className="text-center px-4 py-3">Acad. Year</th>
                  <th className="text-center px-4 py-3">Modules</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3">Actions</th>
                </tr></thead>
                <tbody>{visible.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-primary">{c.courseCode}</td>
                    <td className="px-5 py-4 font-semibold">{c.courseName}</td>
                    <td className="px-4 py-4 text-text-muted text-xs max-w-[160px] truncate">{c.expand?.degree?.degreeName || "—"}</td>
                    <td className="px-4 py-4 text-center text-xs">{c.year_level ? `${ordinal(c.year_level)} Year` : "—"}</td>
                    <td className="px-4 py-4 text-center text-xs text-text-muted">{c.academic_year || "—"}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-primary">{modCounts[c.id] || 0}</span>
                      <span className="text-text-muted text-xs"> / {c.module_no || "?"}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusStyle(c.status)}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center items-center gap-1.5">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-secondary hover:text-primary" title="Edit"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-500 hover:text-red-700" title="Delete"><Trash2 size={14} /></button>
                        <button
                          onClick={() => navigate(`/portal/admin/academic-courses/${c.id}/modules`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent/10 hover:bg-accent/25 text-primary rounded-md text-xs font-semibold transition-colors"
                        >
                          Modules <ChevronRight size={12} />
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
              <h3 className="font-heading font-bold text-lg text-primary">{editing ? "Edit" : "Add"} Course</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div><label className="label">Degree *</label>
                <select value={form.degree} onChange={e => onDegreeChange(e.target.value)} required className="input-field">
                  <option value="">— Select Degree —</option>
                  {degrees.map(d => <option key={d.id} value={d.id}>{d.degreeName} ({d.academic_year || "—"})</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Year Level *</label>
                  <select value={form.year_level} onChange={e => setForm({ ...form, year_level: e.target.value })} required className="input-field">
                    {yearOptions.map(y => <option key={y} value={y}>{ordinal(y)} Year</option>)}
                  </select></div>
                <div><label className="label">Academic Year *</label>
                  <input value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })} required className="input-field" placeholder="e.g. 2023-2026" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Course Code *</label>
                  <input value={form.courseCode} onChange={e => setForm({ ...form, courseCode: e.target.value })} required className="input-field" placeholder="e.g. CS-Y1" /></div>
                <div><label className="label">Required Modules *</label>
                  <input type="number" min="0" value={form.module_no} onChange={e => setForm({ ...form, module_no: e.target.value })} required className="input-field" /></div>
              </div>
              <div><label className="label">Course Name *</label>
                <input value={form.courseName} onChange={e => setForm({ ...form, courseName: e.target.value })} required className="input-field" /></div>
              <div><label className="label">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                </select></div>
              <p className="text-xs text-text-muted bg-surface border border-border rounded px-3 py-2">
                💡 Course credits are automatically calculated from the sum of mandatory subject credits across all modules.
              </p>
              <div className="flex gap-3 pt-2 border-t border-border">
                <button type="submit" disabled={saving} className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-md">{saving ? "Saving…" : editing ? "Update" : "Add Course"}</button>
                <button type="button" onClick={close} className="px-5 py-2.5 border border-border rounded-md text-text-muted hover:text-primary font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminAcademicCourses;
