import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, Edit2, X, Upload, ChevronUp, ChevronDown,
  Trash2, ImagePlus, AlignLeft, Plus, Check,
} from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import FloatingShapes from "../components/FloatingShapes";
import pb from "../lib/pocketbase";

/* ─── types ─────────────────────────────────────────────────────── */
interface Block { id: string; type: "image" | "text"; image?: string; text_content?: string; sort_order: number; }

/* ─── helpers ────────────────────────────────────────────────────── */
const CATEGORIES = ["Partnership","Programs","Achievements","Events","Student Success","Announcements"];

function imgURL(block: Block) {
  return block.image ? pb.files.getURL({ id: block.id, collectionId: "news_blocks", collectionName: "news_blocks" } as any, block.image) : "";
}

/* ─── component ──────────────────────────────────────────────────── */
const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [article, setArticle]   = useState<any>(null);
  const [blocks, setBlocks]     = useState<Block[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  // Article edit modal
  const [editingArticle, setEditingArticle] = useState(false);
  const [artForm, setArtForm]   = useState({ title:"", date:"", category:"", description:"", fullContent:"" });
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Block inline editing
  const [editBlockId, setEditBlockId]   = useState<string | null>(null);
  const [editText, setEditText]         = useState("");
  const [editImgFile, setEditImgFile]   = useState<File | null>(null);
  const [editImgPreview, setEditImgPreview] = useState<string | null>(null);

  // Adding new block
  const [addMode, setAddMode]           = useState<"image" | "text" | null>(null);
  const [newText, setNewText]           = useState("");
  const [newImgFile, setNewImgFile]     = useState<File | null>(null);
  const [newImgPreview, setNewImgPreview] = useState<string | null>(null);

  const isAdmin = pb.authStore.isValid && pb.authStore.record?.role === "admin";

  /* ── fetch ─────────────────────────────────────────────────────── */
  const fetchArticle = async () => {
    try {
      const data = await pb.collection("news").getOne(id!, { requestKey: null });
      setArticle(data);
      setArtForm({ title: data.title, date: data.date?.split(" ")[0] ?? "", category: data.category, description: data.description, fullContent: data.fullContent ?? "" });
    } catch { /* 404 handled below */ }
  };

  const fetchBlocks = async () => {
    try {
      const raw = await pb.collection("news_blocks").getFullList({
        filter: `news_id = "${id}"`, sort: "sort_order,created", requestKey: null,
      });
      // Normalise sort_order to 0-based indices in memory
      setBlocks(raw.map((b, i) => ({ ...b, sort_order: i }) as Block));
    } catch { setBlocks([]); }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([fetchArticle(), fetchBlocks()]);
      setLoading(false);
    })();
  }, [id]);

  // Cleanup object URLs
  const cleanPreview = (url: string | null) => { if (url) URL.revokeObjectURL(url); };

  /* ── article save ───────────────────────────────────────────────── */
  const handleArticleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title",       artForm.title);
      fd.append("date",        artForm.date);
      fd.append("category",    artForm.category);
      fd.append("description", artForm.description);
      fd.append("fullContent", artForm.fullContent);
      if (coverFile) fd.append("image", coverFile);
      const updated = await pb.collection("news").update(id!, fd);
      setArticle(updated);
      setEditingArticle(false);
      setCoverFile(null);
    } catch (err: any) { alert(err?.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  /* ── block reorder ──────────────────────────────────────────────── */
  const moveBlock = async (blockId: string, dir: "up" | "down") => {
    const idx = blocks.findIndex(b => b.id === blockId);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= blocks.length) return;
    setSaving(true);
    try {
      const a = blocks[idx], b2 = blocks[swapIdx];
      await Promise.all([
        pb.collection("news_blocks").update(a.id, { sort_order: swapIdx }),
        pb.collection("news_blocks").update(b2.id, { sort_order: idx }),
      ]);
      const next = [...blocks];
      next[idx]     = { ...b2, sort_order: idx };
      next[swapIdx] = { ...a,  sort_order: swapIdx };
      setBlocks(next);
    } finally { setSaving(false); }
  };

  /* ── block delete ───────────────────────────────────────────────── */
  const deleteBlock = async (blockId: string) => {
    if (!confirm("Delete this block? This cannot be undone.")) return;
    setSaving(true);
    try {
      await pb.collection("news_blocks").delete(blockId);
      const remaining = blocks.filter(b => b.id !== blockId).map((b, i) => ({ ...b, sort_order: i }));
      setBlocks(remaining);
      await Promise.all(remaining.map((b, i) => pb.collection("news_blocks").update(b.id, { sort_order: i })));
    } finally { setSaving(false); }
  };

  /* ── block edit ─────────────────────────────────────────────────── */
  const startEditBlock = (block: Block) => {
    setEditBlockId(block.id);
    if (block.type === "text") { setEditText(block.text_content ?? ""); }
    if (block.type === "image") { setEditImgFile(null); setEditImgPreview(null); }
  };
  const cancelEdit = () => { setEditBlockId(null); cleanPreview(editImgPreview); setEditImgPreview(null); setEditImgFile(null); setEditText(""); };

  const saveBlockEdit = async () => {
    if (!editBlockId) return;
    const block = blocks.find(b => b.id === editBlockId);
    if (!block) return;
    setSaving(true);
    try {
      let updated: any;
      if (block.type === "text") {
        updated = await pb.collection("news_blocks").update(editBlockId, { text_content: editText });
      } else if (block.type === "image" && editImgFile) {
        const fd = new FormData(); fd.append("image", editImgFile);
        updated = await pb.collection("news_blocks").update(editBlockId, fd);
      }
      if (updated) setBlocks(prev => prev.map(b => b.id === editBlockId ? { ...updated, sort_order: b.sort_order } : b));
      cancelEdit();
    } catch (err: any) { alert(err?.message || "Failed to update block."); }
    finally { setSaving(false); }
  };

  /* ── add block ──────────────────────────────────────────────────── */
  const commitAddImage = async () => {
    if (!newImgFile) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("news_id",    id!);
      fd.append("type",       "image");
      fd.append("sort_order", String(blocks.length));
      fd.append("image",      newImgFile);
      const created = await pb.collection("news_blocks").create(fd);
      setBlocks(prev => [...prev, { ...created, sort_order: prev.length } as Block]);
      setAddMode(null); setNewImgFile(null); cleanPreview(newImgPreview); setNewImgPreview(null);
    } catch (err: any) { alert(err?.message || "Failed to add image block."); }
    finally { setSaving(false); }
  };

  const commitAddText = async () => {
    if (!newText.trim()) return;
    setSaving(true);
    try {
      const created = await pb.collection("news_blocks").create({ news_id: id, type: "text", text_content: newText, sort_order: blocks.length });
      setBlocks(prev => [...prev, { ...created, sort_order: prev.length } as Block]);
      setAddMode(null); setNewText("");
    } catch (err: any) { alert(err?.message || "Failed to add text block."); }
    finally { setSaving(false); }
  };

  const cancelAdd = () => { setAddMode(null); setNewText(""); setNewImgFile(null); cleanPreview(newImgPreview); setNewImgPreview(null); };

  /* ── article delete ─────────────────────────────────────────────── */
  const handleDeleteArticle = async () => {
    if (!confirm("Delete this article and ALL its content blocks? This cannot be undone.")) return;
    try {
      await pb.collection("news").delete(id!);
      navigate("/media-news");
    } catch (err: any) { alert(err?.message || "Failed to delete."); }
  };

  /* ── render ─────────────────────────────────────────────────────── */
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-bg"><p className="text-text-muted">Loading…</p></div>;
  if (!article) return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="text-center">
        <h1 className="font-heading font-bold text-3xl text-primary mb-4">Article Not Found</h1>
        <p className="text-text-muted mb-8">The article you're looking for doesn't exist.</p>
        <Link to="/media-news" className="inline-block bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 rounded-md transition-colors">Back to News</Link>
      </div>
    </div>
  );

  const hasBlocks = blocks.length > 0;
  const coverURL  = article.image ? pb.files.getURL(article, article.image) : null;

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="bg-surface border-b border-border relative overflow-hidden">
        <FloatingShapes variant="hero" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <ScrollReveal>
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mb-6">
              <ArrowLeft size={16} />Back to News
            </button>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <span className="inline-block px-3 py-1 bg-primary/90 text-white text-xs font-semibold rounded-full mb-4">{article.category}</span>
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <h1 className="font-heading font-bold text-4xl lg:text-5xl text-primary">{article.title}</h1>
          </ScrollReveal>
          <ScrollReveal delay={200}><div className="w-20 h-1 bg-accent mt-4 rounded-full" /></ScrollReveal>
          <ScrollReveal delay={250}>
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <Calendar size={16} className="text-secondary" />
                {new Date(article.date).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}
              </div>
              {isAdmin && (
                <button onClick={() => setEditingArticle(true)} className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors font-semibold">
                  <Edit2 size={15} />Edit Article
                </button>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Content ──────────────────────────────────────────────── */}
      <section className="py-16 lg:py-24 relative">
        <FloatingShapes />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Cover photo */}
          {coverURL && (
            <ScrollReveal>
              <div className="mb-10 rounded-xl overflow-hidden border border-border shadow-sm">
                <img src={coverURL} alt={article.title} className="w-full h-auto" loading="eager" />
              </div>
            </ScrollReveal>
          )}

          {/* Description (sub-heading) */}
          {article.description && (
            <ScrollReveal>
              <p className="text-text-muted text-lg leading-relaxed mb-10 border-l-4 border-accent pl-5 italic">{article.description}</p>
            </ScrollReveal>
          )}

          {/* ── Admin block editor header ─────────────────────────── */}
          {isAdmin && (
            <div className="flex items-center justify-between mb-6 py-3 border-b border-border">
              <p className="text-xs font-bold tracking-widest uppercase text-text-muted">
                Content Blocks {blocks.length > 0 && `(${blocks.length})`}
              </p>
              <div className="flex gap-2">
                <button onClick={() => { cancelEdit(); setAddMode("image"); }} disabled={saving || addMode !== null}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-surface border border-border rounded-md hover:border-primary text-text-muted hover:text-primary transition-colors disabled:opacity-40">
                  <ImagePlus size={13} />Add Image
                </button>
                <button onClick={() => { cancelEdit(); setAddMode("text"); }} disabled={saving || addMode !== null}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-surface border border-border rounded-md hover:border-primary text-text-muted hover:text-primary transition-colors disabled:opacity-40">
                  <AlignLeft size={13} />Add Text
                </button>
              </div>
            </div>
          )}

          {/* ── Block list ───────────────────────────────────────── */}
          <div className="space-y-6">
            {blocks.map((block, idx) => {
              const isEditingThis = editBlockId === block.id;
              return (
                <div key={block.id} className={`relative group rounded-xl ${isAdmin ? "ring-1 ring-transparent hover:ring-border transition-all" : ""}`}>

                  {/* Admin controls */}
                  {isAdmin && !isEditingThis && (
                    <div className="absolute right-2 top-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button onClick={() => moveBlock(block.id, "up")} disabled={idx === 0 || saving} title="Move Up"
                        className="p-1.5 rounded bg-white/90 border border-border text-text-muted hover:text-primary hover:border-primary disabled:opacity-30 transition-colors">
                        <ChevronUp size={13} />
                      </button>
                      <button onClick={() => moveBlock(block.id, "down")} disabled={idx === blocks.length - 1 || saving} title="Move Down"
                        className="p-1.5 rounded bg-white/90 border border-border text-text-muted hover:text-primary hover:border-primary disabled:opacity-30 transition-colors">
                        <ChevronDown size={13} />
                      </button>
                      <button onClick={() => { cancelAdd(); startEditBlock(block); }} title="Edit"
                        className="p-1.5 rounded bg-white/90 border border-border text-secondary hover:text-primary hover:border-primary transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => deleteBlock(block.id)} disabled={saving} title="Delete block"
                        className="p-1.5 rounded bg-white/90 border border-border text-red-400 hover:text-red-600 hover:border-red-400 disabled:opacity-30 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}

                  {/* IMAGE block */}
                  {block.type === "image" && (
                    <>
                      {isEditingThis ? (
                        <div className="border-2 border-dashed border-accent rounded-xl p-6 bg-surface">
                          <p className="text-sm font-semibold text-primary mb-3">Replace Image</p>
                          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-accent transition-colors mb-4">
                            <input id={`edit-img-${block.id}`} type="file" accept="image/*" className="hidden"
                              onChange={e => { const f = e.target.files?.[0]; if (!f) return; cleanPreview(editImgPreview); setEditImgFile(f); setEditImgPreview(URL.createObjectURL(f)); }} />
                            <label htmlFor={`edit-img-${block.id}`} className="cursor-pointer block">
                              {editImgPreview
                                ? <img src={editImgPreview} className="max-h-48 mx-auto rounded-lg mb-2" alt="preview" />
                                : <><Upload size={28} className="mx-auto text-text-muted mb-1" /><p className="text-sm text-text-muted">Click to select new image</p></>
                              }
                            </label>
                          </div>
                          <p className="text-xs text-text-muted mb-3">Leave blank to keep current image.</p>
                          <div className="flex gap-2">
                            <button onClick={saveBlockEdit} disabled={saving || !editImgFile}
                              className="flex-1 bg-primary text-white text-sm font-semibold py-2 rounded-md disabled:opacity-40 transition-opacity">
                              {saving ? "Saving…" : "Replace"}
                            </button>
                            <button onClick={cancelEdit} className="px-4 py-2 text-sm border border-border rounded-md text-text-muted hover:text-primary transition-colors">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl overflow-hidden border border-border">
                          <img src={imgURL(block)} alt="" className="w-full h-auto" loading="lazy" />
                        </div>
                      )}
                    </>
                  )}

                  {/* TEXT block */}
                  {block.type === "text" && (
                    <>
                      {isEditingThis ? (
                        <div className="border-2 border-dashed border-accent rounded-xl p-6 bg-surface">
                          <p className="text-sm font-semibold text-primary mb-3">Edit Text Block</p>
                          <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={8}
                            className="w-full border border-border rounded-md px-4 py-3 text-sm bg-bg focus:outline-none focus:border-accent resize-y font-mono mb-3"
                            placeholder="Enter text or HTML…" />
                          <p className="text-xs text-text-muted mb-3">Supports HTML tags: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;</p>
                          <div className="flex gap-2">
                            <button onClick={saveBlockEdit} disabled={saving}
                              className="flex-1 bg-primary text-white text-sm font-semibold py-2 rounded-md disabled:opacity-40">
                              {saving ? "Saving…" : "Save Text"}
                            </button>
                            <button onClick={cancelEdit} className="px-4 py-2 text-sm border border-border rounded-md text-text-muted hover:text-primary transition-colors">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="prose prose-lg max-w-none text-text py-2" style={{ lineHeight: "1.8" }}
                          dangerouslySetInnerHTML={{ __html: block.text_content || "" }} />
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {/* Legacy fullContent — shown only if no blocks and fullContent exists */}
            {!hasBlocks && article.fullContent && (
              <div className="prose prose-lg max-w-none text-text" style={{ lineHeight: "1.8" }}
                dangerouslySetInnerHTML={{ __html: article.fullContent }} />
            )}

            {/* Empty state for admin */}
            {isAdmin && blocks.length === 0 && !addMode && (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <Plus size={32} className="mx-auto text-text-muted/40 mb-3" />
                <p className="text-text-muted text-sm mb-4">No content blocks yet. Add an image or text block to build the story.</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => setAddMode("image")}
                    className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light transition-colors">
                    <ImagePlus size={15} />Add Image
                  </button>
                  <button onClick={() => setAddMode("text")}
                    className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-surface border border-border text-text-muted hover:text-primary hover:border-primary rounded-md transition-colors">
                    <AlignLeft size={15} />Add Text
                  </button>
                </div>
              </div>
            )}

            {/* ── Add block panel ───────────────────────────────── */}
            {addMode === "image" && (
              <div className="border-2 border-dashed border-primary rounded-xl p-6 bg-surface animate-[fadeUp_0.2s_ease_forwards]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-primary flex items-center gap-2"><ImagePlus size={16} />New Image Block</p>
                  <button onClick={cancelAdd} className="text-text-muted hover:text-primary"><X size={18} /></button>
                </div>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent transition-colors mb-4 cursor-pointer">
                  <input id="new-img-upload" type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (!f) return; cleanPreview(newImgPreview); setNewImgFile(f); setNewImgPreview(URL.createObjectURL(f)); }} />
                  <label htmlFor="new-img-upload" className="cursor-pointer block">
                    {newImgPreview
                      ? <img src={newImgPreview} className="max-h-64 mx-auto rounded-lg mb-2" alt="preview" />
                      : <><Upload size={32} className="mx-auto text-text-muted mb-2" /><p className="text-sm font-medium text-primary">Click to select image</p><p className="text-xs text-text-muted mt-1">JPG, PNG, WEBP, GIF</p></>
                    }
                  </label>
                </div>
                <div className="flex gap-2">
                  <button onClick={commitAddImage} disabled={saving || !newImgFile}
                    className="flex-1 bg-primary hover:bg-primary-light text-white text-sm font-bold py-2.5 rounded-md disabled:opacity-40 transition-all">
                    {saving ? "Uploading…" : <span className="inline-flex items-center gap-2"><Check size={14} />Add Image Block</span>}
                  </button>
                  <button onClick={cancelAdd} className="px-4 py-2 text-sm border border-border rounded-md text-text-muted hover:text-primary transition-colors">Cancel</button>
                </div>
              </div>
            )}

            {addMode === "text" && (
              <div className="border-2 border-dashed border-primary rounded-xl p-6 bg-surface animate-[fadeUp_0.2s_ease_forwards]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-primary flex items-center gap-2"><AlignLeft size={16} />New Text Block</p>
                  <button onClick={cancelAdd} className="text-text-muted hover:text-primary"><X size={18} /></button>
                </div>
                <textarea value={newText} onChange={e => setNewText(e.target.value)} rows={8} autoFocus
                  className="w-full border border-border rounded-md px-4 py-3 text-sm bg-bg focus:outline-none focus:border-accent resize-y font-mono mb-2"
                  placeholder="Enter your text or HTML here…&#10;&#10;Examples:&#10;<h2>Section Heading</h2>&#10;<p>Paragraph text here...</p>" />
                <p className="text-xs text-text-muted mb-3">Supports HTML: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;</p>
                <div className="flex gap-2">
                  <button onClick={commitAddText} disabled={saving || !newText.trim()}
                    className="flex-1 bg-primary hover:bg-primary-light text-white text-sm font-bold py-2.5 rounded-md disabled:opacity-40 transition-all">
                    {saving ? "Saving…" : <span className="inline-flex items-center gap-2"><Check size={14} />Add Text Block</span>}
                  </button>
                  <button onClick={cancelAdd} className="px-4 py-2 text-sm border border-border rounded-md text-text-muted hover:text-primary transition-colors">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Back link */}
          <div className="mt-14 pt-8 border-t border-border">
            <Link to="/media-news" className="inline-flex items-center gap-2 text-secondary hover:text-primary font-semibold transition-colors">
              <ArrowLeft size={16} />Back to All News
            </Link>
          </div>
        </div>
      </section>

      {/* ── Edit Article Modal ────────────────────────────────────── */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={() => setEditingArticle(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-bg rounded-lg border border-border overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0">
              <h3 className="font-heading font-bold text-xl text-primary">Edit Article</h3>
              <button onClick={() => setEditingArticle(false)} className="text-text-muted hover:text-primary"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Title *</label>
                <input value={artForm.title} onChange={e => setArtForm({...artForm, title: e.target.value})}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg focus:outline-none focus:border-accent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Date *</label>
                  <input type="date" value={artForm.date} onChange={e => setArtForm({...artForm, date: e.target.value})}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Category *</label>
                  <select value={artForm.category} onChange={e => setArtForm({...artForm, category: e.target.value})}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg focus:outline-none focus:border-accent">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Short Description</label>
                <textarea value={artForm.description} onChange={e => setArtForm({...artForm, description: e.target.value})} rows={3}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg focus:outline-none focus:border-accent resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Cover Photo</label>
                <div className="border-2 border-dashed border-border rounded-md p-5 text-center hover:border-accent transition-colors">
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="hidden" id="cover-upload" />
                  <label htmlFor="cover-upload" className="cursor-pointer block">
                    <Upload size={28} className="mx-auto text-text-muted mb-1" />
                    <p className="text-sm font-medium text-primary">{coverFile ? coverFile.name : article.image ? "Replace cover photo" : "Upload cover photo"}</p>
                    <p className="text-xs text-text-muted mt-0.5">JPG, PNG, WEBP</p>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Article Body <span className="text-text-muted font-normal">(shown when no content blocks exist)</span>
                </label>
                <textarea value={artForm.fullContent} onChange={e => setArtForm({...artForm, fullContent: e.target.value})} rows={6}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg focus:outline-none focus:border-accent resize-none font-mono"
                  placeholder="HTML content (optional — use content blocks above for rich photo+text stories)" />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-border bg-surface shrink-0">
              <button onClick={handleArticleSave} disabled={saving}
                className="flex-1 bg-primary hover:bg-primary-light disabled:opacity-60 text-white font-bold py-3 rounded-md transition-colors">
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={handleDeleteArticle}
                className="px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md transition-colors">
                Delete
              </button>
              <button onClick={() => setEditingArticle(false)}
                className="px-5 py-3 border border-border text-text-muted hover:text-primary hover:border-primary font-semibold rounded-md transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsDetail;
