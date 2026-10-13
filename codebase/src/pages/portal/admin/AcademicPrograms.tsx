import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, BookMarked, Search } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const empty = { title: "", short_name: "", department: "", description: "", status: "active" };

const AdminAcademicPrograms: React.FC = () => {
  const [programs, setPrograms]     = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<any | null>(null);
  const [form, setForm]             = useState({ ...empty });
  const [saving, setSaving]         = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, d] = await Promise.all([
        pb.collection("academic_programs").getFullList({ sort: "title", expand: "department", requestKey: null }),
        pb.collection("departments").getFullList({ sort: "departmentName", requestKey: null }),
      ]);
      setPrograms(p); setDepartments(d);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const visible = programs.filter(p => {
    const matchDept   = deptFilter === "all" || p.department === deptFilter;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.short_name.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  });

  const openCreate = () => { setEditing(null); setForm({ ...empty }); setShowModal(true); };
  const openEdit   = (r: any) => { setEditing(r); setForm({ title: r.title, short_name: r.short_name, department: r.department, description: r.description || "", status: r.status }); setShowModal(true); };
  const close      = () => { setShowModal(false); setEditing(null); };

  /** Check uniqueness of title and short_name before save */
  const checkUnique = async (field: "title" | "short_name", value: string): Promise<boolean> => {
    try {
      const existing = await pb.collection("academic_programs").getFirstListItem(
        pb.filter(`${field} = {:v}`, { v: value }), { requestKey: null }
      );
      if (editing && existing.id === editing.id) return true; // same record, OK
      alert(`A program with this ${field === "short_name" ? "short name" : "title"} already exists.`);
      return false;
    } catch (e: any) {
      if (e.status === 404) return true; // not found = unique
      throw e;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (!(await checkUnique("title",      form.title)))      return;
      if (!(await checkUnique("short_name", form.short_name))) return;
      if (editing) await pb.collection("academic_programs").update(editing.id, form);
      else          await pb.collection("academic_programs").create(form);
      await fetchAll(); close();
    } catch (err: any) { alert(err.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this program? Degrees linked to it may be affected.")) return;
    try { await pb.collection("academic_programs").delete(id); setPrograms(p => p.filter(x => x.id !== id)); }
    catch (err: any) { alert(err.message || "Failed to delete"); }
  };

  const ss = (s: string) => s === "active" ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <PortalLayout role="admin">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-1">Academic Programs</h2>
            <p className="text-text-muted text-sm">Programs belong to a Department and form the basis for Degrees</p>
          </div>
          <button onClick={openCreate} className="bg-accent hover:bg-accent-light text-primary font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2">
            <Plus size={17} />Add Program
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[{ label: "Total", value: programs.length, c: "text-primary" }, { label: "Active", value: programs.filter(p => p.status === "active").length, c: "text-green-600" }, { label: "Inactive", value: programs.filter(p => p.status === "inactive").length, c: "text-gray-500" }].map(s => (
            <div key={s.label} className="border border-border rounded-lg p-4 bg-surface">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.c}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-2 flex-1 min-w-[220px] border border-border rounded-md px-3 bg-surface">
            <Search size={15} className="text-text-muted shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or short name…" className="flex-1 py-2 text-sm bg-transparent focus:outline-none" />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="input-field max-w-[220px]">
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
          </select>
        </div>

        {loading ? <p className="text-center text-text-muted py-12">Loading...</p> : visible.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-surface">
            <BookMarked size={44} className="mx-auto text-text-muted/30 mb-3" />
            <p className="text-text-muted mb-4">No programs found</p>
            <button onClick={openCreate} className="bg-primary text-white font-semibold px-5 py-2 rounded-md">Add First Program</button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <table className="w-full text-sm">
              <thead><tr className="bg-primary text-white">
                <th className="text-left px-5 py-3">Title</th>
                <th className="text-left px-5 py-3">Short Name</th>
                <th className="text-left px-5 py-3">Department</th>
                <th className="text-center px-5 py-3">Status</th>
                <th className="text-center px-5 py-3">Actions</th>
              </tr></thead>
              <tbody>{visible.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                  <td className="px-5 py-3 font-semibold text-primary">{p.title}</td>
                  <td className="px-5 py-3"><span className="px-2 py-0.5 bg-accent/10 text-primary rounded font-mono text-xs font-bold">{p.short_name}</span></td>
                  <td className="px-5 py-3 text-text-muted">{p.expand?.department?.departmentName || "—"}</td>
                  <td className="px-5 py-3 text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${ss(p.status)}`}>{p.status}</span></td>
                  <td className="px-5 py-3"><div className="flex justify-center gap-2">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-secondary hover:text-primary"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
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
          <div className="relative w-full max-w-lg max-h-[90vh] bg-bg rounded-lg border border-border overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border bg-surface shrink-0">
              <h3 className="font-heading font-bold text-lg text-primary">{editing ? "Edit" : "Add"} Academic Program</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div><label className="label">Department *</label>
                <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required className="input-field">
                  <option value="">— Select Department —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Program Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="input-field" placeholder="e.g. Bachelor of Computer Science" /></div>
                <div><label className="label">Short Name * <span className="text-text-muted font-normal">(unique)</span></label>
                  <input value={form.short_name} onChange={e => setForm({ ...form, short_name: e.target.value })} required className="input-field" placeholder="e.g. BCS" /></div>
              </div>
              <div><label className="label">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="input-field resize-none" /></div>
              <div><label className="label">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select></div>
              <div className="flex gap-3 pt-2 border-t border-border">
                <button type="submit" disabled={saving} className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-md">{saving ? "Saving…" : editing ? "Update" : "Add Program"}</button>
                <button type="button" onClick={close} className="px-5 py-2.5 border border-border rounded-md text-text-muted hover:text-primary font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminAcademicPrograms;
