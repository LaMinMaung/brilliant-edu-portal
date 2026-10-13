import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Shield, ShieldCheck, Lock } from "lucide-react";
import pb from "../../../lib/pocketbase";
import { logActivity } from "../../../lib/logActivity";
import PortalLayout from "../../../components/PortalLayout";

const ALL_PERMISSIONS: { key: string; label: string; section: string }[] = [
  { key: "dashboard",    label: "Dashboard",            section: "General" },
  { key: "users",        label: "Staff & Admins",        section: "User Management" },
  { key: "enrollments",  label: "Enrollments",           section: "User Management" },
  { key: "departments",  label: "Departments",           section: "Academic" },
  { key: "programs",     label: "Programs",              section: "Academic" },
  { key: "degrees",      label: "Degrees",               section: "Academic" },
  { key: "courses",      label: "Courses",               section: "Academic" },
  { key: "grade_config", label: "Grade Config",          section: "Academic" },
  { key: "students",     label: "Student Management",    section: "Students" },
  { key: "grades",       label: "Grade Management",      section: "Students" },
  { key: "collaborators","label": "Partner Institutions", section: "System" },
  { key: "settings",     label: "Settings",              section: "System" },
  { key: "activity_logs",label: "Activity Logs",         section: "System" },
  { key: "roles",        label: "Roles & Permissions",   section: "System" },
];

const SECTIONS = [...new Set(ALL_PERMISSIONS.map(p => p.section))];

const COLOR_CLASSES: Record<string, string> = {
  primary: "bg-primary/10 text-primary border-primary/30",
  blue:    "bg-blue-100 text-blue-800 border-blue-300",
  green:   "bg-green-100 text-green-800 border-green-300",
  yellow:  "bg-yellow-100 text-yellow-800 border-yellow-300",
  purple:  "bg-purple-100 text-purple-800 border-purple-300",
};

const emptyForm = { name: "", description: "", color: "blue", permissions: [] as string[] };

const AdminRolesPermissions: React.FC = () => {
  const [roles, setRoles]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState<any | null>(null);
  const [form, setForm]         = useState({ ...emptyForm, permissions: [] as string[] });
  const [saving, setSaving]     = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pb.collection("admin_roles").getFullList({ sort: "name", requestKey: null });
      setRoles(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, permissions: ["dashboard"] });
    setShowModal(true);
  };
  const openEdit = (r: any) => {
    setEditing(r);
    setForm({ name: r.name, description: r.description || "", color: r.color || "blue", permissions: r.permissions || [] });
    setShowModal(true);
  };
  const close = () => { setShowModal(false); setEditing(null); };

  const togglePerm = (key: string) => {
    setForm(f => {
      const has = f.permissions.includes(key);
      return { ...f, permissions: has ? f.permissions.filter(k => k !== key) : [...f.permissions, key] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { name: form.name, description: form.description, color: form.color, permissions: form.permissions, is_system: false };
      if (editing) {
        await pb.collection("admin_roles").update(editing.id, payload);
        await logActivity("role_change", `Updated role: ${form.name}`);
      } else {
        await pb.collection("admin_roles").create(payload);
        await logActivity("role_change", `Created new role: ${form.name}`);
      }
      await fetchRoles(); close();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (r: any) => {
    if (r.is_system) { alert("System roles cannot be deleted."); return; }
    if (!confirm(`Delete role "${r.name}"? Users with this role will have their role cleared.`)) return;
    try {
      await pb.collection("admin_roles").delete(r.id);
      await logActivity("role_change", `Deleted role: ${r.name}`);
      setRoles(prev => prev.filter(x => x.id !== r.id));
    } catch (err: any) { alert(err.message); }
  };

  return (
    <PortalLayout role="admin">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-1">Roles & Permissions</h2>
            <p className="text-text-muted text-sm">Define admin roles and configure their module access permissions</p>
          </div>
          <button onClick={openCreate} className="bg-accent hover:bg-accent-light text-primary font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2">
            <Plus size={17}/>Create Role
          </button>
        </div>

        {loading ? <p className="text-center text-text-muted py-12">Loading…</p> : (
          <div className="grid gap-4">
            {roles.map(role => {
              const perms: string[] = role.permissions || [];
              return (
                <div key={role.id} className="border border-border rounded-xl bg-surface overflow-hidden">
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {role.is_system
                          ? <ShieldCheck size={22} className="text-primary"/>
                          : <Shield size={22} className="text-secondary"/>}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading font-bold text-lg text-primary">{role.name}</h3>
                          {role.is_system && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold border border-primary/20">
                              <Lock size={10}/>System
                            </span>
                          )}
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${COLOR_CLASSES[role.color] || COLOR_CLASSES.blue}`}>{perms.length} permissions</span>
                        </div>
                        {role.description && <p className="text-sm text-text-muted mt-0.5">{role.description}</p>}

                        {/* Permission tags */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {role.is_system ? (
                            <span className="text-xs text-text-muted italic">All permissions (full access)</span>
                          ) : perms.length === 0 ? (
                            <span className="text-xs text-text-muted italic">No permissions assigned</span>
                          ) : perms.map(key => {
                            const perm = ALL_PERMISSIONS.find(p => p.key === key);
                            return (
                              <span key={key} className="px-2 py-0.5 bg-accent/10 text-primary rounded text-xs font-medium border border-accent/20">
                                {perm?.label || key}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!role.is_system && (
                        <>
                          <button onClick={() => openEdit(role)} className="p-2 text-secondary hover:text-primary" title="Edit"><Edit2 size={15}/></button>
                          <button onClick={() => handleDelete(role)} className="p-2 text-red-500 hover:text-red-700" title="Delete"><Trash2 size={15}/></button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={close}/>
          <div className="relative w-full max-w-lg max-h-[90vh] bg-bg rounded-xl border border-border overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border bg-surface shrink-0">
              <h3 className="font-heading font-bold text-lg text-primary">{editing ? "Edit Role" : "Create Role"}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Role Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-field" placeholder="e.g. Finance Admin"/></div>
                <div><label className="label">Color</label>
                  <select value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="input-field">
                    <option value="primary">Default</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="yellow">Yellow</option>
                    <option value="purple">Purple</option>
                  </select></div>
              </div>
              <div><label className="label">Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="Brief description of this role's responsibilities"/></div>

              {/* Permissions */}
              <div>
                <label className="label mb-3">Permissions</label>
                <div className="space-y-4">
                  {SECTIONS.map(section => {
                    const sectionPerms = ALL_PERMISSIONS.filter(p => p.section === section);
                    return (
                      <div key={section}>
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">{section}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {sectionPerms.map(perm => {
                            const checked = form.permissions.includes(perm.key);
                            return (
                              <label key={perm.key} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${checked ? "border-accent bg-accent/5 text-primary" : "border-border bg-surface text-text-muted hover:border-accent/40"}`}>
                                <input type="checkbox" checked={checked} onChange={() => togglePerm(perm.key)} className="w-4 h-4 accent-primary rounded"/>
                                {perm.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-border">
                <button type="submit" disabled={saving} className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-md">{saving ? "Saving…" : editing ? "Update Role" : "Create Role"}</button>
                <button type="button" onClick={close} className="px-5 py-2.5 border border-border rounded-md text-text-muted hover:text-primary font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminRolesPermissions;
