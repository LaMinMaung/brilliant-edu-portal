import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, ArrowRight, Edit2, Plus, X, Upload } from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import SectionHeading from "../components/SectionHeading";
import TiltCard from "../components/TiltCard";
import FloatingShapes from "../components/FloatingShapes";
import pb from "../lib/pocketbase";

const CATEGORIES = ["Partnership","Programs","Achievements","Events","Student Success","Announcements"];

const MediaNews: React.FC = () => {
  const navigate = useNavigate();
  const [news, setNews]               = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showAll, setShowAll]         = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [saving, setSaving]           = useState(false);

  const [form, setForm] = useState({
    title: "", date: new Date().toISOString().split("T")[0],
    category: "Announcements", description: "",
  });

  const isAdmin = pb.authStore.isValid && pb.authStore.record?.role === "admin";

  useEffect(() => { fetchNews(); }, []);

  const fetchNews = async () => {
    try {
      const data = await pb.collection("news").getFullList({ sort: "-date", requestKey: null });
      setNews(data);
    } catch (err) { console.error("Error fetching news:", err); }
    finally { setLoading(false); }
  };

  /* open edit modal — only basic metadata (blocks managed on detail page) */
  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({ title: item.title, date: item.date?.split(" ")[0] ?? "", category: item.category, description: item.description });
    setImageFile(null);
    setShowCreateModal(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: "", date: new Date().toISOString().split("T")[0], category: "Announcements", description: "" });
    setImageFile(null);
    setShowCreateModal(true);
  };

  const closeModal = () => { setShowCreateModal(false); setEditingId(null); };

  const handleSave = async () => {
    if (!form.title.trim()) { alert("Please enter a title."); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title",       form.title);
      fd.append("date",        form.date);
      fd.append("category",    form.category);
      fd.append("description", form.description);
      fd.append("fullContent", ""); // optional; blocks are the primary content
      if (imageFile) fd.append("image", imageFile);

      if (editingId) {
        await pb.collection("news").update(editingId, fd);
        await fetchNews();
        closeModal();
      } else {
        // After creating, navigate to the detail page so admin can add content blocks
        const created = await pb.collection("news").create(fd);
        closeModal();
        navigate(`/media-news/${created.id}`);
      }
    } catch (err: any) {
      console.error("Error saving news:", err);
      alert(err?.message || "Failed to save. Please try again.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this article and all its content blocks? This cannot be undone.")) return;
    try {
      await pb.collection("news").delete(id);
      setNews(prev => prev.filter(n => n.id !== id));
    } catch (err: any) { alert(err?.message || "Failed to delete."); }
  };

  const displayed = showAll ? news : news.slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="bg-surface border-b border-border relative overflow-hidden">
        <FloatingShapes variant="hero" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <ScrollReveal>
            <span className="text-secondary text-sm font-semibold tracking-widest uppercase">Media & News</span>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <h1 className="font-heading font-bold text-4xl lg:text-5xl text-primary mt-3 max-w-2xl">
              Latest Updates & Announcements
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}><div className="w-20 h-1 bg-accent mt-4 rounded-full" /></ScrollReveal>
          <ScrollReveal delay={300}>
            <p className="mt-6 text-text-muted text-lg leading-relaxed max-w-2xl">
              Stay informed about the latest news, events, and achievements at Brilliant Educational Institute.
            </p>
          </ScrollReveal>
          {isAdmin && (
            <ScrollReveal delay={400}>
              <button onClick={openCreate}
                className="mt-6 bg-primary hover:bg-primary-light text-white font-semibold px-6 py-2.5 rounded-md transition-colors inline-flex items-center gap-2">
                <Plus size={18} />Create Article
              </button>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Grid */}
      <section className="py-20 lg:py-28 relative">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <p className="text-text-muted text-center py-12">Loading news…</p>
          ) : news.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-text-muted text-lg mb-4">No articles yet.</p>
              {isAdmin && <button onClick={openCreate} className="bg-primary text-white font-semibold px-6 py-3 rounded-md">Create First Article</button>}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayed.map((item, i) => (
                  <ScrollReveal key={item.id} delay={i * 80}>
                    <TiltCard className="border border-border rounded-lg overflow-hidden bg-bg h-full flex flex-col group hover:border-accent transition-colors duration-300">
                      {/* Image */}
                      <div className="relative h-48 bg-surface flex items-center justify-center overflow-hidden">
                        {item.image ? (
                          <img src={pb.files.getURL(item, item.image)} alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-text-muted/30">
                            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                            <span className="text-xs">No Cover</span>
                          </div>
                        )}
                        <span className="absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full bg-primary/90 text-white backdrop-blur-sm">
                          {item.category}
                        </span>
                      </div>
                      {/* Content */}
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
                          <Calendar size={14} className="text-secondary" />
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                        <h3 className="font-heading font-bold text-lg text-primary mb-3 leading-snug">{item.title}</h3>
                        <p className="text-text-muted text-sm leading-relaxed mb-5 flex-1">{item.description}</p>
                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-auto">
                          <Link to={`/media-news/${item.id}`}
                            className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-semibold text-secondary hover:text-primary hover:gap-3 transition-all duration-300 group/btn">
                            Read More
                            <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                          {isAdmin && (
                            <>
                              <button onClick={() => openEdit(item)} title="Edit metadata"
                                className="p-2 text-secondary hover:text-primary transition-colors rounded-md hover:bg-surface">
                                <Edit2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </TiltCard>
                  </ScrollReveal>
                ))}
              </div>
              {news.length > 6 && !showAll && (
                <div className="text-center mt-12">
                  <button onClick={() => setShowAll(true)}
                    className="bg-primary hover:bg-primary-light text-white font-semibold px-8 py-3 rounded-md transition-all duration-300 hover:scale-105">
                    See More ({news.length - 6} more)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Create / Edit Modal (basic metadata only) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-bg rounded-lg border border-border overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0">
              <h3 className="font-heading font-bold text-xl text-primary">
                {editingId ? "Edit Article" : "Create New Article"}
              </h3>
              <button onClick={closeModal} className="text-text-muted hover:text-primary"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4">
              {!editingId && (
                <div className="bg-accent/10 border border-accent/30 rounded-md px-4 py-3 text-sm text-primary">
                  After creating, you'll be taken to the article page where you can add photos and text blocks.
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg focus:outline-none focus:border-accent"
                  placeholder="Article title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Category *</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg focus:outline-none focus:border-accent">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Short Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg focus:outline-none focus:border-accent resize-none"
                  placeholder="Brief summary shown on the news card (max 500 characters)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Cover Photo</label>
                <div className="border-2 border-dashed border-border rounded-md p-5 text-center hover:border-accent transition-colors">
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setImageFile(e.target.files?.[0] || null)} className="hidden" id="news-cover" />
                  <label htmlFor="news-cover" className="cursor-pointer block">
                    <Upload size={28} className="mx-auto text-text-muted mb-1" />
                    <p className="text-sm font-medium text-primary">{imageFile ? imageFile.name : "Click to upload cover photo"}</p>
                    <p className="text-xs text-text-muted mt-0.5">JPG, PNG, WEBP (max 5MB)</p>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-border bg-surface shrink-0">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-primary hover:bg-primary-light disabled:opacity-60 text-white font-bold py-3 rounded-md transition-colors">
                {saving ? "Saving…" : editingId ? "Save Changes" : "Create & Add Content →"}
              </button>
              {editingId && (
                <button onClick={() => handleDelete(editingId)}
                  className="px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md transition-colors">
                  Delete
                </button>
              )}
              <button onClick={closeModal} className="px-5 py-3 border border-border text-text-muted hover:text-primary hover:border-primary font-semibold rounded-md transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaNews;
