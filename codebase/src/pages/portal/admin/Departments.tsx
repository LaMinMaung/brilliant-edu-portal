import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Building2 } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const emptyForm = { departmentCode: "", departmentName: "", status: "active" };

const AdminDepartments: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState<any | null>(null);
  const [form, setForm]         = useState({ ...emptyForm });
  const [saving, setSaving]     = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await pb.collection("departments").getFullList({ sort: "departmentCode", requestKey: null });
      setDepartments(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit   = (r: any) => { setEditing(r); setForm({ departmentCode: r.departmentCode, departmentName: r.departmentName, status: r.status }); setShowModal(true); };
  const close      = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await pb.collection("departments").update(editing.id, form);
      else          await pb.collection("departments").create(form);
      await fetchAll(); close();
    } catch (err: any) { alert(err.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this department? Programs under it may be affected.")) return;
    try { await pb.collection("departments").delete(id); setDepartments(d => d.filter(x => x.id !== id)); }
    catch (err: any) { alert(err.message || "Failed to delete"); }
  };

  const ss = (s: string) => s === "active" ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <PortalLayout role="admin">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-1">Department Management</h2>
            <p className="text-text-muted text-sm">Departments are the top-level organisational units. Programs belong to Departments.</p>
          </div>
          <button onClick={openCreate} className="bg-accent hover:bg-accent-light text-primary font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2">
            <Plus size={17} />Add Department
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[{ label: "Total", value: departments.length, c: "text-primary" }, { label: "Active", value: departments.filter(d => d.status === "active").length, c: "text-green-600" }, { label: "Inactive", value: departments.filter(d => d.status === "inactive").length, c: "text-gray-500" }].map(s => (
            <div key={s.label} className="border border-border rounded-lg p-4 bg-surface">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.c}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? <p className="text-center text-text-muted py-12">Loading...</p> : departments.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-surface">
            <Building2 size={44} className="mx-auto text-text-muted/30 mb-3" />
            <p className="text-text-muted mb-4">No departments yet</p>
            <button onClick={openCreate} className="bg-primary text-white font-semibold px-5 py-2 rounded-md">Add Department</button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <table className="w-full text-sm">
              <thead><tr className="bg-primary text-white">
                <th className="text-left px-5 py-3">Code</th>
                <th className="text-left px-5 py-3">Department Name</th>
                <th className="text-center px-5 py-3">Status</th>
                <th className="text-center px-5 py-3">Actions</th>
              </tr></thead>
              <tbody>{departments.map(d => (
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                  <td className="px-5 py-3 font-semibold text-primary">{d.departmentCode}</td>
                  <td className="px-5 py-3">{d.departmentName}</td>
                  <td className="px-5 py-3 text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${ss(d.status)}`}>{d.status}</span></td>
                  <td className="px-5 py-3"><div className="flex justify-center gap-2">
                    <button onClick={() => openEdit(d)} className="p-1.5 text-secondary hover:text-primary"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
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
          <div className="relative w-full max-w-sm bg-bg rounded-lg border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-surface">
              <h3 className="font-heading font-bold text-lg text-primary">{editing ? "Edit" : "Add"} Department</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Code *</label>
                  <input value={form.departmentCode} onChange={e => setForm({ ...form, departmentCode: e.target.value })} required className="input-field" placeholder="e.g. CS" /></div>
                <div><label className="label">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                    <option value="active">Active</option><option value="inactive">Inactive</option>
                  </select></div>
              </div>
              <div><label className="label">Department Name *</label>
                <input value={form.departmentName} onChange={e => setForm({ ...form, departmentName: e.target.value })} required className="input-field" placeholder="e.g. Computer Science" /></div>
              <div className="flex gap-3 pt-2 border-t border-border">
                <button type="submit" disabled={saving} className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-md">{saving ? "Saving…" : editing ? "Update" : "Add"}</button>
                <button type="button" onClick={close} className="px-5 py-2.5 border border-border rounded-md text-text-muted hover:text-primary font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminDepartments;
