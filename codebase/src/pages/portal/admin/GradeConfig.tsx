import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, SlidersHorizontal } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const emptyForm = { gradeLabel: "", minMarks: "", maxMarks: "", gradePoint: "", remarks: "" };

const AdminGradeConfig: React.FC = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await pb.collection("grade_configs").getFullList({ sort: "-minMarks", requestKey: null });
      setConfigs(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit   = (r: any) => { setEditing(r); setForm({ gradeLabel: r.gradeLabel, minMarks: String(r.minMarks), maxMarks: String(r.maxMarks), gradePoint: String(r.gradePoint), remarks: r.remarks || "" }); setShowModal(true); };
  const close = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { gradeLabel: form.gradeLabel, minMarks: parseFloat(form.minMarks), maxMarks: parseFloat(form.maxMarks), gradePoint: parseFloat(form.gradePoint), remarks: form.remarks };
      if (editing) await pb.collection("grade_configs").update(editing.id, payload);
      else          await pb.collection("grade_configs").create(payload);
      await fetch(); close();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this grade configuration?")) return;
    try { await pb.collection("grade_configs").delete(id); setConfigs(c => c.filter(x => x.id !== id)); }
    catch (err: any) { alert(err.message); }
  };

  const labelColor = (l: string) => {
    if (l.startsWith("A")) return "bg-green-100 text-green-800 border-green-300";
    if (l.startsWith("B")) return "bg-blue-100 text-blue-800 border-blue-300";
    if (l.startsWith("C")) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (l.startsWith("D")) return "bg-orange-100 text-orange-800 border-orange-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  return (
    <PortalLayout role="admin">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-1">Grade Configuration</h2>
            <p className="text-text-muted text-sm">Define grade labels, mark ranges and grade points</p>
          </div>
          <button onClick={openCreate} className="bg-accent hover:bg-accent-light text-primary font-semibold px-5 py-2.5 rounded-md transition-colors inline-flex items-center gap-2">
            <Plus size={17} />Add Grade
          </button>
        </div>

        {loading ? <p className="text-center text-text-muted py-12">Loading...</p> : configs.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-surface">
            <SlidersHorizontal size={44} className="mx-auto text-text-muted/30 mb-3" />
            <p className="text-text-muted mb-4">No grade configurations yet</p>
            <button onClick={openCreate} className="bg-primary text-white font-semibold px-5 py-2 rounded-md">Add Grade Config</button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <table className="w-full text-sm">
              <thead><tr className="bg-primary text-white">
                <th className="text-center px-5 py-3">Grade</th>
                <th className="text-center px-5 py-3">Min Marks</th>
                <th className="text-center px-5 py-3">Max Marks</th>
                <th className="text-center px-5 py-3">Grade Point</th>
                <th className="text-left px-5 py-3">Remarks</th>
                <th className="text-center px-5 py-3">Actions</th>
              </tr></thead>
              <tbody>{configs.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                  <td className="px-5 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${labelColor(c.gradeLabel)}`}>{c.gradeLabel}</span>
                  </td>
                  <td className="px-5 py-3 text-center font-semibold">{c.minMarks}</td>
                  <td className="px-5 py-3 text-center font-semibold">{c.maxMarks}</td>
                  <td className="px-5 py-3 text-center font-semibold text-secondary">{c.gradePoint}</td>
                  <td className="px-5 py-3 text-text-muted">{c.remarks || "—"}</td>
                  <td className="px-5 py-3"><div className="flex justify-center gap-2">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-secondary hover:text-primary"><Edit2 size={15} /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-md bg-bg rounded-lg border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-surface">
              <h3 className="font-heading font-bold text-lg text-primary">{editing ? "Edit" : "Add"} Grade Configuration</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Grade Label *</label><input value={form.gradeLabel} onChange={e => setForm({ ...form, gradeLabel: e.target.value })} required className="input-field" placeholder="e.g. A+" /></div>
                <div><label className="label">Grade Point *</label><input type="number" step="0.01" min="0" value={form.gradePoint} onChange={e => setForm({ ...form, gradePoint: e.target.value })} required className="input-field" placeholder="e.g. 4.00" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Min Marks *</label><input type="number" min="0" value={form.minMarks} onChange={e => setForm({ ...form, minMarks: e.target.value })} required className="input-field" /></div>
                <div><label className="label">Max Marks *</label><input type="number" min="0" value={form.maxMarks} onChange={e => setForm({ ...form, maxMarks: e.target.value })} required className="input-field" /></div>
              </div>
              <div><label className="label">Remarks</label><input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} className="input-field" placeholder="e.g. Excellent" /></div>
              <div className="flex gap-3 pt-2 border-t border-border">
                <button type="submit" disabled={saving} className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-md">{saving ? "Saving..." : editing ? "Update" : "Add"}</button>
                <button type="button" onClick={close} className="px-5 py-2.5 border border-border rounded-md text-text-muted hover:text-primary font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminGradeConfig;
