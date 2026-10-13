import React from "react";
import { Edit3, Eye, RotateCcw, Send } from "lucide-react";
import { usePageEditor } from "../lib/pageEditor";

const AdminEditBar: React.FC = () => {
  const {
    isAdmin, isEditMode, toggleEditMode,
    publishAll, discardDrafts,
    hasDrafts, saving, currentPage,
  } = usePageEditor();

  if (!isAdmin || !currentPage) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9998] bg-primary border-t-[3px] border-amber-400
                 text-white shadow-[0_-4px_24px_rgba(0,0,0,0.35)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3 sm:gap-4 flex-wrap">

        {/* Admin badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Admin</span>
          <span className="text-xs text-white/40 hidden sm:inline">· {currentPage}</span>
        </div>

        <div className="hidden sm:block h-4 w-px bg-white/15" />

        {/* Edit mode toggle */}
        <button
          onClick={toggleEditMode}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-semibold
                      transition-all duration-200 ${
                        isEditMode
                          ? "bg-amber-400 text-primary hover:bg-amber-500"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
        >
          {isEditMode
            ? <><Eye size={14} />Stop Editing</>
            : <><Edit3 size={14} />Edit Page</>}
        </button>

        {isEditMode && (
          <span className="text-xs text-amber-300/80 border border-amber-400/25 bg-amber-400/10
                           px-3 py-1.5 rounded-md hidden lg:inline-block">
            Click any text to edit it
          </span>
        )}

        <div className="flex-1" />

        {/* Draft / Publish actions */}
        {hasDrafts && (
          <>
            <span className="text-xs text-amber-300 font-medium hidden sm:inline">
              Unsaved draft changes
            </span>
            <button
              onClick={discardDrafts}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-white/60
                         hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Discard</span>
            </button>
            <button
              onClick={publishAll}
              disabled={saving}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white
                         font-bold px-5 py-1.5 rounded-md text-sm transition-colors
                         disabled:opacity-60 shadow-sm"
            >
              <Send size={13} />
              {saving ? "Publishing…" : "Publish Changes"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminEditBar;
