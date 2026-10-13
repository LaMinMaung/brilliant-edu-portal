import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import pb from "./pocketbase";

/* ── Types ──────────────────────────────────────────────────────── */
export interface ContentRecord {
  id?: string;
  page: string;
  block_key: string;
  content_type: string;
  draft_value: string;
  published_value: string;
}

interface PageEditorContextValue {
  isAdmin: boolean;
  isEditMode: boolean;
  toggleEditMode: () => void;
  getContent: (blockKey: string, defaultValue: string) => string;
  updateDraft: (blockKey: string, contentType: string, value: string) => Promise<void>;
  publishAll: () => Promise<void>;
  discardDrafts: () => Promise<void>;
  hasDrafts: boolean;
  saving: boolean;
  currentPage: string;
}

/* ── Context ─────────────────────────────────────────────────────── */
const PageEditorContext = createContext<PageEditorContextValue>({
  isAdmin: false,
  isEditMode: false,
  toggleEditMode: () => {},
  getContent: (_, d) => d,
  updateDraft: async () => {},
  publishAll: async () => {},
  discardDrafts: async () => {},
  hasDrafts: false,
  saving: false,
  currentPage: "",
});

export const usePageEditor = () => useContext(PageEditorContext);

/* ── Helpers ─────────────────────────────────────────────────────── */
const PUBLIC_PAGES = ["admissions", "about", "programs", "services", "media-news", "contact"];

function getPageSlug(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "home";
  return PUBLIC_PAGES.includes(parts[0]) ? parts[0] : "";
}

/* ── Provider ────────────────────────────────────────────────────── */
export const PageEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdmin = pb.authStore.record?.role === "admin";
  const [isEditMode, setIsEditMode] = useState(false);
  const [contentMap, setContentMap] = useState<Map<string, ContentRecord>>(new Map());
  const [saving, setSaving] = useState(false);

  const currentPage = getPageSlug(location.pathname);

  /* Fetch CMS records for the current page whenever it changes */
  useEffect(() => {
    setIsEditMode(false);
    if (!currentPage) { setContentMap(new Map()); return; }
    pb.collection("page_content")
      .getFullList({ filter: `page = "${currentPage}"`, requestKey: null })
      .then((records: any[]) => {
        const map = new Map<string, ContentRecord>();
        records.forEach(r => map.set(r.block_key, r as ContentRecord));
        setContentMap(map);
      })
      .catch(() => setContentMap(new Map())); // silent — defaults will show
  }, [currentPage]);

  /* Add / remove bottom padding so content isn't hidden behind the bar */
  useEffect(() => {
    if (isAdmin && currentPage) {
      document.body.style.paddingBottom = "56px";
    } else {
      document.body.style.paddingBottom = "";
    }
    return () => { document.body.style.paddingBottom = ""; };
  }, [isAdmin, currentPage]);

  const toggleEditMode = useCallback(() => {
    if (!isAdmin) return;
    setIsEditMode(p => !p);
  }, [isAdmin]);

  const getContent = useCallback((blockKey: string, defaultValue: string): string => {
    const rec = contentMap.get(blockKey);
    if (!rec) return defaultValue;
    if (isAdmin && isEditMode) return rec.draft_value || rec.published_value || defaultValue;
    return rec.published_value || defaultValue;
  }, [contentMap, isAdmin, isEditMode]);

  const updateDraft = useCallback(async (blockKey: string, contentType: string, value: string) => {
    if (!isAdmin || !currentPage) return;
    const existing = contentMap.get(blockKey);
    let updated: ContentRecord;
    if (existing?.id) {
      const res = await pb.collection("page_content").update(existing.id, { draft_value: value });
      updated = { ...existing, draft_value: res.draft_value };
    } else {
      const res: any = await pb.collection("page_content").create({
        page: currentPage, block_key: blockKey,
        content_type: contentType || "text",
        draft_value: value, published_value: "",
      });
      updated = res as ContentRecord;
    }
    setContentMap(prev => new Map(prev).set(blockKey, updated));
  }, [isAdmin, currentPage, contentMap]);

  const publishAll = useCallback(async () => {
    if (!isAdmin || !currentPage) return;
    setSaving(true);
    try {
      const toPublish = Array.from(contentMap.values()).filter(r => r.id && r.draft_value);
      await Promise.all(toPublish.map(r =>
        pb.collection("page_content").update(r.id!, { published_value: r.draft_value })
      ));
      // Refresh map from DB
      const records: any[] = await pb.collection("page_content")
        .getFullList({ filter: `page = "${currentPage}"`, requestKey: null });
      const map = new Map<string, ContentRecord>();
      records.forEach(r => map.set(r.block_key, r as ContentRecord));
      setContentMap(map);
      alert("Changes published! Visitors will now see the updated content.");
    } catch (err: any) {
      alert(err.message || "Failed to publish.");
    } finally {
      setSaving(false);
    }
  }, [isAdmin, currentPage, contentMap]);

  const discardDrafts = useCallback(async () => {
    if (!isAdmin || !currentPage) return;
    if (!confirm("Discard all draft changes on this page?")) return;
    setSaving(true);
    try {
      const toDiscard = Array.from(contentMap.values())
        .filter(r => r.id && r.draft_value !== r.published_value);
      await Promise.all(toDiscard.map(r =>
        pb.collection("page_content").update(r.id!, { draft_value: r.published_value })
      ));
      const records: any[] = await pb.collection("page_content")
        .getFullList({ filter: `page = "${currentPage}"`, requestKey: null });
      const map = new Map<string, ContentRecord>();
      records.forEach(r => map.set(r.block_key, r as ContentRecord));
      setContentMap(map);
    } catch (err: any) {
      alert(err.message || "Failed to discard drafts.");
    } finally {
      setSaving(false);
    }
  }, [isAdmin, currentPage, contentMap]);

  const hasDrafts = Array.from(contentMap.values()).some(
    r => r.draft_value && r.draft_value !== r.published_value
  );

  return (
    <PageEditorContext.Provider value={{
      isAdmin: !!isAdmin, isEditMode, toggleEditMode,
      getContent, updateDraft, publishAll, discardDrafts,
      hasDrafts, saving, currentPage,
    }}>
      {children}
    </PageEditorContext.Provider>
  );
};
