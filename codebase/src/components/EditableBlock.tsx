import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Check, Pencil, X } from "lucide-react";
import { usePageEditor } from "../lib/pageEditor";

interface Props {
  blockKey: string;
  defaultValue: string;
  contentType?: "text" | "url" | "image_url";
  multiline?: boolean;
  children: (value: string) => React.ReactNode;
  /** Classes applied to the clickable wrapper div in edit mode */
  wrapperClassName?: string;
}

const EditableBlock: React.FC<Props> = ({
  blockKey, defaultValue, contentType = "text",
  multiline = false, children, wrapperClassName = "",
}) => {
  const { isAdmin, isEditMode, getContent, updateDraft } = usePageEditor();
  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const value = getContent(blockKey, defaultValue);

  /* Non-edit mode: zero wrapper overhead */
  if (!isAdmin || !isEditMode) return <>{children(value)}</>;

  const openEditor = () => {
    if (isEditing) return;
    setEditValue(value);
    setIsEditing(true);
  };

  const cancel = () => setIsEditing(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateDraft(blockKey, contentType, editValue);
      setIsEditing(false);
    } catch {
      alert("Failed to save draft. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") cancel();
    if (e.key === "Enter" && !multiline && !e.shiftKey) { e.preventDefault(); save(); }
  };

  /* ── Editor modal rendered via portal into document.body ──────────
     This completely bypasses any parent transform / overflow / stacking
     context issues (e.g. TiltCard's preserve-3d, overflow-hidden sections). */
  const modal = isEditing && createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={cancel}
      />
      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border-2 border-amber-400 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Editing block</p>
            <p className="text-sm font-semibold text-amber-900 mt-0.5">{blockKey}</p>
          </div>
          <button onClick={cancel} className="text-amber-600 hover:text-amber-900 p-1 rounded transition-colors">
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="p-5">
          <textarea
            autoFocus
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleKey}
            rows={multiline ? 6 : 3}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
            placeholder="Enter content…"
          />
          <p className="text-[11px] text-gray-400 mt-1.5">
            {multiline ? "Shift+Enter for new line  ·  Esc to cancel" : "Enter to save  ·  Esc to cancel"}
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 bg-amber-400 hover:bg-amber-500 disabled:opacity-60
                         text-primary font-bold py-2.5 rounded-lg text-sm
                         flex items-center justify-center gap-2 transition-colors"
            >
              <Check size={15} />{saving ? "Saving…" : "Save as Draft"}
            </button>
            <button
              onClick={cancel}
              className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg
                         text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      {/* Clickable content wrapper */}
      <div
        className={`relative cursor-pointer transition-all duration-150 ${wrapperClassName}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={openEditor}
        title="Click to edit"
      >
        {/* Amber ring — always at low opacity so admins know it's editable; full on hover */}
        <div
          className="absolute inset-0 rounded pointer-events-none z-10 ring-2 ring-amber-400 transition-opacity duration-150"
          style={{ opacity: hovered ? 0.9 : 0.25 }}
        />

        {/* "Edit" badge — appears on hover */}
        {hovered && (
          <div className="absolute -top-px -right-px z-20 bg-amber-400 text-primary
                          text-[10px] font-bold px-2 py-0.5 rounded-bl-md rounded-tr-sm
                          flex items-center gap-1 shadow-sm pointer-events-none">
            <Pencil size={9} /> Edit
          </div>
        )}

        {children(value)}
      </div>

      {/* Portal-rendered editor modal */}
      {modal}
    </>
  );
};

export default EditableBlock;
