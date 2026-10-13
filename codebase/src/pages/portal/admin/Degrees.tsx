import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, GraduationCap } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const emptyForm = { program: "", batch_no: "", academic_year: "", durationYears: "4", status: "active" };

const AdminDegrees: React.FC = () => {
  const [degrees, setDegrees]   = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState<any | null>(null);
  const [form, setForm]         = useState({ ...emptyForm });
  const [selProgram, setSelProgram] = useState<any | null>(null);
  const [saving, setSaving]     = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [d, p] = await Promise.all([
        pb.collection("degrees").getFullList({ sort: "-created", expand: "program,program.department", requestKey: null }),
        pb.collection("academic_programs").getFullList({ filter: 'status = "active"', sort: "title", expand: "department", requestKey: null }),
      ]);
      setDegrees(d); setPrograms(p);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setSelProgram(null); setShowModal(true); };
  const openEdit   = (r: any) => {
    setEditing(r);
    setSelProgram(r.expand?.program || null);
    setForm({ program: r.program || "", batch_no: r.batch_no || "", academic_year: r.academic_year || "", durationYears: String(r.durationYears), status: r.status });
    setShowModal(true);
  };
  const close = () => { setShowModal(false); setEditing(null); setSelProgram(null); };

  const onProgramChange = (id: string) => {
    const prog = programs.find(p => p.id === id) || null;
    setSelProgram(prog);
    setForm(f => ({ ...f, program: id }));
  };

  /** Uniqueness check: degreeName + batch_no + academic_year */
  const checkUnique = async (degreeName: string): Promise<boolean> => {
    if (!form.batch_no || !form.academic_year) return true;
    try {
      const existing = await pb.collection("degrees").getFirstListItem(
        pb.filter('degreeName = {:n} && batch_no = {:b} && academic_year = {:y}',
          { n: degreeName, b: form.batch_no, y: form.academic_year }),
        { requestKey: null }
      );
      if (editing && existing.id === editing.id) return true;
      alert("A degree with the same name, batch number, and academic year already exists.");
      return false;
    } catch (e: any) {
      if (e.status === 404) return true;
      throw e;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (!selProgram) { alert("Please select a Program."); return; }
      const degreeName = selProgram.title;
      const degreeCode = selProgram.short_name;
      if (!(await checkUnique(degreeName))) return;
      const payload = {
        program: form.program,
        degreeName,
        degreeCode,
        batch_no: form.batch_no,
        academic_year: form.academic_year,
        durationYears: parseInt(form.durationYears),
        status: form.status,
      };
      if (editing) await pb.collection("degrees").update(editing.id, payload);
      else          await pb.collection("degrees").create(payload);
      await fetchAll(); close();
    } catch (err: any) { alert(err.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this degree? Linked courses will be affected.")) return;
    try { await pb.collection("degrees").delete(id); setDegrees(d => d.filter(x => x.id !== id)); }
    catch (err: any) { alert(err.message || "Failed to delete"); }
  };

  const statusStyle = (s: string) => s === "active" ? "bg-green-100 text-green-800 border-green-300"
    : s === "completed" ? "bg-purple-100 text-purple-800 border-purple-300"
    : "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <PortalLayout role="admin">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-1">Degree Management</h2>
            <p className="text-text-muted text-sm">Degrees are based on Programs — select a Program to auto-fill name and code</p>
          </div>
          <button onClick={openCreate} className="bg-accent hover:bg-accent-light text-primary font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2">
            <Plus size={17} />Add Degree
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[{ label: "Total", value: degrees.length, c: "text-primary" }, { label: "Active", value: degrees.filter(d => d.status === "active").length, c: "text-green-600" }, { label: "Inactive", value: degrees.filter(d => d.status === "inactive").length, c: "text-gray-500" }].map(s => (
            <div key={s.label} className="border border-border rounded-lg p-4 bg-surface">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.c}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? <p className="text-center text-text-muted py-12">Loading...</p> : degrees.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-surface">
            <GraduationCap size={44} className="mx-auto text-text-muted/30 mb-3" />
            <p className="text-text-muted mb-4">No degrees yet. Create Programs first, then add Degrees.</p>
            <button onClick={openCreate} className="bg-primary text-white font-semibold px-5 py-2 rounded-md">Add First Degree</button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-primary text-white">
                  <th className="text-left px-5 py-3">Code</th>
                  <th className="text-left px-5 py-3">Degree Name</th>
                  <th className="text-left px-5 py-3">Batch</th>
                  <th className="text-left px-5 py-3">Academic Year</th>
                  <th className="text-center px-5 py-3">Duration</th>
                  <th className="text-center px-5 py-3">Status</th>
                  <th className="text-center px-5 py-3">Actions</th>
                </tr></thead>
                <tbody>{degrees.map(d => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                    <td className="px-5 py-3"><span className="font-mono text-xs font-bold px-2 py-0.5 bg-accent/10 text-primary rounded">{d.degreeCode}</span></td>
                    <td className="px-5 py-3 font-semibold text-primary">{d.degreeName}</td>
                    <td className="px-5 py-3 text-text-muted">{d.batch_no || "—"}</td>
                    <td className="px-5 py-3 text-text-muted">{d.academic_year || "—"}</td>
                    <td className="px-5 py-3 text-center text-text-muted">{d.durationYears} yr{d.durationYears !== 1 ? "s" : ""}</td>
                    <td className="px-5 py-3 text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusStyle(d.status)}`}>{d.status}</span></td>
                    <td className="px-5 py-3"><div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(d)} className="p-1.5 text-secondary hover:text-primary"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-lg max-h-[90vh] bg-bg rounded-lg border border-border overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border bg-surface shrink-0">
              <h3 className="font-heading font-bold text-lg text-primary">{editing ? "Edit" : "Add"} Degree</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {/* Program selection drives name + code */}
              <div><label className="label">Program * <span className="text-text-muted font-normal">(auto-fills name and code)</span></label>
                <select value={form.program} onChange={e => onProgramChange(e.target.value)} required className="input-field">
                  <option value="">— Select Program —</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.title} ({p.short_name})</option>)}
                </select></div>

              {selProgram && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                  <div><p className="label">Degree Name (auto)</p><p className="text-sm font-semibold text-primary">{selProgram.title}</p></div>
                  <div><p className="label">Degree Code (auto)</p><p className="text-sm font-mono font-bold text-primary">{selProgram.short_name}</p></div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Batch No *</label>
                  <input value={form.batch_no} onChange={e => setForm({ ...form, batch_no: e.target.value })} required className="input-field" placeholder="e.g. Batch 1 or 2024-01" /></div>
                <div><label className="label">Academic Year *</label>
                  <input value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })} required className="input-field" placeholder="e.g. 2025-2029" /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Duration (Years) *</label>
                  <input type="number" min="1" max="10" value={form.durationYears} onChange={e => setForm({ ...form, durationYears: e.target.value })} required className="input-field" /></div>
                <div><label className="label">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select></div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-border">
                <button type="submit" disabled={saving} className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-md">{saving ? "Saving…" : editing ? "Update" : "Add Degree"}</button>
                <button type="button" onClick={close} className="px-5 py-2.5 border border-border rounded-md text-text-muted hover:text-primary font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminDegrees;
