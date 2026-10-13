import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, Filter, Shield } from "lucide-react";
import pb from "../../../lib/pocketbase";
import { logActivity } from "../../../lib/logActivity";
import PortalLayout from "../../../components/PortalLayout";

const emptyForm = { email: "", password: "", passwordConfirm: "", name: "", role: "teacher", admin_role: "" };

const AdminUsers: React.FC = () => {
  const [users, setUsers]               = useState<any[]>([]);
  const [roles, setRoles]               = useState<any[]>([]); // admin_roles
  const [loading, setLoading]           = useState(true);
  const [roleFilter, setRoleFilter]     = useState("all");
  const [searchQuery, setSearchQuery]   = useState("");
  const [showModal, setShowModal]       = useState(false);
  const [editing, setEditing]           = useState<any | null>(null);
  const [formData, setFormData]         = useState({ ...emptyForm });
  const [saving, setSaving]             = useState(false);

  const currentUserId = pb.authStore.record?.id;
  const currentRole   = pb.authStore.record?.role;

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([
        pb.collection("users").getFullList({ filter: 'role != "student"', sort: "-created", expand: "admin_role", requestKey: null }),
        pb.collection("admin_roles").getFullList({ sort: "name", requestKey: null }),
      ]);
      setUsers(u); setRoles(r);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchRole   = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  /* Permissions: full admins can edit anyone, non-admin can edit own record */
  const canEdit   = (user: any) => currentRole === "admin" || user.id === currentUserId;
  const canDelete = (_user: any) => currentRole === "admin";

  const openCreate = () => { setEditing(null); setFormData({ ...emptyForm }); setShowModal(true); };
  const openEdit   = (u: any) => {
    setEditing(u);
    setFormData({ email: u.email, password: "", passwordConfirm: "", name: u.name, role: u.role, admin_role: u.admin_role || "" });
    setShowModal(true);
  };
  const close = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing && formData.password !== formData.passwordConfirm) { alert("Passwords do not match"); return; }
    setSaving(true);
    try {
      if (editing) {
        const payload: any = { name: formData.name };
        if (currentRole === "admin") {
          payload.role = formData.role;
          payload.admin_role = formData.admin_role || null;
        }
        await pb.collection("users").update(editing.id, payload);
        if (formData.admin_role !== (editing.admin_role || "")) {
          const roleName = roles.find(r => r.id === formData.admin_role)?.name || "None";
          await logActivity("role_change", `Changed admin role for ${editing.name} to: ${roleName}`);
        }
      } else {
        await pb.collection("users").create({
          email: formData.email, password: formData.password, passwordConfirm: formData.passwordConfirm,
          name: formData.name, role: formData.role,
          admin_role: formData.role === "admin" ? (formData.admin_role || null) : null,
          status: "active",
        });
        await logActivity("user_create", `Created new ${formData.role}: ${formData.name}`);
      }
      await fetchAll(); close();
    } catch (err: any) { alert(err.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (user: any) => {
    if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    try {
      await pb.collection("users").delete(user.id);
      await logActivity("user_delete", `Deleted ${user.role}: ${user.name} (${user.email})`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (err: any) { alert(err.message || "Failed to delete"); }
  };

  const roleColors: Record<string, string> = {
    teacher:           "bg-secondary/10 text-secondary border-secondary/30",
    admin:             "bg-accent/10 text-primary border-accent/30",
    information_admin: "bg-purple-100 text-purple-700 border-purple-300",
  };

  const roleLabel: Record<string, string> = {
    teacher: "Teacher", admin: "Admin", information_admin: "Info Admin",
  };

  return (
    <PortalLayout role="admin">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-1">Staff & Admin Management</h2>
            <p className="text-text-muted text-sm">Manage teachers and administrators (students managed separately)</p>
          </div>
          {currentRole === "admin" && (
            <button onClick={openCreate} className="bg-accent hover:bg-accent-light text-primary font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2">
              <Plus size={17} />Create User
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Staff",  value: users.length,                                              c: "text-primary" },
            { label: "Teachers",     value: users.filter(u => u.role === "teacher").length,            c: "text-secondary" },
            { label: "Admins",       value: users.filter(u => u.role === "admin" || u.role === "information_admin").length, c: "text-primary" },
          ].map(s => (
            <div key={s.label} className="border border-border rounded-lg p-4 bg-surface">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.c}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-[260px] border border-border rounded-md px-3 bg-surface">
            <Search size={16} className="text-text-muted shrink-0" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or email…"
              className="flex-1 py-2 text-sm bg-transparent focus:outline-none text-text" />
          </div>
            <div className="flex items-center gap-2">
            <Filter size={16} className="text-text-muted" />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field max-w-[180px]">
              <option value="all">All Roles</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
              <option value="information_admin">Info Admins</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? <p className="text-center text-text-muted py-12">Loading…</p> : filteredUsers.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-surface">
            <p className="text-text-muted">No users found</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-primary text-white">
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-center px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Admin Role</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3">Actions</th>
                </tr></thead>
                <tbody>{filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {user.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="font-semibold text-primary">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-text-muted text-sm">{user.email}</td>
                     <td className="px-4 py-3 text-center">
                       <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColors[user.role] || ""}`}>
                         {roleLabel[user.role] || user.role}
                       </span>
                     </td>
                     <td className="px-4 py-3">
                       {user.role === "admin" && user.expand?.admin_role ? (
                         <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                           <Shield size={11}/>{user.expand.admin_role.name}
                         </span>
                       ) : user.role === "admin" ? (
                         <span className="text-xs text-text-muted">Unassigned</span>
                       ) : user.role === "information_admin" ? (
                         <span className="text-xs text-purple-600 font-medium">Info Programs only</span>
                       ) : <span className="text-text-muted">—</span>}
                     </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-green-100 text-green-800 border-green-300 capitalize">{user.status || "active"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        {canEdit(user) && (
                          <button onClick={() => openEdit(user)} className="p-1.5 text-secondary hover:text-primary" title="Edit"><Edit2 size={14}/></button>
                        )}
                        {canDelete(user) && user.id !== currentUserId && (
                          <button onClick={() => handleDelete(user)} className="p-1.5 text-red-500 hover:text-red-700" title="Delete"><Trash2 size={14}/></button>
                        )}
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
              <h3 className="font-heading font-bold text-lg text-primary">{editing ? "Edit User" : "Create User"}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div><label className="label">Full Name *</label>
                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="input-field" /></div>
              {!editing && (
                <>
                  <div><label className="label">Email *</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required className="input-field" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="label">Password *</label>
                      <input type="password" minLength={8} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required className="input-field" /></div>
                    <div><label className="label">Confirm *</label>
                      <input type="password" minLength={8} value={formData.passwordConfirm} onChange={e => setFormData({ ...formData, passwordConfirm: e.target.value })} required className="input-field" /></div>
                  </div>
                </>
              )}
              {currentRole === "admin" && (
                <div className="grid grid-cols-2 gap-4">
                   <div><label className="label">Role *</label>
                    <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="input-field">
                       <option value="teacher">Teacher</option>
                       <option value="admin">Admin</option>
                       <option value="information_admin">Information Admin</option>
                     </select></div>
                   {formData.role === "admin" && (
                    <div><label className="label">Admin Role</label>
                      <select value={formData.admin_role} onChange={e => setFormData({ ...formData, admin_role: e.target.value })} className="input-field">
                        <option value="">— Select Role —</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select></div>
                  )}
                </div>
              )}
              <div className="flex gap-3 pt-2 border-t border-border">
                <button type="submit" disabled={saving} className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-md">{saving ? "Saving…" : editing ? "Update" : "Create"}</button>
                <button type="button" onClick={close} className="px-5 py-2.5 border border-border rounded-md text-text-muted hover:text-primary font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminUsers;
