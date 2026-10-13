import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Edit2, UserSquare, Search, KeyRound, Archive,
  GraduationCap, History, ChevronLeft, ChevronRight, Award, X,
  BookOpen, CheckCircle, Download, Upload, FileSpreadsheet,
  AlertCircle, CheckCircle2, Loader2, Users,
} from "lucide-react";
import pb from "../../../lib/pocketbase";
import { logActivity } from "../../../lib/logActivity";
import PortalLayout from "../../../components/PortalLayout";

const PAGE_SIZE = 20;
const emptyForm = { name: "", email: "", password: "", passwordConfirm: "", studentId: "", dateOfBirth: "", assignedDegree: "", status: "active" };

const statusStyle: Record<string, string> = {
  active:    "bg-green-100 text-green-800 border-green-300",
  inactive:  "bg-gray-100 text-gray-700 border-gray-300",
  suspended: "bg-red-100 text-red-800 border-red-300",
  graduated: "bg-purple-100 text-purple-800 border-purple-300",
};
const enrollStatusStyle: Record<string, string> = {
  active:    "bg-blue-100 text-blue-800 border-blue-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-300",
  failed:    "bg-red-100 text-red-800 border-red-300",
  dropped:   "bg-gray-100 text-gray-600 border-gray-300",
};

/* ── Helpers ─────────────────────────────────────────────────── */
function findColIdx(headers: string[], variants: string[]): number {
  return headers.findIndex(h => variants.includes(h.toLowerCase().trim()));
}

