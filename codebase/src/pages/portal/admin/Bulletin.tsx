import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Link2, ExternalLink, ToggleLeft, ToggleRight } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const emptyForm = { title: "", description: "", url: "", displayOrder: "", is_active: true };

const AdminBulletin: React.FC = () => {
  const [items, setItems]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<any | null>(null);
  const [form, setForm]           = useState({ ...emptyForm });
  const [saving, setSaving]       = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pb.collection("bulletins").getFullList({
        sort: "displayOrder,created",
        requestKey: null,
      });
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      title:        item.title,
      description:  item.description,
      url:          item.url,
      displayOrder: item.displayOrder != null ? String(item.displayOrder) : "",
      is_active:    item.is_active,
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title:        form.title,
        description:  form.description,
        url:          form.url,
        displayOrder: form.displayOrder !== "" ? Number(form.displayOrder) : null,
        is_active:    form.is_active,
      };
      if (editing) await pb.collection("bulletins").update(editing.id, payload);
      else          await pb.collection("bulletins").create(payload);
      await fetchData();
      closeModal();
    } catch (err: any) { alert(err.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bulletin item? This cannot be undone.")) return;
    try {
      await pb.collection("bulletins").delete(id);
      setItems(p => p.filter(i => i.id !== id));
    } catch (err: any) { alert(err.message || "Failed to delete."); }
  };

  const handleToggle = async (item: any) => {
    const next = !item.is_active;
    try {
      await pb.collection("bulletins").update(item.id, { is_active: next });
      setItems(p => p.map(i => i.id === item.id ? { ...i, is_active: next } : i));
    } catch (err) { console.error(err); }
  };

  const activeCount   = items.filter(i => i.is_active).length;
  const inactiveCount = items.filter(i => !i.is_active).length;

  return (
    <PortalLayout role="admin">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-1">Bulletin (Forms & Links)</h2>
            <p className="text-text-muted text-sm">
              Manage bulletins visible to students in the student portal. Active items appear ordered by display order.
            </p>
          </div>
          <button onClick={openCreate}
            className="shrink-0 bg-accent hover:bg-accent-light text-primary font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2 transition-colors">
            <Plus size={18} /> Add Bulletin
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total",    value: items.length,  c: "text-primary"   },
            { label: "Active",   value: activeCount,   c: "text-green-600" },
            { label: "Inactive", value: inactiveCount, c: "text-gray-500"  },
          ].map(s => (
            <div key={s.label} className="border border-border rounded-lg p-4 bg-surface">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.c}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-muted">Loading bulletins…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 border border-border rounded-xl bg-surface">
            <Link2 size={48} className="mx-auto text-text-muted/25 mb-4" />
            <p className="text-primary font-semibold text-lg mb-1">No bulletin items yet</p>
            <p className="text-sm text-text-muted mb-6">Add your first bulletin to share forms and links with students.</p>
            <button onClick={openCreate}
              className="bg-primary text-white font-semibold px-6 py-2.5 rounded-md hover:bg-primary/90 transition-colors">
              Add First Bulletin
            </button>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-bg border-b border-border">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Title & Description</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide hidden md:table-cell">URL</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-5 py-4 text-center">
                      <span className="text-xs font-semibold text-text-muted bg-bg border border-border rounded px-2 py-0.5">
                        {item.displayOrder ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="font-semibold text-primary truncate">{item.title}</p>
                      <p className="text-text-muted text-xs mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="text-secondary hover:text-primary inline-flex items-center gap-1 text-xs font-medium truncate max-w-[180px]">
                        <ExternalLink size={12} className="shrink-0" />
                        <span className="truncate">{item.url}</span>
                      </a>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button onClick={() => handleToggle(item)}
                        title={item.is_active ? "Click to deactivate" : "Click to activate"}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                          item.is_active
                            ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                        }`}>
                        {item.is_active
                          ? <><ToggleRight size={13} />Active</>
                          : <><ToggleLeft size={13} />Inactive</>
                        }
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(item)}
                          className="p-1.5 text-secondary hover:text-primary hover:bg-bg rounded-md transition-colors" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg max-h-[92vh] bg-bg rounded-xl border border-border overflow-hidden flex flex-col">

            <div className="px-6 py-4 border-b border-border bg-surface shrink-0">
              <h3 className="font-heading font-bold text-xl text-primary">
                {editing ? "Edit Bulletin" : "Add Bulletin"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg text-text focus:outline-none focus:border-accent transition-colors"
                  placeholder="e.g., Enrollment Form – Semester 1"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg text-text focus:outline-none focus:border-accent transition-colors resize-none"
                  placeholder="Briefly describe what this form or link is for."
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                  required
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg text-text focus:outline-none focus:border-accent transition-colors"
                  placeholder="https://docs.google.com/forms/…"
                />
                <p className="text-xs text-text-muted mt-1">Must be a valid HTTPS link (Google Form or any external URL).</p>
              </div>

              {/* Status + Display Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Status</label>
                  <select value={form.is_active ? "active" : "inactive"}
                    onChange={e => setForm({ ...form, is_active: e.target.value === "active" })}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg text-text focus:outline-none focus:border-accent transition-colors">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Display Order</label>
                  <input
                    type="number" min="0"
                    value={form.displayOrder}
                    onChange={e => setForm({ ...form, displayOrder: e.target.value })}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg text-text focus:outline-none focus:border-accent transition-colors"
                    placeholder="e.g., 1"
                  />
                  <p className="text-xs text-text-muted mt-1">Lower number appears first.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-border">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-md transition-colors">
                  {saving ? "Saving…" : editing ? "Update Bulletin" : "Add Bulletin"}
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

export default AdminBulletin;
