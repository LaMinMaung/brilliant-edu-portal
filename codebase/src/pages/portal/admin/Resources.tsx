import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload, Edit2, Trash2, Search, X, BookOpen, Download, Check, ExternalLink,
} from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

/* ── Helpers ──────────────────────────────────────────────────── */
const formatSize = (bytes: number): string => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const toSlug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

type TypeInfo = [label: string, cls: string];
const TYPE_MAP: Record<string, TypeInfo> = {
  "application/pdf": ["PDF", "text-red-700 bg-red-50 border-red-200"],
  "application/msword": ["DOC", "text-blue-700 bg-blue-50 border-blue-200"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["DOCX", "text-blue-700 bg-blue-50 border-blue-200"],
  "application/vnd.ms-excel": ["XLS", "text-green-700 bg-green-50 border-green-200"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["XLSX", "text-green-700 bg-green-50 border-green-200"],
  "application/vnd.ms-powerpoint": ["PPT", "text-orange-700 bg-orange-50 border-orange-200"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["PPTX", "text-orange-700 bg-orange-50 border-orange-200"],
  "application/zip": ["ZIP", "text-yellow-700 bg-yellow-50 border-yellow-200"],
  "application/x-zip-compressed": ["ZIP", "text-yellow-700 bg-yellow-50 border-yellow-200"],
  "text/plain": ["TXT", "text-gray-700 bg-gray-50 border-gray-200"],
};
const getTypeInfo = (mime: string, name: string): TypeInfo => {
  if (TYPE_MAP[mime]) return TYPE_MAP[mime];
  if (mime.startsWith("image/")) return ["IMG", "text-purple-700 bg-purple-50 border-purple-200"];
  if (mime.startsWith("video/")) return ["VID", "text-indigo-700 bg-indigo-50 border-indigo-200"];
  if (mime.startsWith("audio/")) return ["AUD", "text-pink-700 bg-pink-50 border-pink-200"];
  return [name.split(".").pop()?.toUpperCase().slice(0, 5) || "FILE", "text-gray-700 bg-gray-50 border-gray-200"];
};

const WEB_CATEGORIES = ["Services", "Programs", "Admissions", "About", "Media & News", "General", "Other"];

/* ── Types ────────────────────────────────────────────────────── */
type Dest   = "student_portal" | "website" | "both";
type Status = "draft" | "published";

interface Resource {
  id: string; title: string; description: string;
  file: string; file_name: string; file_type: string; file_size: number;
  destination: string; status: string; category: string; slug: string;
  created: string; collectionId: string;
  expand?: { uploaded_by?: { name: string } };
}

interface ResourceForm {
  title: string; description: string;
  destination: Dest; status: Status; category: string; slug: string;
}
const emptyForm: ResourceForm = {
  title: "", description: "", destination: "student_portal", status: "published", category: "", slug: "",
};

/* ── Destination badge ─────────────────────────────────────────── */
const DestBadge: React.FC<{ dest: string }> = ({ dest }) => {
  if (dest === "website") return <span className="text-[10px] border border-blue-200 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">Website</span>;
  if (dest === "both")    return <span className="text-[10px] border border-purple-200 bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">Both</span>;
  return <span className="text-[10px] border border-green-200 bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">Portal</span>;
};

/* ── Component ────────────────────────────────────────────────── */
const AdminResources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [destFilter, setDestFilter] = useState<"all" | "student_portal" | "website">("all");

  // Modal
  const [showModal, setShowModal]           = useState(false);
  const [editing, setEditing]               = useState<Resource | null>(null);
  const [form, setForm]                     = useState<ResourceForm>({ ...emptyForm });
  const [selectedFile, setSelectedFile]     = useState<File | null>(null);
  const [isDragOver, setIsDragOver]         = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState("");
  const [done, setDone]                     = useState(false);
  const [slugAutoSync, setSlugAutoSync]     = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pb.collection("resources").getFullList<Resource>({
        sort: "-created", expand: "uploaded_by", requestKey: null,
      });
      setResources(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Modal helpers ── */
  const openCreate = () => {
    setEditing(null); setForm({ ...emptyForm }); setSelectedFile(null);
    setUploadProgress(null); setError(""); setDone(false);
    setSlugAutoSync(true); setShowModal(true);
  };
  const openEdit = (r: Resource) => {
    setEditing(r);
    setForm({
      title: r.title, description: r.description || "",
      destination: (r.destination || "student_portal") as Dest,
      status: (r.status || "published") as Status,
      category: r.category || "", slug: r.slug || "",
    });
    setSelectedFile(null); setUploadProgress(null);
    setError(""); setDone(false);
    setSlugAutoSync(false); setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false); setEditing(null); setSelectedFile(null);
    setUploadProgress(null); setError(""); setSaving(false); setDone(false);
  };

  /* ── File select ── */
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!form.title.trim()) {
      const name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
      setForm(f => ({ ...f, title: name, slug: toSlug(name) }));
    }
  };

  /* ── Title change — optionally auto-sync slug ── */
  const handleTitleChange = (v: string) => {
    if (slugAutoSync && (form.destination === "website" || form.destination === "both")) {
      setForm(f => ({ ...f, title: v, slug: toSlug(v) }));
    } else {
      setForm(f => ({ ...f, title: v }));
    }
  };

  /* ── Destination change ── */
  const handleDestChange = (dest: Dest) => {
    setForm(f => {
      const slug = dest !== "student_portal" && slugAutoSync ? toSlug(f.title) : f.slug;
      return { ...f, destination: dest, slug };
    });
  };

  /* ── XHR upload with real progress ── */
  const uploadXHR = (fd: globalThis.FormData): Promise<void> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else {
          try { reject(new Error(JSON.parse(xhr.responseText)?.message || "Upload failed")); }
          catch { reject(new Error(`Upload failed (${xhr.status})`)); }
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.open("POST", `${import.meta.env.VITE_POCKETBASE_URL}/api/collections/resources/records`);
      xhr.setRequestHeader("Authorization", pb.authStore.token);
      xhr.send(fd);
    });

  /* ── Save ── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!editing && !selectedFile) { setError("Please select a file to upload."); return; }
    const isWeb = form.destination === "website" || form.destination === "both";
    if (isWeb && !form.slug.trim()) { setError("A URL slug is required for website resources."); return; }

    setSaving(true);
    try {
      const appendCommon = (fd: globalThis.FormData) => {
        fd.append("title",       form.title.trim());
        fd.append("description", form.description.trim());
        fd.append("destination", form.destination);
        fd.append("status",      form.status);
        fd.append("category",    form.category.trim());
        fd.append("slug",        form.slug.trim());
      };

      if (editing) {
        const fd = new globalThis.FormData();
        appendCommon(fd);
        if (selectedFile) {
          fd.append("file",      selectedFile);
          fd.append("file_name", selectedFile.name);
          fd.append("file_type", selectedFile.type);
          fd.append("file_size", String(selectedFile.size));
          setUploadProgress(0);
        }
        await pb.collection("resources").update(editing.id, fd);
        if (selectedFile) setUploadProgress(100);
      } else {
        const fd = new globalThis.FormData();
        appendCommon(fd);
        fd.append("file",      selectedFile!);
        fd.append("file_name", selectedFile!.name);
        fd.append("file_type", selectedFile!.type);
        fd.append("file_size", String(selectedFile!.size));
        const uid = pb.authStore.record?.id;
        if (uid) fd.append("uploaded_by", uid);
        setUploadProgress(0);
        await uploadXHR(fd);
        setUploadProgress(100);
      }
      setDone(true);
      await fetchData();
      setTimeout(closeModal, 600);
    } catch (err: any) {
      setError(err.message || "Failed to save resource.");
      setUploadProgress(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r: Resource) => {
    if (!confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
    try {
      await pb.collection("resources").delete(r.id);
      setResources(p => p.filter(i => i.id !== r.id));
    } catch (err: any) { alert(err.message || "Failed to delete."); }
  };

  /* ── Filtered list ── */
  const filtered = resources
    .filter(r => {
      if (destFilter === "student_portal") return !r.destination || r.destination === "student_portal" || r.destination === "both";
      if (destFilter === "website")        return r.destination === "website" || r.destination === "both";
      return true;
    })
    .filter(r =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.file_name  || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.description|| "").toLowerCase().includes(search.toLowerCase())
    );

  const totalSize  = resources.reduce((a, r) => a + (r.file_size || 0), 0);
  const webCount   = resources.filter(r => r.destination === "website" || r.destination === "both").length;
  const portalCount= resources.filter(r => !r.destination || r.destination === "student_portal" || r.destination === "both").length;
  const isWebDest  = form.destination === "website" || form.destination === "both";

  return (
    <PortalLayout role="admin">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-1">Resource Management</h2>
            <p className="text-text-muted text-sm">
              Upload resources for the Student Portal and publish PDFs as public pages on the Information Website.
            </p>
          </div>
          <button onClick={openCreate}
            className="shrink-0 bg-accent hover:bg-accent-light text-primary font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2 transition-colors">
            <Upload size={17} /> Upload Resource
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Resources",       value: String(resources.length), c: "text-primary" },
            { label: "Student Portal",         value: String(portalCount),      c: "text-green-700" },
            { label: "Information Website",    value: String(webCount),         c: "text-blue-700" },
            { label: "Library Size",           value: formatSize(totalSize),    c: "text-secondary" },
          ].map(s => (
            <div key={s.label} className="border border-border rounded-lg p-4 bg-surface">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.c}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-1 bg-surface border border-border rounded-md p-1 shrink-0">
            {([ ["all","All"], ["student_portal","Student Portal"], ["website","Website"] ] as const).map(([k, lbl]) => (
              <button key={k} onClick={() => setDestFilter(k)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${destFilter === k ? "bg-primary text-white" : "text-text-muted hover:text-primary"}`}>
                {lbl}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, filename, or description…"
              className="w-full pl-10 pr-10 py-2.5 border border-border rounded-md text-sm bg-bg focus:outline-none focus:border-accent transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-muted">Loading resources…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-border rounded-xl bg-surface">
            <BookOpen size={52} className="mx-auto text-text-muted/25 mb-4" />
            <p className="text-primary font-semibold text-lg mb-1">{search ? "No results found" : "No resources yet"}</p>
            <p className="text-sm text-text-muted mb-6">{search ? "Try a different search term." : "Upload your first resource to get started."}</p>
            {!search && (
              <button onClick={openCreate}
                className="bg-primary text-white font-semibold px-6 py-2.5 rounded-md hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
                <Upload size={15} /> Upload First Resource
              </button>
            )}
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg text-left">
                    <th className="px-5 py-3.5 font-semibold text-primary text-xs uppercase tracking-wide">Resource</th>
                    <th className="px-4 py-3.5 font-semibold text-primary text-xs uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3.5 font-semibold text-primary text-xs uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3.5 font-semibold text-primary text-xs uppercase tracking-wide">Size</th>
                    <th className="px-4 py-3.5 font-semibold text-primary text-xs uppercase tracking-wide">Uploaded</th>
                    <th className="px-4 py-3.5 font-semibold text-primary text-xs uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const [label, cls] = getTypeInfo(r.file_type || "", r.file_name || "");
                    const isWeb  = r.destination === "website" || r.destination === "both";
                    const isPub  = r.status === "published";
                    const dest   = r.destination || "student_portal";
                    return (
                      <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-bg/60 transition-colors">
                        <td className="px-5 py-4 max-w-sm">
                          <div className="flex items-start gap-2 flex-wrap">
                            <p className="font-semibold text-primary leading-tight">{r.title}</p>
                            <DestBadge dest={dest} />
                          </div>
                          {r.category && <p className="text-xs text-secondary mt-0.5">{r.category}</p>}
                          {r.file_name && <p className="text-xs text-text-muted mt-0.5 truncate">{r.file_name}</p>}
                          {isWeb && r.slug && (
                            <p className="text-xs text-text-muted mt-0.5 font-mono opacity-70">/resources/{r.slug}</p>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-block border text-xs font-bold px-2 py-0.5 rounded ${cls}`}>{label}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {isWeb ? (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${isPub ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
                              {isPub ? "Published" : "Draft"}
                            </span>
                          ) : (
                            <span className="text-xs text-text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-text-muted text-xs whitespace-nowrap">{formatSize(r.file_size)}</td>
                        <td className="px-4 py-4 text-text-muted text-xs whitespace-nowrap">{formatDate(r.created)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <a href={pb.files.getURL(r, r.file)} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 text-text-muted hover:text-primary hover:bg-bg rounded-md transition-colors" title="Open file">
                              <Download size={13} />
                            </a>
                            {isWeb && r.slug && (
                              <a href={`/resources/${r.slug}`} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors" title="View public page">
                                <ExternalLink size={13} />
                              </a>
                            )}
                            <button onClick={() => openEdit(r)}
                              className="p-1.5 text-secondary hover:text-primary hover:bg-bg rounded-md transition-colors" title="Edit">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => handleDelete(r)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg max-h-[92vh] bg-bg rounded-xl border border-border overflow-hidden flex flex-col shadow-2xl">

            <div className="px-6 py-4 border-b border-border bg-surface shrink-0 flex items-center justify-between">
              <h3 className="font-heading font-bold text-xl text-primary">
                {editing ? "Edit Resource" : "Upload Resource"}
              </h3>
              <button onClick={closeModal} className="text-text-muted hover:text-primary p-1 rounded transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">

              {/* File drop zone */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  File {!editing && <span className="text-red-500">*</span>}
                  {editing && <span className="text-text-muted font-normal text-xs"> — leave empty to keep existing</span>}
                </label>
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={e => {
                    e.preventDefault(); setIsDragOver(false);
                    const f = e.dataTransfer.files?.[0]; if (f) handleFileSelect(f);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 select-none ${
                    isDragOver ? "border-accent bg-accent/5 scale-[1.01]"
                    : selectedFile ? "border-green-400 bg-green-50"
                    : "border-border hover:border-accent/60 hover:bg-accent/5"
                  }`}
                >
                  <input ref={fileInputRef} type="file" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                  {selectedFile ? (
                    <div>
                      <p className="font-semibold text-green-700 text-sm break-all">{selectedFile.name}</p>
                      <p className="text-xs text-green-600 mt-1">{formatSize(selectedFile.size)}</p>
                      <button type="button" onClick={ev => { ev.stopPropagation(); setSelectedFile(null); }}
                        className="mt-2 text-xs text-red-500 hover:text-red-700 underline">Remove</button>
                    </div>
                  ) : (
                    <div>
                      <Upload size={28} className={`mx-auto mb-2 ${isDragOver ? "text-accent" : "text-text-muted/40"}`} />
                      <p className="text-sm font-medium text-primary">{isDragOver ? "Drop file here" : "Drop file here or click to browse"}</p>
                      <p className="text-xs text-text-muted mt-1">PDF, DOCX, PPTX, XLSX, ZIP, images and more · Max 50 MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress */}
              {uploadProgress !== null && (
                <div>
                  <div className="flex justify-between text-xs text-text-muted mb-1.5">
                    <span>{done ? "Upload complete" : "Uploading…"}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${done ? "bg-green-500" : "bg-accent"}`}
                      style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* ── Destination ── */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Destination <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ["student_portal", "Student Portal",       "Visible only in the student portal"],
                    ["website",        "Information Website",  "PDF as a public webpage"],
                    ["both",           "Both",                 "Portal + public website"],
                  ] as const).map(([val, lbl, hint]) => (
                    <button key={val} type="button" onClick={() => handleDestChange(val)}
                      className={`p-3 rounded-lg border-2 text-left transition-all duration-150 ${form.destination === val ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"}`}
                    >
                      <p className={`text-xs font-semibold leading-tight ${form.destination === val ? "text-primary" : "text-text-muted"}`}>{lbl}</p>
                      <p className="text-[10px] text-text-muted mt-1 leading-tight">{hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Title <span className="text-red-500">*</span></label>
                <input type="text" value={form.title} required
                  onChange={e => handleTitleChange(e.target.value)}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg text-text focus:outline-none focus:border-accent transition-colors"
                  placeholder="e.g., Academic Calendar 2025"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Description <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <textarea value={form.description} rows={2}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg text-text focus:outline-none focus:border-accent transition-colors resize-none"
                  placeholder="Brief description of this resource"
                />
              </div>

              {/* ── Website-only fields ── */}
              {isWebDest && (
                <div className="space-y-4 border border-blue-100 bg-blue-50/40 rounded-lg p-4">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-widest">Information Website Settings</p>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-bg text-text focus:outline-none focus:border-accent transition-colors"
                    >
                      <option value="">— Select category —</option>
                      {WEB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">
                      URL Slug <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-border rounded-md overflow-hidden focus-within:border-accent transition-colors">
                      <span className="px-3 py-2.5 bg-bg border-r border-border text-xs text-text-muted flex items-center whitespace-nowrap">/resources/</span>
                      <input type="text" value={form.slug}
                        onChange={e => {
                          setSlugAutoSync(false);
                          setForm(f => ({
                            ...f,
                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"),
                          }));
                        }}
                        className="flex-1 px-3 py-2.5 text-sm bg-bg text-text focus:outline-none"
                        placeholder="academic-calendar-2025"
                      />
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      Must be unique across all website resources · Auto-generated from title
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Publication Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        ["draft",     "Draft",     "Not visible on the website yet"],
                        ["published", "Published", "Live and publicly accessible"],
                      ] as const).map(([val, lbl, hint]) => (
                        <button key={val} type="button" onClick={() => setForm(f => ({ ...f, status: val }))}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${form.status === val
                            ? val === "published" ? "border-green-400 bg-green-50" : "border-yellow-400 bg-yellow-50"
                            : "border-border bg-bg hover:border-accent/40"
                          }`}
                        >
                          <p className={`text-xs font-semibold ${form.status === val
                            ? val === "published" ? "text-green-700" : "text-yellow-700"
                            : "text-text-muted"}`}>{lbl}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{hint}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2.5">{error}</p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-border">
                <button type="submit" disabled={saving || done}
                  className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-md transition-colors flex items-center justify-center gap-2">
                  {done    ? <><Check size={15} /> Saved!</>
                  : saving ? <><span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Saving…</>
                  :          <><Upload size={15} />{editing ? "Save Changes" : "Upload Resource"}</>}
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

export default AdminResources;