function tryParseDate(raw: unknown): string {
  if (raw == null || raw === "") return "";
  const str = String(raw).trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Excel serial number
  if (/^\d+(\.\d+)?$/.test(str)) {
    const n = parseFloat(str);
    if (n > 1 && n < 200000) {
      // Excel epoch: Jan 0 1900
      const d = new Date((n - 25569) * 86400 * 1000);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
  }
  // Try generic parse
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return "";
}

/* ── Types ────────────────────────────────────────────────────── */
interface ParsedRow {
  name: string;
  email: string;
  studentId: string;
  dateOfBirth: string;
  rowNum: number;
  errors: string[];
}

interface ImportResult {
  row: ParsedRow;
  success: boolean;
  message: string;
}

type ImportStep = "upload" | "preview" | "importing" | "done";

/* ── Bulk Import Modal ────────────────────────────────────────── */
const BulkImportModal: React.FC<{
  degrees: any[];
  onClose: () => void;
  onDone: () => void;
}> = ({ degrees, onClose, onDone }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep]                   = useState<ImportStep>("upload");
  const [isDragOver, setIsDragOver]       = useState(false);
  const [selectedFile, setSelectedFile]   = useState<File | null>(null);
  const [parseError, setParseError]       = useState("");
  const [parsedRows, setParsedRows]       = useState<ParsedRow[]>([]);
  const [defaultPassword, setDefaultPassword] = useState("");
  const [defaultStatus, setDefaultStatus] = useState("active");
  const [defaultDegree, setDefaultDegree] = useState("");
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [importProgress, setImportProgress] = useState(0);

  const validRows   = parsedRows.filter(r => r.errors.length === 0);
  const invalidRows = parsedRows.filter(r => r.errors.length > 0);

  /* ── Download template ── */
  const downloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const rows = [
      { "Name": "John Doe",   "Email": "john.doe@example.com",   "Student ID": "STU-001", "Date of Birth": "2000-01-15" },
      { "Name": "Jane Smith", "Email": "jane.smith@example.com", "Student ID": "STU-002", "Date of Birth": "1999-06-22" },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    // Set column widths
    ws["!cols"] = [{ wch: 22 }, { wch: 30 }, { wch: 14 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student_import_template.xlsx");
  };

  /* ── Parse uploaded file ── */
  const parseFile = async (file: File) => {
    setParseError("");
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", raw: true });

      if (raw.length < 2) { setParseError("The file appears to be empty or has no data rows."); return; }

      const headerRow = (raw[0] as unknown[]).map(h => String(h ?? ""));
      const nameIdx  = findColIdx(headerRow, ["name", "full name", "student name", "fullname"]);
      const emailIdx = findColIdx(headerRow, ["email", "e-mail", "email address"]);
      const idIdx    = findColIdx(headerRow, ["student id", "studentid", "id", "student no", "student number"]);
      const dobIdx   = findColIdx(headerRow, ["date of birth", "dob", "birthday", "birth date", "birthdate"]);

      if (nameIdx < 0 || emailIdx < 0 || idIdx < 0) {
        setParseError("Could not find required columns. Please use the template — expected headers: Name, Email, Student ID.");
        return;
      }

      const rows: ParsedRow[] = [];
      const seenEmails = new Set<string>();

      for (let i = 1; i < raw.length; i++) {
        const rowArr = raw[i] as unknown[];
        const name      = String(rowArr[nameIdx]  ?? "").trim();
        const email     = String(rowArr[emailIdx] ?? "").trim().toLowerCase();
        const studentId = String(rowArr[idIdx]    ?? "").trim();
        const dateOfBirth = dobIdx >= 0 ? tryParseDate(rowArr[dobIdx]) : "";

        // Skip blank rows
        if (!name && !email && !studentId) continue;

        const errors: string[] = [];
        if (!name) errors.push("Name is required");
        if (!email) {
          errors.push("Email is required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push("Invalid email format");
        } else if (seenEmails.has(email)) {
          errors.push("Duplicate email in file");
        } else {
          seenEmails.add(email);
        }
        if (!studentId) errors.push("Student ID is required");

        rows.push({ name, email, studentId, dateOfBirth, rowNum: i + 1, errors });
      }

      if (rows.length === 0) { setParseError("No data rows found in the file."); return; }
      setParsedRows(rows);
      setStep("preview");
    } catch {
      setParseError("Failed to read the file. Please ensure it is a valid .xlsx, .xls, or .csv file.");
    }
  };

  const handleFileSelect = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      setParseError("Unsupported file type. Please upload a .xlsx, .xls, or .csv file.");
      return;
    }
    setSelectedFile(file);
    setParseError("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleParse = async () => {
    if (!selectedFile) { setParseError("Please select a file first."); return; }
    if (!defaultPassword || defaultPassword.length < 8) { setParseError("Default password must be at least 8 characters."); return; }
    await parseFile(selectedFile);
  };

  /* ── Run import ── */
  const handleImport = async () => {
    if (validRows.length === 0) return;
    setStep("importing");
    const results: ImportResult[] = [];
    let done = 0;

    for (const row of validRows) {
      try {
        await pb.collection("users").create({
          name:            row.name,
          email:           row.email,
          password:        defaultPassword,
          passwordConfirm: defaultPassword,
          studentId:       row.studentId,
          dateOfBirth:     row.dateOfBirth || undefined,
          assignedDegree:  defaultDegree   || undefined,
          status:          defaultStatus,
          role:            "student",
        });
        results.push({ row, success: true, message: "Imported successfully" });
      } catch (err: any) {
        const msg = err?.response?.data?.email?.message
          || err?.response?.data?.studentId?.message
          || err?.message
          || "Failed to create account";
        results.push({ row, success: false, message: msg });
      }
      done++;
      setImportProgress(done);
      setImportResults([...results]);
    }

    const successCount = results.filter(r => r.success).length;
    if (successCount > 0) {
      await logActivity("bulk_import_students", `Bulk imported ${successCount} student(s) from ${selectedFile?.name}`);
    }
    setStep("done");
  };

  /* ── Step indicator ── */
  const steps = ["Upload", "Preview", "Import"];
  const stepIdx = step === "upload" ? 0 : step === "preview" ? 1 : 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={step === "importing" ? undefined : onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-bg rounded-xl border border-border overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-surface shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <FileSpreadsheet size={16} className="text-secondary" />
            </div>
            <h3 className="font-heading font-bold text-lg text-primary">Bulk Import Students</h3>
          </div>
          {step !== "importing" && (
            <button onClick={onClose} className="text-text-muted hover:text-primary transition-colors"><X size={18} /></button>
          )}
        </div>

        {/* Step indicator */}
        <div className="px-6 py-3 border-b border-border bg-surface/50 shrink-0">
          <div className="flex items-center gap-0">
            {steps.map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i < stepIdx ? "bg-green-500 text-white" : i === stepIdx ? "bg-secondary text-white" : "bg-border text-text-muted"}`}>
                    {i < stepIdx ? <CheckCircle2 size={12} /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium ${i === stepIdx ? "text-primary" : "text-text-muted"}`}>{label}</span>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-px mx-2 ${i < stepIdx ? "bg-green-400" : "bg-border"}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step 1: Upload ── */}
          {step === "upload" && (
            <div className="p-6 space-y-5">
              {/* Template download */}
              <div className="flex items-start gap-3 p-4 bg-accent/5 border border-accent/20 rounded-lg">
                <FileSpreadsheet size={18} className="text-secondary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary">Use the official template</p>
                  <p className="text-xs text-text-muted mt-0.5">Columns: <span className="font-mono">Name, Email, Student ID, Date of Birth</span> (DOB optional)</p>
                </div>
                <button onClick={downloadTemplate} className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary border border-secondary/30 hover:border-secondary px-3 py-1.5 rounded-md transition-colors">
                  <Download size={13} />Download Template
                </button>
              </div>

              {/* Drop zone */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Upload File <span className="text-red-500">*</span></label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${isDragOver ? "border-accent bg-accent/5 scale-[1.01]" : selectedFile ? "border-green-400 bg-green-50" : "border-border hover:border-accent/60 hover:bg-accent/5"}`}
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                  {selectedFile ? (
                    <div>
                      <CheckCircle2 size={28} className="mx-auto mb-2 text-green-500" />
                      <p className="font-semibold text-green-700 text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-green-600 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB · Ready to parse</p>
                      <button type="button" onClick={ev => { ev.stopPropagation(); setSelectedFile(null); setParseError(""); }}
                        className="mt-2 text-xs text-red-500 hover:text-red-700 underline">Remove</button>
                    </div>
                  ) : (
                    <div>
                      <Upload size={28} className={`mx-auto mb-2 ${isDragOver ? "text-accent" : "text-text-muted/40"}`} />
                      <p className="text-sm font-medium text-primary">{isDragOver ? "Drop file here" : "Drop your file here or click to browse"}</p>
                      <p className="text-xs text-text-muted mt-1">Accepts .xlsx, .xls, .csv</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Default password */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Default Password <span className="text-red-500">*</span>
                  <span className="text-text-muted font-normal ml-1">(applied to all imported students)</span>
                </label>
                <input
                  type="password"
                  value={defaultPassword}
                  onChange={e => setDefaultPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="input-field"
                />
                <p className="text-xs text-text-muted mt-1">Students should change this after their first login.</p>
              </div>

              {/* Defaults row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Default Status</label>
                  <select value={defaultStatus} onChange={e => setDefaultStatus(e.target.value)} className="input-field">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Default Assigned Degree</label>
                  <select value={defaultDegree} onChange={e => setDefaultDegree(e.target.value)} className="input-field">
                    <option value="">— Not Assigned —</option>
                    {degrees.map(d => <option key={d.id} value={d.id}>{d.degreeName}{d.academic_year ? ` (${d.academic_year})` : ""}</option>)}
                  </select>
                </div>
              </div>

              {parseError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />{parseError}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Preview ── */}
          {step === "preview" && (
            <div className="p-6 space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-semibold">
                  <CheckCircle2 size={15} />{validRows.length} valid
                </div>
                {invalidRows.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-semibold">
                    <AlertCircle size={15} />{invalidRows.length} invalid — will be skipped
                  </div>
                )}
                <span className="text-xs text-text-muted ml-auto">{parsedRows.length} rows parsed from {selectedFile?.name}</span>
              </div>

              {/* Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-primary text-white">
                      <tr>
                        <th className="px-3 py-2 text-left">Row</th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Student ID</th>
                        <th className="px-3 py-2 text-left">DOB</th>
                        <th className="px-3 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, i) => {
                        const ok = row.errors.length === 0;
                        return (
                          <tr key={i} className={`border-t border-border ${ok ? "hover:bg-green-50/30" : "bg-red-50/40 hover:bg-red-50/60"}`}>
                            <td className="px-3 py-2 text-text-muted">{row.rowNum}</td>
                            <td className={`px-3 py-2 font-medium ${row.name ? "text-primary" : "text-red-500 italic"}`}>{row.name || "missing"}</td>
                            <td className={`px-3 py-2 ${row.email ? "text-primary" : "text-red-500 italic"}`}>{row.email || "missing"}</td>
                            <td className={`px-3 py-2 ${row.studentId ? "text-primary" : "text-red-500 italic"}`}>{row.studentId || "missing"}</td>
                            <td className="px-3 py-2 text-text-muted">{row.dateOfBirth || "—"}</td>
                            <td className="px-3 py-2 text-center">
                              {ok ? (
                                <span className="inline-flex items-center gap-1 text-green-700 font-semibold"><CheckCircle2 size={12} />Valid</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-600 font-semibold" title={row.errors.join(", ")}>
                                  <AlertCircle size={12} />{row.errors[0]}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {validRows.length === 0 && (
                <div className="text-center py-4 text-sm text-red-600 font-medium">
                  No valid rows to import. Please fix the errors in your file and try again.
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Importing ── */}
          {step === "importing" && (
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <Loader2 size={18} className="text-secondary animate-spin shrink-0" />
                <p className="text-sm font-semibold text-primary">Importing students… please wait</p>
                <span className="ml-auto text-sm text-text-muted font-semibold">{importProgress} / {validRows.length}</span>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-300"
                  style={{ width: `${validRows.length > 0 ? (importProgress / validRows.length) * 100 : 0}%` }}
                />
              </div>

              {/* Live results */}
              <div className="border border-border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                {importResults.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-2.5 text-sm border-b border-border last:border-0 ${r.success ? "bg-green-50/40" : "bg-red-50/40"}`}>
                    {r.success
                      ? <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                      : <AlertCircle size={14} className="text-red-500 shrink-0" />
                    }
                    <span className="font-medium text-primary">{r.row.name}</span>
                    <span className="text-text-muted text-xs ml-1">{r.row.email}</span>
                    {!r.success && <span className="ml-auto text-xs text-red-600 text-right">{r.message}</span>}
                  </div>
                ))}
                {importProgress < validRows.length && (
                  <div className="px-4 py-3 text-xs text-text-muted text-center">
                    Processing row {importProgress + 1} of {validRows.length}…
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 4: Done ── */}
          {step === "done" && (() => {
            const succeeded = importResults.filter(r => r.success).length;
            const failed    = importResults.filter(r => !r.success);
            return (
              <div className="p-6 space-y-5">
                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-green-700">{succeeded}</p>
                    <p className="text-sm text-green-600 mt-1 font-medium">Imported successfully</p>
                  </div>
                  <div className={`border rounded-lg p-4 text-center ${failed.length > 0 ? "border-red-200 bg-red-50" : "border-border bg-surface"}`}>
                    <p className={`text-3xl font-bold ${failed.length > 0 ? "text-red-600" : "text-text-muted"}`}>{failed.length}</p>
                    <p className={`text-sm mt-1 font-medium ${failed.length > 0 ? "text-red-500" : "text-text-muted"}`}>Failed</p>
                  </div>
                </div>

                {failed.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-primary mb-2">Failed rows (not imported):</p>
                    <div className="border border-red-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                      {failed.map((r, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-2.5 text-sm border-b border-border last:border-0 bg-red-50/40">
                          <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="font-medium text-primary">{r.row.name} <span className="text-text-muted font-normal">({r.row.email})</span></p>
                            <p className="text-xs text-red-600 mt-0.5">{r.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {succeeded > 0 && (
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <CheckCircle size={13} className="text-green-500" />
                    The student list has been updated. Students can now log in with the default password you set.
                  </div>
                )}
              </div>
            );
          })()}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface shrink-0 flex items-center gap-3">
          {step === "upload" && (
            <>
              <button onClick={onClose} className="px-5 py-2.5 border border-border rounded-md text-text-muted hover:text-primary font-semibold transition-colors">
                Cancel
              </button>
              <button onClick={handleParse} disabled={!selectedFile}
                className="ml-auto bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-md inline-flex items-center gap-2 transition-colors">
                <FileSpreadsheet size={15} />Parse File
              </button>
            </>
          )}
          {step === "preview" && (
            <>
              <button onClick={() => { setStep("upload"); setParsedRows([]); setParseError(""); }}
                className="px-5 py-2.5 border border-border rounded-md text-text-muted hover:text-primary font-semibold transition-colors">
                Back
              </button>
              <button onClick={handleImport} disabled={validRows.length === 0}
                className="ml-auto bg-accent hover:bg-accent-light disabled:opacity-50 text-primary font-bold px-6 py-2.5 rounded-md inline-flex items-center gap-2 transition-colors">
                <Users size={15} />Import {validRows.length} Student{validRows.length !== 1 ? "s" : ""}
              </button>
            </>
          )}
          {step === "done" && (
            <button onClick={() => { onDone(); onClose(); }}
              className="ml-auto bg-accent hover:bg-accent-light text-primary font-bold px-6 py-2.5 rounded-md inline-flex items-center gap-2 transition-colors">
              <CheckCircle2 size={15} />Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Export Modal ────────────────────────────────────────────── */
const ExportModal: React.FC<{ degrees: any[]; onClose: () => void }> = ({ degrees, onClose }) => {
  const [exportDegree, setExportDegree] = useState("");
  const [exportCourse, setExportCourse] = useState("");
  const [exportCourses, setExportCourses] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!exportDegree) { setExportCourses([]); setExportCourse(""); return; }
    pb.collection("academic_courses").getFullList({
      filter: `degree = "${exportDegree}"`,
      sort: "year_level,courseName",
      requestKey: null,
    }).then(setExportCourses);
  }, [exportDegree]);

  const handleExport = async () => {
    if (!exportCourse) { alert("Please select a course"); return; }
    setExporting(true);
    try {
      const courseRec = exportCourses.find(c => c.id === exportCourse);
      const courseName = courseRec?.courseName || "Course";

      const enrollments = await pb.collection("module_enrollments").getFullList({
        filter: `course = "${exportCourse}"`,
        expand: "student",
        requestKey: null,
      });

      if (enrollments.length === 0) {
        alert("No students enrolled in this course."); setExporting(false); return;
      }

      const allSubjectIds = new Set<string>();
      enrollments.forEach(e => {
        (e.selected_subjects as string[] || []).forEach((id: string) => allSubjectIds.add(id));
      });

      const subjectMap = new Map<string, any>();
      if (allSubjectIds.size > 0) {
        const subjectFilter = Array.from(allSubjectIds).map(id => `id = "${id}"`).join(" || ");
        const subjects = await pb.collection("academic_subjects").getFullList({
          filter: subjectFilter, requestKey: null,
        });
        subjects.forEach(s => subjectMap.set(s.id, s));
      }

      const rows: Record<string, string>[] = [];
      enrollments.forEach(e => {
        const student = e.expand?.student;
        const selectedSubs: string[] = e.selected_subjects || [];
        if (selectedSubs.length === 0) {
          rows.push({ "Student ID": student?.studentId || "", "Student Name": student?.name || "", "Course": courseName, "Subject Code": "", "Subject Name": "" });
        } else {
          selectedSubs.forEach(subId => {
            const sub = subjectMap.get(subId);
            rows.push({ "Student ID": student?.studentId || "", "Student Name": student?.name || "", "Course": courseName, "Subject Code": sub?.subjectCode || "", "Subject Name": sub?.subjectName || "" });
          });
        }
      });

      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Students");
      XLSX.writeFile(wb, `students_${courseName.replace(/\s+/g, "_")}.xlsx`);
      onClose();
    } catch (err: any) {
      alert(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-bg rounded-lg border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-surface">
          <h3 className="font-heading font-bold text-lg text-primary">Export Students to Excel</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Degree *</label>
            <select value={exportDegree} onChange={e => { setExportDegree(e.target.value); setExportCourse(""); }} className="input-field">
              <option value="">— Select Degree —</option>
              {degrees.map(d => <option key={d.id} value={d.id}>{d.degreeName}{d.academic_year ? ` (${d.academic_year})` : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Course *</label>
            <select value={exportCourse} onChange={e => setExportCourse(e.target.value)} disabled={!exportDegree || exportCourses.length === 0} className="input-field disabled:opacity-50">
              <option value="">— Select Course —</option>
              {exportCourses.map(c => <option key={c.id} value={c.id}>{c.courseName}</option>)}
            </select>
          </div>
          <p className="text-xs text-text-muted">Exports all enrolled students with their selected subjects for the chosen course.</p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={handleExport} disabled={!exportCourse || exporting}
            className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-md inline-flex items-center justify-center gap-2">
            {exporting ? "Exporting…" : <><Download size={16} />Export</>}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 border border-border rounded-md text-text-muted hover:text-primary font-semibold">Cancel</button>
        </div>
      </div>
    </div>
  );
};

/* ── History Modal ───────────────────────────────────────────── */
const StudentHistoryModal: React.FC<{ student: any; onClose: () => void }> = ({ student, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [gradeRecords, setGradeRecords] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [enrs, grades] = await Promise.all([
          pb.collection("module_enrollments").getFullList({ filter: `student = "${student.id}"`, expand: "course,module", sort: "-created", requestKey: null }),
          pb.collection("grade_records").getFullList({ filter: `student = "${student.id}" && gradingStatus = "published"`, expand: "course,module,subject", sort: "-created", requestKey: null }),
        ]);
        setEnrollments(enrs);
        setGradeRecords(grades);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [student.id]);

  const courseMap = new Map<string, { course: any; terms: any[] }>();
  enrollments.forEach(e => {
    const cId = e.course;
    const cName = e.expand?.course?.courseName || "Unknown Course";
    if (!courseMap.has(cId)) courseMap.set(cId, { course: e.expand?.course, terms: [] });
    courseMap.get(cId)!.terms.push(e);
  });
  const courseSections = Array.from(courseMap.values());

  const completedEnrs = enrollments.filter(e => e.status === "completed").length;
  const avgGPA = gradeRecords.length > 0
    ? (gradeRecords.reduce((s, g) => s + (g.gradePoint || 0), 0) / gradeRecords.length).toFixed(2)
    : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-bg rounded-xl border border-border overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-border bg-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent text-primary flex items-center justify-center font-bold shrink-0">
              {student.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-primary">{student.name}</h3>
              <p className="text-xs text-text-muted">{student.email} · ID: {student.studentId || "—"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-primary"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <p className="text-center text-text-muted py-8">Loading history…</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="border border-border rounded-lg p-4 bg-surface text-center">
                  <p className="text-2xl font-bold text-primary">{enrollments.length}</p>
                  <p className="text-xs text-text-muted mt-0.5">Terms Enrolled</p>
                </div>
                <div className="border border-border rounded-lg p-4 bg-surface text-center">
                  <p className="text-2xl font-bold text-green-600">{completedEnrs}</p>
                  <p className="text-xs text-text-muted mt-0.5">Terms Completed</p>
                </div>
                <div className="border border-border rounded-lg p-4 bg-surface text-center">
                  <p className="text-2xl font-bold text-secondary">{avgGPA}</p>
                  <p className="text-xs text-text-muted mt-0.5">Overall GPA</p>
                </div>
              </div>

              {courseSections.length === 0 ? (
                <div className="text-center py-8 border border-border rounded-lg bg-surface">
                  <BookOpen size={36} className="mx-auto text-text-muted/30 mb-2" />
                  <p className="text-text-muted text-sm">No enrollment history yet.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <h4 className="font-heading font-semibold text-primary">Enrolled Courses &amp; Terms</h4>
                  {courseSections.map(({ course, terms }) => (
                    <div key={course?.id || "unknown"} className="border border-border rounded-lg overflow-hidden">
                      <div className="bg-primary px-4 py-2.5 flex items-center gap-2">
                        <GraduationCap size={14} className="text-white/70 shrink-0" />
                        <span className="text-sm font-semibold text-white">{course?.courseName || "Unknown Course"}</span>
                        {course?.academic_year && <span className="text-xs text-white/50 ml-auto">{course.academic_year}</span>}
                      </div>
                      <table className="w-full text-sm">
                        <thead><tr className="bg-surface text-text-muted text-xs">
                          <th className="text-left px-4 py-2">Term</th>
                          <th className="text-center px-4 py-2">Status</th>
                          <th className="text-center px-4 py-2">Enrolled Date</th>
                        </tr></thead>
                        <tbody>{terms.map(t => (
                          <tr key={t.id} className="border-t border-border hover:bg-surface/50">
                            <td className="px-4 py-2.5 font-medium">{t.expand?.module?.moduleName || `Term ${t.module}`}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${enrollStatusStyle[t.status] || enrollStatusStyle.active}`}>{t.status}</span>
                            </td>
                            <td className="px-4 py-2.5 text-center text-xs text-text-muted">{t.enrolledDate || "—"}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {gradeRecords.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-heading font-semibold text-primary flex items-center gap-2"><Award size={16} />Published Grades</h4>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-surface text-text-muted text-xs">
                        <th className="text-left px-4 py-2">Subject</th>
                        <th className="text-left px-4 py-2">Term</th>
                        <th className="text-center px-4 py-2">Grade</th>
                        <th className="text-center px-4 py-2">GPA</th>
                      </tr></thead>
                      <tbody>{gradeRecords.map(g => (
                        <tr key={g.id} className="border-t border-border hover:bg-surface/50">
                          <td className="px-4 py-2 font-medium">{g.expand?.subject?.subjectName || "—"}</td>
                          <td className="px-4 py-2 text-xs text-text-muted">{g.expand?.module?.moduleName || "—"}</td>
                          <td className="px-4 py-2 text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold border bg-green-100 text-green-800 border-green-300">{g.gradeLabel || "—"}</span>
                          </td>
                          <td className="px-4 py-2 text-center font-semibold text-secondary">{g.gradePoint != null ? Number(g.gradePoint).toFixed(2) : "—"}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────────── */
const AdminStudents: React.FC = () => {
  const [students, setStudents]         = useState<any[]>([]);
  const [totalItems, setTotalItems]     = useState(0);
  const [page, setPage]                 = useState(1);
  const [degrees, setDegrees]           = useState<any[]>([]);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading]           = useState(true);

  const [showModal, setShowModal]       = useState(false);
  const [showExport, setShowExport]     = useState(false);
  const [showImport, setShowImport]     = useState(false);
  const [showPwdModal, setShowPwdModal] = useState<string | null>(null);
  const [historyStudent, setHistoryStudent] = useState<any | null>(null);
  const [newPwd, setNewPwd]             = useState("");
  const [editing, setEditing]           = useState<any | null>(null);
  const [form, setForm]                 = useState({ ...emptyForm });
  const [saving, setSaving]             = useState(false);

  const fetchDegrees = useCallback(async () => {
    const d = await pb.collection("degrees").getFullList({ filter: 'status = "active"', sort: "degreeName", requestKey: null });
    setDegrees(d);
  }, []);

  const fetchStudents = useCallback(async (pg: number, q: string, sf: string) => {
    setLoading(true);
    try {
      let filter = 'role = "student"';
      if (sf !== "all") filter += ` && ${pb.filter("status = {:s}", { s: sf })}`;
      if (q.trim())     filter += ` && ${pb.filter("(name ~ {:q} || email ~ {:q} || studentId ~ {:q})", { q: q.trim() })}`;
      const result = await pb.collection("users").getList(pg, PAGE_SIZE, {
        filter, sort: "-created", expand: "assignedDegree", requestKey: null,
      });
      setStudents(result.items);
      setTotalItems(result.totalItems);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDegrees(); }, [fetchDegrees]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);
  useEffect(() => { fetchStudents(page, search, statusFilter); }, [page, search, statusFilter, fetchStudents]);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit   = (r: any) => {
    setEditing(r);
    setForm({ name: r.name || "", email: r.email || "", password: "", passwordConfirm: "", studentId: r.studentId || "", dateOfBirth: r.dateOfBirth || "", assignedDegree: r.assignedDegree || "", status: r.status || "active" });
    setShowModal(true);
  };
  const close = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing && form.password !== form.passwordConfirm) { alert("Passwords do not match"); return; }
    setSaving(true);
    try {
      const payload: any = { name: form.name, studentId: form.studentId, dateOfBirth: form.dateOfBirth || undefined, assignedDegree: form.assignedDegree || undefined, status: form.status };
      if (editing) {
        await pb.collection("users").update(editing.id, payload);
      } else {
        await pb.collection("users").create({ ...payload, email: form.email, password: form.password, passwordConfirm: form.passwordConfirm, role: "student" });
      }
      await fetchStudents(page, search, statusFilter);
      close();
    } catch (err: any) { alert(err.message || "Failed to save"); } finally { setSaving(false); }
  };

  const handleDelete = async (student: any) => {
    if (!confirm(`Archive and remove "${student.name}"? All their enrollment and grade data will be preserved in the archive.`)) return;
    try {
      const adminUser = pb.authStore.record;
      const [moduleEnrollments, gradeRecords] = await Promise.all([
        pb.collection("module_enrollments").getFullList({ filter: `student = "${student.id}"`, expand: "module,course", requestKey: null }),
        pb.collection("grade_records").getFullList({ filter: `student = "${student.id}"`, expand: "subject,module", requestKey: null }),
      ]);
      await pb.collection("archived_students").create({
        original_id: student.id, student_name: student.name || "", student_email: student.email || "",
        studentId: student.studentId || "", assigned_course_name: student.expand?.assignedDegree?.degreeName || "",
        archived_by_name: adminUser?.name || adminUser?.email || "Admin", original_data: student,
      });
      for (const enr of moduleEnrollments) {
        await pb.collection("archived_enrollments").create({
          original_id: enr.id, student_id: student.id, student_name: student.name || "",
          module_name: enr.expand?.module?.moduleName || "", course_name: enr.expand?.course?.courseName || "",
          status: enr.status, selected_subjects: enr.selected_subjects || [], original_data: enr,
        });
      }
      for (const gr of gradeRecords) {
        await pb.collection("archived_grade_records").create({
          original_id: gr.id, student_id: student.id, student_name: student.name || "",
          subject_name: gr.expand?.subject?.subjectName || "", module_name: gr.expand?.module?.moduleName || "",
          marksObtained: gr.marksObtained || 0, maxMarks: gr.maxMarks || 0,
          gradeLabel: gr.gradeLabel || "", gradePoint: gr.gradePoint || 0,
          gradingStatus: gr.gradingStatus || "", original_data: gr,
        });
      }
      await pb.collection("users").delete(student.id);
      await logActivity("student_archived", `Archived student: ${student.name} (${student.email})`);
      await fetchStudents(page, search, statusFilter);
      alert(`${student.name} archived. ${moduleEnrollments.length} enrollment(s) and ${gradeRecords.length} grade record(s) preserved.`);
    } catch (err: any) { alert(err.message || "Failed to archive student"); }
  };

  const handlePwdReset = async () => {
    if (!newPwd || newPwd.length < 8) { alert("Password must be at least 8 characters"); return; }
    try {
      await pb.collection("users").update(showPwdModal!, { password: newPwd, passwordConfirm: newPwd });
      setShowPwdModal(null); setNewPwd(""); alert("Password reset successfully.");
    } catch (err: any) { alert(err.message || "Failed to reset password"); }
  };

  return (
    <PortalLayout role="admin">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-1">Student Management</h2>
            <p className="text-text-muted text-sm">Manage student accounts, degree assignments and status</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowExport(true)} className="bg-surface hover:bg-bg border border-border text-primary font-semibold px-4 py-2.5 rounded-md inline-flex items-center gap-2 transition-colors">
              <Download size={17} />Export
            </button>
            <button onClick={() => setShowImport(true)} className="bg-surface hover:bg-bg border border-border text-secondary font-semibold px-4 py-2.5 rounded-md inline-flex items-center gap-2 transition-colors">
              <Upload size={17} />Bulk Import
            </button>
            <button onClick={openCreate} className="bg-accent hover:bg-accent-light text-primary font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2">
              <Plus size={17} />Add Student
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total",     value: totalItems,                                            c: "text-primary"   },
            { label: "Active",    value: students.filter(s => s.status === "active").length,    c: "text-green-600" },
            { label: "Inactive",  value: students.filter(s => s.status === "inactive").length,  c: "text-gray-500"  },
            { label: "Suspended", value: students.filter(s => s.status === "suspended").length, c: "text-red-600"   },
          ].map(st => (
            <div key={st.label} className="border border-border rounded-lg p-4 bg-surface">
              <p className="text-xs text-text-muted mb-1">{st.label}</p>
              <p className={`text-2xl font-bold ${st.c}`}>{st.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-2 flex-1 min-w-[260px] border border-border rounded-md px-3 bg-surface">
            <Search size={16} className="text-text-muted shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or student ID…" className="flex-1 py-2 text-sm bg-transparent focus:outline-none text-text" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field max-w-[180px]">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="graduated">Graduated</option>
          </select>
        </div>

        {loading ? <p className="text-center text-text-muted py-12">Loading students…</p> : students.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-surface">
            <UserSquare size={44} className="mx-auto text-text-muted/30 mb-3" />
            <p className="text-text-muted">No students found</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-primary text-white">
                  <th className="text-left px-5 py-3">Student</th>
                  <th className="text-left px-5 py-3">Student ID</th>
                  <th className="text-left px-5 py-3">Assigned Degree</th>
                  <th className="text-center px-5 py-3">Status</th>
                  <th className="text-center px-5 py-3">Actions</th>
                </tr></thead>
                <tbody>{students.map(s => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent text-primary flex items-center justify-center font-bold text-xs shrink-0">{s.name?.charAt(0).toUpperCase() || "?"}</div>
                        <div>
                          <p className="font-semibold text-primary">{s.name}</p>
                          <p className="text-xs text-text-muted">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-text-muted">{s.studentId || "—"}</td>
                    <td className="px-5 py-3">
                      {s.expand?.assignedDegree ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-primary rounded text-xs font-semibold">
                          <GraduationCap size={12} />{s.expand.assignedDegree.degreeName}
                        </span>
                      ) : <span className="text-text-muted text-xs">Not Assigned</span>}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusStyle[s.status] || statusStyle.active}`}>{s.status || "active"}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-secondary hover:text-primary" title="Edit"><Edit2 size={14} /></button>
                        <button onClick={() => setHistoryStudent(s)} className="p-1.5 text-primary/60 hover:text-primary" title="View History"><History size={14} /></button>
                        <button onClick={() => { setShowPwdModal(s.id); setNewPwd(""); }} className="p-1.5 text-accent/80 hover:text-primary" title="Reset Password"><KeyRound size={14} /></button>
                        <button onClick={() => handleDelete(s)} className="p-1.5 text-orange-500 hover:text-orange-700" title="Archive & Remove"><Archive size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface">
              <p className="text-xs text-text-muted">
                {totalItems} student{totalItems !== 1 ? "s" : ""} · Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 border border-border rounded-md text-text-muted hover:text-primary disabled:opacity-40 transition-colors"><ChevronLeft size={15} /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 border border-border rounded-md text-text-muted hover:text-primary disabled:opacity-40 transition-colors"><ChevronRight size={15} /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-lg max-h-[90vh] bg-bg rounded-lg border border-border overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border bg-surface shrink-0">
              <h3 className="font-heading font-bold text-lg text-primary">{editing ? "Edit" : "Add"} Student</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Full Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-field" /></div>
                <div><label className="label">Student ID</label><input value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className="input-field" placeholder="e.g. STU-001" /></div>
              </div>
              {!editing && (
                <>
                  <div><label className="label">Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="input-field" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="label">Password *</label><input type="password" minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required className="input-field" /></div>
                    <div><label className="label">Confirm Password *</label><input type="password" minLength={8} value={form.passwordConfirm} onChange={e => setForm({ ...form, passwordConfirm: e.target.value })} required className="input-field" /></div>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Date of Birth</label><input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} className="input-field" /></div>
                <div><label className="label">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="graduated">Graduated</option>
                  </select></div>
              </div>
              <div><label className="label">Assigned Degree</label>
                <select value={form.assignedDegree} onChange={e => setForm({ ...form, assignedDegree: e.target.value })} className="input-field">
                  <option value="">— Not Assigned —</option>
                  {degrees.map(d => <option key={d.id} value={d.id}>{d.degreeName} ({d.academic_year || d.degreeCode})</option>)}
                </select></div>
              <div className="flex gap-3 pt-2 border-t border-border">
                <button type="submit" disabled={saving} className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-md">{saving ? "Saving…" : editing ? "Update" : "Add Student"}</button>
                <button type="button" onClick={close} className="px-5 py-2.5 border border-border rounded-md text-text-muted hover:text-primary font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImport && (
        <BulkImportModal
          degrees={degrees}
          onClose={() => setShowImport(false)}
          onDone={() => fetchStudents(page, search, statusFilter)}
        />
      )}

      {/* Export Modal */}
      {showExport && <ExportModal degrees={degrees} onClose={() => setShowExport(false)} />}

      {/* History Modal */}
      {historyStudent && <StudentHistoryModal student={historyStudent} onClose={() => setHistoryStudent(null)} />}

      {/* Password Reset Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={() => setShowPwdModal(null)} />
          <div className="relative w-full max-w-sm bg-bg rounded-lg border border-border p-6">
            <h3 className="font-heading font-bold text-lg text-primary mb-4">Reset Password</h3>
            <label className="label">New Password (min 8 chars)</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="input-field mb-4" placeholder="Enter new password" />
            <div className="flex gap-3">
              <button onClick={handlePwdReset} className="flex-1 bg-accent hover:bg-accent-light text-primary font-bold py-2.5 rounded-md">Reset</button>
              <button onClick={() => setShowPwdModal(null)} className="px-5 py-2.5 border border-border rounded-md text-text-muted hover:text-primary font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminStudents;
