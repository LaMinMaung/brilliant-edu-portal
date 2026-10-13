import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Search, Globe, Eye, EyeOff, X, Upload } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const AVAILABLE_TAGS = [
  "Full-Time","Part-Time","Flexible","English","Literature","Research",
  "Programming","Web Dev","ICT","TESOL","Pedagogy","Teaching",
  "Communication","Linguistics","Social Impact","Development",
  "Leadership","Management","Foundation","Advanced","Coming Soon",
];

const EMPTY_FORM = {
  title: "", category: "diploma", description: "", duration: "", credits: "",
  tags: [] as string[], comingSoon: false, fullContent: "", applyFormLink: "", published: true,
};

const CAT_LABEL: Record<string, string> = {
  diploma: "Diploma", undergraduate: "Undergraduate", graduate: "Graduate", online: "Online",
};
const CAT_COLOR: Record<string, string> = {
  diploma:       "bg-sky-100 text-sky-700 border-sky-200",
  undergraduate: "bg-secondary/10 text-secondary border-secondary/30",
  graduate:      "bg-accent/10 text-primary border-accent/30",
  online:        "bg-green-100 text-green-700 border-green-300",
};

const AdminInformationPrograms: React.FC = () => {
  const [programs, setPrograms]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [pubFilter, setPubFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<any | null>(null);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving]       = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const userRole = pb.authStore.record?.role as string;
  const layoutRole = userRole === "information_admin" ? "information_admin" : "admin";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pb.collection("information_programs").getFullList({ sort: "-created", requestKey: null });
      setPrograms(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const visible = programs.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
    const matchCat = catFilter === "all" || p.category === catFilter;
    const matchPub = pubFilter === "all" || (pubFilter === "published" ? p.published : !p.published);
    return matchSearch && matchCat && matchPub;
  });

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setImageFile(null); setShowModal(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      title: p.title, category: p.category, description: p.description,
      duration: p.duration, credits: p.credits, tags: p.tags || [],
      comingSoon: p.comingSoon || false, fullContent: p.fullContent || "",
      applyFormLink: p.applyFormLink || "", published: p.published !== false,
    });
    setImageFile(null);
    setShowModal(true);
  };
  const close = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title",        form.title);
      fd.append("category",     form.category);
      fd.append("description",  form.description);
      fd.append("duration",     form.duration);
      fd.append("credits",      form.credits);
      form.tags.forEach(t => fd.append("tags", t));
      fd.append("comingSoon",   form.comingSoon.toString());
      fd.append("fullContent",  form.fullContent);
      fd.append("applyFormLink", form.applyFormLink);
      fd.append("published",    form.published.toString());
      if (imageFile) fd.append("image", imageFile);

      if (editing) {
        await pb.collection("information_programs").update(editing.id, fd);
      } else {
        await pb.collection("information_programs").create(fd);
      }
      await fetchAll();
      close();
    } catch (err: any) {
      console.error("Error saving information program:", err);
      alert(err?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: any) => {
    if (!confirm(`Are you sure you want to delete "${p.title}"? This action cannot be undone.`)) return;
    setDeletingId(p.id);
    try {
      // information_programs has NO relations to applications, students, or any other data.
      // Deletion is safe and only removes this information record.
      await pb.collection("information_programs").delete(p.id);
      setPrograms(prev => prev.filter(x => x.id !== p.id));
    } catch (err: any) {
      console.error("Error deleting information program:", err);
      const detail: string = err?.response?.message || err?.data?.message || err?.message || "";
      alert(
        `Unable to delete "${p.title}".\n\n` +
        `Technical detail: ${detail || "Unknown error — see browser console for details."}`
      );
    } finally {
      setDeletingId(null);
    }
  };

  const togglePublish = async (p: any) => {
    try {
      await pb.collection("information_programs").update(p.id, { published: !p.published });
      setPrograms(prev => prev.map(x => x.id === p.id ? { ...x, published: !x.published } : x));
    } catch (err: any) {
      alert(err?.message || "Failed to update publish status.");
    }
  };

  const handleTagToggle = (tag: string) =>
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }));

  return (
    <PortalLayout role={layoutRole as any}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-1">Information Programs</h2>
            <p className="text-text-muted text-sm">
              Public programs displayed on the website's Programs page. Independent from the registration/admissions system.
            </p>
          </div>
          <button onClick={openCreate}
            className="bg-accent hover:bg-accent-light text-primary font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2">
            <Plus size={17} />Add Program
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total",       value: programs.length,                          c: "text-primary" },
            { label: "Published",   value: programs.filter(p => p.published).length, c: "text-green-600" },
            { label: "Unpublished", value: programs.filter(p => !p.published).length,c: "text-orange-500" },
          ].map(s => (
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
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or description…"
              className="flex-1 py-2 text-sm bg-transparent focus:outline-none" />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field max-w-[180px]">
            <option value="all">All Categories</option>
            <option value="diploma">Diploma</option>
            <option value="undergraduate">Undergraduate</option>
            <option value="graduate">Graduate</option>
            <option value="online">Online</option>
          </select>
          <select value={pubFilter} onChange={e => setPubFilter(e.target.value)} className="input-field max-w-[160px]">
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-center text-text-muted py-12">Loading…</p>
        ) : visible.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-surface">
            <Globe size={44} className="mx-auto text-text-muted/30 mb-3" />
            <p className="text-text-muted mb-4">No programs found</p>
            <button onClick={openCreate} className="bg-primary text-white font-semibold px-5 py-2 rounded-md">
              Add First Program
            </button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="text-left px-5 py-3">Title</th>
                    <th className="text-left px-4 py-3">Category</th>
                    <th className="text-left px-4 py-3">Duration / Credits</th>
                    <th className="text-center px-4 py-3">Published</th>
                    <th className="text-center px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(p => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-primary">{p.title}</p>
                        {p.comingSoon && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-primary font-semibold">
                            Coming Soon
                          </span>
                        )}
                        {p.image && (
                          <span className="ml-1.5 text-[10px] text-green-600 font-medium">has image</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${CAT_COLOR[p.category] || ""}`}>
                          {CAT_LABEL[p.category] || p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs">
                        <p>{p.duration}</p>
                        <p>{p.credits}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => togglePublish(p)}
                          title={p.published ? "Click to unpublish" : "Click to publish"}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                            p.published
                              ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                              : "bg-orange-100 text-orange-600 border-orange-300 hover:bg-orange-200"
                          }`}
                        >
                          {p.published ? <><Eye size={11} />Published</> : <><EyeOff size={11} />Unpublished</>}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => openEdit(p)} className="p-1.5 text-secondary hover:text-primary" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            disabled={deletingId === p.id}
                            className="p-1.5 text-red-500 hover:text-red-700 disabled:opacity-40"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-bg rounded-lg border border-border overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0">
              <h3 className="font-heading font-bold text-xl text-primary">
                {editing ? "Edit" : "Add"} Information Program
              </h3>
              <button onClick={close} className="text-text-muted hover:text-primary"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg focus:outline-none focus:border-accent"
                  placeholder="Program title" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Category *</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg focus:outline-none focus:border-accent">
                    <option value="diploma">Diploma</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="graduate">Graduate</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div className="flex flex-col gap-3 justify-center pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} className="w-4 h-4" />
                    <span className="text-sm font-medium text-primary">Published (visible to public)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.comingSoon} onChange={e => setForm({ ...form, comingSoon: e.target.checked })} className="w-4 h-4" />
                    <span className="text-sm font-medium text-primary">Mark as Coming Soon</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Duration *</label>
                  <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} required
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg focus:outline-none focus:border-accent"
                    placeholder="e.g., 4 Years" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Credits *</label>
                  <input value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} required
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg focus:outline-none focus:border-accent"
                    placeholder="e.g., 120 Credits" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Short Description *</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required rows={3}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg focus:outline-none focus:border-accent resize-none"
                  placeholder="Brief description shown on the program card (max 1000 characters)" />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-2 p-3 border border-border rounded-md bg-bg">
                  {AVAILABLE_TAGS.map(tag => (
                    <button key={tag} type="button" onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        form.tags.includes(tag)
                          ? "bg-accent text-primary border border-accent"
                          : "bg-surface text-text-muted border border-border hover:border-primary"
                      }`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Image</label>
                <div className="border-2 border-dashed border-border rounded-md p-6 text-center hover:border-accent transition-colors">
                  <input type="file" accept="image/jpeg,image/png,image/webp"
                    onChange={e => setImageFile(e.target.files?.[0] || null)}
                    className="hidden" id="info-prog-img" />
                  <label htmlFor="info-prog-img" className="cursor-pointer">
                    <Upload size={32} className="mx-auto text-text-muted mb-2" />
                    <p className="text-sm font-medium text-primary">
                      {imageFile ? imageFile.name : editing?.image ? "Replace current image" : "Click to upload image"}
                    </p>
                    <p className="text-xs text-text-muted mt-1">JPG, PNG, WEBP (max 5MB)</p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Apply Form Link</label>
                <input type="url" value={form.applyFormLink} onChange={e => setForm({ ...form, applyFormLink: e.target.value })}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg focus:outline-none focus:border-accent"
                  placeholder="https://example.com/apply" />
                <p className="text-xs text-text-muted mt-1">External URL for the application form (opens in new tab)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Full Program Content</label>
                <textarea value={form.fullContent} onChange={e => setForm({ ...form, fullContent: e.target.value })} rows={8}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg focus:outline-none focus:border-accent resize-none font-mono"
                  placeholder="Full program details (supports HTML: <h2>, <p>, <ul>, <li>, <strong>)" />
                <p className="text-xs text-text-muted mt-1">
                  Supports HTML tags: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;
                </p>
              </div>

              <div className="flex gap-3 pt-2 border-t border-border">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-md">
                  {saving ? "Saving…" : editing ? "Update Program" : "Create Program"}
                </button>
                <button type="button" onClick={close}
                  className="px-5 py-2.5 border border-border rounded-md text-text-muted hover:text-primary font-semibold">
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

export default AdminInformationPrograms;
