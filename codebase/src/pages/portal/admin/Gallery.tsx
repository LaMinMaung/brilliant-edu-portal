import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Images, GripVertical, ImageIcon } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const emptyForm = { title: "", description: "", status: "active", displayOrder: "" };

const AdminGallery: React.FC = () => {
  const [items, setItems]             = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editing, setEditing]         = useState<any | null>(null);
  const [form, setForm]               = useState({ ...emptyForm });
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [draggingId, setDraggingId]   = useState<string | null>(null);
  const [dragOverId, setDragOverId]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pb.collection("gallery").getFullList({
        sort: "displayOrder,created",
        requestKey: null,
      });
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Modal helpers ── */
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setImageFile(null); setImagePreview(null);
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      title:        item.title,
      description:  item.description || "",
      status:       item.status,
      displayOrder: item.displayOrder != null ? String(item.displayOrder) : "",
    });
    setImageFile(null);
    setImagePreview(item.image ? pb.files.getURL(item, item.image, { thumb: "600x400" }) : null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setEditing(null);
    setImageFile(null); setImagePreview(null);
  };

  /* ── Image input ── */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /* ── CRUD ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing && !imageFile) { alert("Please upload an image."); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title",       form.title);
      fd.append("description", form.description);
      fd.append("status",      form.status);
      if (form.displayOrder !== "") fd.append("displayOrder", form.displayOrder);
      if (imageFile) fd.append("image", imageFile);
      if (editing) await pb.collection("gallery").update(editing.id, fd);
      else          await pb.collection("gallery").create(fd);
      await fetchData(); closeModal();
    } catch (err: any) { alert(err.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this gallery image? This cannot be undone.")) return;
    try {
      await pb.collection("gallery").delete(id);
      setItems(p => p.filter(i => i.id !== id));
    } catch (err: any) { alert(err.message || "Failed to delete."); }
  };

  const handleToggleStatus = async (item: any) => {
    const next = item.status === "active" ? "inactive" : "active";
    try {
      await pb.collection("gallery").update(item.id, { status: next });
      setItems(p => p.map(i => i.id === item.id ? { ...i, status: next } : i));
    } catch (err) { console.error(err); }
  };

  /* ── Drag-and-drop reorder ── */
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== draggingId) setDragOverId(id);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) { reset(); return; }
    const fromIdx = items.findIndex(i => i.id === draggingId);
    const toIdx   = items.findIndex(i => i.id === targetId);
    const next    = [...items];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const updated = next.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    setItems(updated); reset();
    try {
      await Promise.all(updated.map(item =>
        pb.collection("gallery").update(item.id, { displayOrder: item.displayOrder })
      ));
    } catch { fetchData(); }
  };

  const reset = () => { setDraggingId(null); setDragOverId(null); };

  /* ── Derived ── */
  const activeCount   = items.filter(i => i.status === "active").length;
  const inactiveCount = items.filter(i => i.status === "inactive").length;

  return (
    <PortalLayout role="admin">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-1">Gallery Management</h2>
            <p className="text-text-muted text-sm">
              Images appear on the homepage gallery. Drag cards to reorder, or set a display order number.
            </p>
          </div>
          <button onClick={openCreate}
            className="shrink-0 bg-accent hover:bg-accent-light text-primary font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2 transition-colors">
            <Plus size={18}/>Add Image
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Images", value: items.length,  c: "text-primary"   },
            { label: "Active",       value: activeCount,   c: "text-green-600" },
            { label: "Inactive",     value: inactiveCount, c: "text-gray-500"  },
          ].map(s => (
            <div key={s.label} className="border border-border rounded-lg p-4 bg-surface">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.c}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
            <p className="text-text-muted">Loading gallery…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 border border-border rounded-xl bg-surface">
            <Images size={52} className="mx-auto text-text-muted/25 mb-4"/>
            <p className="text-primary font-semibold text-lg mb-1">No gallery images yet</p>
            <p className="text-sm text-text-muted mb-6">Add your first image to display on the homepage gallery.</p>
            <button onClick={openCreate}
              className="bg-primary text-white font-semibold px-6 py-2.5 rounded-md hover:bg-primary/90 transition-colors">
              Add First Image
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={e => handleDragStart(e, item.id)}
                onDragOver={e => handleDragOver(e, item.id)}
                onDrop={e => handleDrop(e, item.id)}
                onDragEnd={reset}
                className={`group relative border rounded-xl overflow-hidden bg-surface transition-all duration-200 ${
                  draggingId === item.id
                    ? "opacity-40 scale-95 cursor-grabbing"
                    : dragOverId === item.id
                      ? "border-accent shadow-lg ring-2 ring-accent/30 scale-[1.02]"
                      : "border-border hover:border-accent/50 hover:shadow-md cursor-grab"
                }`}
              >
                {/* Drag handle indicator */}
                <div className="absolute top-2 left-2 z-10 p-1.5 bg-black/40 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <GripVertical size={13} className="text-white"/>
                </div>

                {/* Image */}
                <div className="relative aspect-video bg-bg overflow-hidden">
                  {item.image ? (
                    <img
                      src={pb.files.getURL(item, item.image, { thumb: "400x280" })}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={32} className="text-text-muted/30"/>
                    </div>
                  )}

                  {/* Status toggle pill */}
                  <button
                    onClick={() => handleToggleStatus(item)}
                    title="Click to toggle active/inactive"
                    className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all ${
                      item.status === "active"
                        ? "bg-green-100/90 text-green-800 border-green-300 hover:bg-green-200"
                        : "bg-gray-100/90 text-gray-600 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {item.status === "active" ? "Active" : "Inactive"}
                  </button>
                </div>

                {/* Card body */}
                <div className="p-3">
                  <p className="font-semibold text-sm text-primary truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/60">
                    <span className="text-xs text-text-muted">
                      Order: <span className="font-semibold text-primary">{item.displayOrder ?? "—"}</span>
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(item)}
                        className="p-1.5 text-secondary hover:text-primary hover:bg-bg rounded-md transition-colors"
                        title="Edit">
                        <Edit2 size={13}/>
                      </button>
                      <button onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={closeModal}/>
          <div className="relative w-full max-w-lg max-h-[92vh] bg-bg rounded-xl border border-border overflow-hidden flex flex-col">

            <div className="px-6 py-4 border-b border-border bg-surface shrink-0">
              <h3 className="font-heading font-bold text-xl text-primary">
                {editing ? "Edit Gallery Image" : "Add Gallery Image"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">

              {/* Image upload + preview */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Image {!editing && <span className="text-red-500">*</span>}
                </label>
                {imagePreview && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-border aspect-video bg-bg">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover"/>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-primary hover:file:bg-accent/20 cursor-pointer"
                />
                <p className="text-xs text-text-muted mt-1">
                  {editing ? "Leave empty to keep existing image. " : ""}Accepted: JPG, PNG, WEBP
                </p>
              </div>

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
                  placeholder="e.g., Students at orientation day"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Description <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg text-text focus:outline-none focus:border-accent transition-colors resize-none"
                  placeholder="Optional caption or description"
                />
              </div>

              {/* Status + Display Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
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
                  <p className="text-xs text-text-muted mt-1">Lower = first. Drag cards to reorder visually.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-border">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-md transition-colors">
                  {saving ? "Saving…" : editing ? "Update Image" : "Add Image"}
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

export default AdminGallery;
