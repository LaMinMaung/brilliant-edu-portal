import React, { useEffect, useState } from "react";
import { Download, BookOpen, Search, X } from "lucide-react";
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
  "application/x-rar-compressed": ["RAR", "text-yellow-700 bg-yellow-50 border-yellow-200"],
  "text/plain": ["TXT", "text-gray-700 bg-gray-50 border-gray-200"],
};

const getTypeInfo = (mime: string, name: string): TypeInfo => {
  if (TYPE_MAP[mime]) return TYPE_MAP[mime];
  if (mime.startsWith("image/")) return ["IMG", "text-purple-700 bg-purple-50 border-purple-200"];
  if (mime.startsWith("video/")) return ["VID", "text-indigo-700 bg-indigo-50 border-indigo-200"];
  if (mime.startsWith("audio/")) return ["AUD", "text-pink-700 bg-pink-50 border-pink-200"];
  const ext = name.split(".").pop()?.toUpperCase() || "FILE";
  return [ext.slice(0, 6), "text-gray-700 bg-gray-50 border-gray-200"];
};

/* ── Component ────────────────────────────────────────────────── */
const StudentResources: React.FC = () => {
  const [resources, setResources]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    pb.collection("resources")
      .getFullList({
        // Exclude website-only resources; show student_portal, both, and legacy (empty destination)
        filter: `destination = "student_portal" || destination = "both" || destination = ""`,
        sort: "-created",
        requestKey: null,
      })
      .then(data => setResources(data))
      .catch(err => console.error("Failed to load resources:", err))
      .finally(() => setLoading(false));
  }, []);

  /* Download: fetch with auth token → blob → browser save */
  const handleDownload = async (resource: any) => {
    setDownloading(resource.id);
    try {
      const url = pb.files.getURL(resource, resource.file);
      const res = await fetch(url, {
        headers: pb.authStore.token ? { Authorization: pb.authStore.token } : {},
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = resource.file_name || resource.file || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(pb.files.getURL(resource, resource.file), "_blank");
    } finally {
      setDownloading(null);
    }
  };

  const filtered = resources.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.file_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PortalLayout role="student">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h2 className="font-heading font-bold text-2xl text-primary mb-1">Resources Library</h2>
          <p className="text-text-muted text-sm">
            Browse and download educational resources shared by the administration.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search resources…"
            className="w-full pl-10 pr-10 py-2.5 border border-border rounded-md text-sm bg-surface focus:outline-none focus:border-accent transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-muted">Loading resources…</p>
          </div>

        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-border rounded-xl bg-surface">
            <BookOpen size={52} className="mx-auto text-text-muted/25 mb-4" />
            <p className="text-primary font-semibold text-lg mb-1">
              {search ? "No resources found" : "No resources available."}
            </p>
            <p className="text-sm text-text-muted">
              {search ? "Try a different search term." : "Check back later — the administration will upload resources here."}
            </p>
          </div>

        ) : (
          <>
            {search && (
              <p className="text-xs text-text-muted mb-4">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
              </p>
            )}
            <div className="space-y-4">
              {filtered.map(r => {
                const [label, cls] = getTypeInfo(r.file_type || "", r.file_name || "");
                const isDownloading = downloading === r.id;
                return (
                  <div key={r.id}
                    className="border border-border rounded-xl p-5 bg-surface hover:border-accent/50 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-start gap-4">

                      {/* File type badge */}
                      <div className={`shrink-0 w-14 h-14 rounded-xl border-2 flex items-center justify-center font-bold text-sm ${cls}`}>
                        {label}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold text-primary text-base leading-snug">
                          {r.title}
                        </h3>
                        {r.description && (
                          <p className="text-text-muted text-sm mt-1 leading-relaxed line-clamp-2">
                            {r.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-xs text-text-muted">
                          <span className={`font-semibold border px-1.5 py-0.5 rounded text-[10px] ${cls}`}>
                            {label}
                          </span>
                          <span>{formatSize(r.file_size)}</span>
                          <span>Added {formatDate(r.created)}</span>
                        </div>
                      </div>

                      {/* Download button */}
                      <button
                        onClick={() => handleDownload(r)}
                        disabled={isDownloading}
                        className="shrink-0 inline-flex items-center gap-2 bg-primary hover:bg-primary-light disabled:opacity-70 text-white font-semibold text-sm px-4 py-2.5 rounded-md transition-all duration-200 hover:scale-105"
                      >
                        {isDownloading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="hidden sm:inline">Downloading…</span>
                          </>
                        ) : (
                          <>
                            <Download size={14} />
                            <span className="hidden sm:inline">Download</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
};

export default StudentResources;
