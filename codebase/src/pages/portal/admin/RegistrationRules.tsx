import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Search, X, BookMarked } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const classStyle = (c: string) =>
  c === "mandatory" ? "bg-red-100 text-red-700 border-red-300" : "bg-yellow-100 text-yellow-700 border-yellow-300";
const statusStyle = (s: string) =>
  s === "active" ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100 text-gray-700 border-gray-300";

const emptyForm = { degreeId: "", subjectId: "", module_label: "", classification: "elective", status: "active" };

const AdminRegistrationRules: React.FC = () => {
  const [rules, setRules]           = useState<any[]>([]);
  const [degrees, setDegrees]       = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filterDeg, setFilterDeg]   = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<any | null>(null);
  const [form, setForm]             = useState({ ...emptyForm });
  const [saving, setSaving]         = useState(false);
  const [subjectSearch, setSubjectSearch]   = useState("");
  const [showSubjectList, setShowSubjectList] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pb.collection("curriculum_subjects").getFullList({
        filter: filterDeg ? `degree = "${filterDeg}"` : "",
        expand: "subject,subject.module,degree",
        sort:   "degree,module_label,classification",
        requestKey: null,
      });
      setRules(data);
    } finally { setLoading(false); }
  }, [filterDeg]);

  useEffect(() => {
    Promise.all([
      pb.collection("degrees").getFullList({ sort: "degreeName", requestKey: null }),
      pb.collection("academic_subjects").getFullList({ expand: "module", sort: "subjectName", requestKey: null }),
    ]).then(([d, s]) => { setDegrees(d); setAllSubjects(s); });
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const openCreate = () => {
    setEditing(null); setForm({ ...emptyForm }); setSubjectSearch(""); setShowModal(true);
  };
  const openEdit = (r: any) => {
    setEditing(r);
    const sub = r.expand?.subject;
    setForm({ degreeId: r.degree, subjectId: r.subject, module_label: r.module_label, classification: r.classification, status: r.status });
    setSubjectSearch(sub ? `${sub.subjectCode} – ${sub.subjectName}` : "");
    setShowModal(true);
  };
  const close = () => { setShowModal(false); setEditing(null); setShowSubjectList(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subjectId) { alert("Please select a subject."); return; }
    setSaving(true);
    try {
      const payload = { degree: form.degreeId, subject: form.subjectId, module_label: form.module_label, classification: form.classification, status: form.status };
      if (editing) await pb.collection("curriculum_subjects").update(editing.id, payload);
      else         await pb.collection("curriculum_subjects").create(payload);
      await fetchRules();
      close();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this rule? Existing student registrations keep their history, but this subject will no longer appear for new registrations.")) return;
    try {
      await pb.collection("curriculum_subjects").delete(id);
      setRules(r => r.filter(x => x.id !== id));
    } catch (err: any) { alert(err.message); }
  };

  const selectSubject = (s: any) => {
    setForm(f => ({ ...f, subjectId: s.id }));
    setSubjectSearch(`${s.subjectCode} – ${s.subjectName}`);
    setShowSubjectList(false);
  };

  const filteredSubjects = subjectSearch.length > 1
    ? allSubjects.filter(s =>
        s.subjectName.toLowerCase().includes(subjectSearch.toLowerCase()) ||
        s.subjectCode.toLowerCase().includes(subjectSearch.toLowerCase())
      ).slice(0, 10)
    : [];

  return (
    <PortalLayout role="admin">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-1">Registration Rules</h2>
            <p className="text-text-muted text-sm">
              Associate existing subjects with degree curricula for cross-program elective registration.
              One subject record can be placed in multiple degree contexts simultaneously.
            </p>
          </div>
          <button onClick={openCreate} className="shrink-0 bg-accent hover:bg-accent-light text-primary font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2">
            <Plus size={17}/>Add Rule
          </button>
        </div>

        {/* Info box */}
        <div className="mb-6 px-4 py-3 bg-accent/10 border border-accent/30 rounded-lg text-sm text-primary">
          <strong>How it works:</strong> A rule says "Subject X appears in Degree Y under <em>Module Label</em> as Mandatory/Elective."
          The subject record itself is never duplicated. Students whose assigned degree matches see the subject in their Enrollment page.
        </div>

        {/* Degree filter */}
        <div className="flex items-center gap-3 mb-6">
          <select value={filterDeg} onChange={e => setFilterDeg(e.target.value)} className="input-field max-w-xs">
            <option value="">All Degrees</option>
            {degrees.map(d => <option key={d.id} value={d.id}>{d.degreeName} {d.academic_year ? `(${d.academic_year})` : ""}</option>)}
          </select>
          {filterDeg && <button onClick={() => setFilterDeg("")} className="text-xs text-text-muted hover:text-primary">Clear</button>}
        </div>

        {loading ? (
          <p className="text-center text-text-muted py-12">Loading…</p>
        ) : rules.length === 0 ? (
          <div className="text-center py-16 border border-border rounded-xl bg-surface">
            <BookMarked size={44} className="mx-auto text-text-muted/25 mb-4"/>
            <p className="font-semibold text-primary mb-1">No registration rules yet</p>
            <p className="text-sm text-text-muted mb-4">
              Add a rule to make an existing subject available to a specific degree's students.
            </p>
            <button onClick={openCreate} className="bg-primary text-white font-semibold px-5 py-2 rounded-md">Add First Rule</button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <table className="w-full text-sm">
              <thead><tr className="bg-primary text-white">
                <th className="text-left px-5 py-3">Degree</th>
                <th className="text-left px-5 py-3">Module Label</th>
                <th className="text-left px-5 py-3">Subject (canonical)</th>
                <th className="text-center px-4 py-3">Classification</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Actions</th>
              </tr></thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                    <td className="px-5 py-3 font-semibold text-primary text-sm">
                      {r.expand?.degree?.degreeName || r.degree}
                      {r.expand?.degree?.academic_year && (
                        <span className="ml-1.5 text-xs text-text-muted font-normal">({r.expand.degree.academic_year})</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-text-muted">{r.module_label}</td>
                    <td className="px-5 py-3">
                      <span className="font-medium">{r.expand?.subject?.subjectName || r.subject}</span>
                      {r.expand?.subject?.subjectCode && (
                        <span className="ml-1.5 text-xs font-mono text-text-muted">({r.expand.subject.subjectCode})</span>
                      )}
                      {r.expand?.subject?.expand?.module && (
                        <p className="text-xs text-text-muted mt-0.5">↳ {r.expand.subject.expand.module.moduleName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${classStyle(r.classification)}`}>
                        {r.classification === "mandatory" ? "🔴 Mandatory" : "🟡 Elective"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusStyle(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEdit(r)} className="p-1.5 text-secondary hover:text-primary" title="Edit"><Edit2 size={14}/></button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 text-red-500 hover:text-red-700" title="Delete"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={close}/>
          <div className="relative w-full max-w-md max-h-[90vh] bg-bg rounded-lg border border-border overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border bg-surface shrink-0 flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-primary">{editing ? "Edit Rule" : "Add Registration Rule"}</h3>
              <button onClick={close} className="text-text-muted hover:text-primary"><X size={18}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {/* Degree */}
              <div>
                <label className="label">Target Degree *</label>
                <select value={form.degreeId} onChange={e => setForm(f => ({ ...f, degreeId: e.target.value }))} required className="input-field">
                  <option value="">— Select Degree —</option>
                  {degrees.map(d => <option key={d.id} value={d.id}>{d.degreeName} {d.academic_year ? `(${d.academic_year})` : ""}</option>)}
                </select>
                <p className="text-xs text-text-muted mt-1">Students in this degree will see the subject in their Enrollment page.</p>
              </div>

              {/* Subject search */}
              <div className="relative">
                <label className="label">Subject * <span className="text-text-muted font-normal">(existing — search by name or code)</span></label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"/>
                  <input
                    value={subjectSearch}
                    onChange={e => { setSubjectSearch(e.target.value); setShowSubjectList(true); setForm(f => ({ ...f, subjectId: "" })); }}
                    onFocus={() => subjectSearch.length > 1 && setShowSubjectList(true)}
                    placeholder="Type subject name or code…"
                    className="input-field pl-9"
                  />
                </div>
                {form.subjectId && (
                  <p className="text-xs text-green-700 mt-1 font-medium">Subject selected</p>
                )}
                {showSubjectList && filteredSubjects.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-bg border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {filteredSubjects.map(s => (
                      <button key={s.id} type="button" onClick={() => selectSubject(s)}
                        className="w-full text-left px-4 py-2.5 hover:bg-surface border-b border-border/50 last:border-0 text-sm">
                        <span className="font-semibold text-primary">{s.subjectName}</span>
                        <span className="ml-2 text-xs font-mono text-text-muted">{s.subjectCode}</span>
                        {s.expand?.module && (
                          <span className="ml-2 text-xs text-text-muted">({s.expand.module.moduleName})</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {subjectSearch.length > 1 && filteredSubjects.length === 0 && showSubjectList && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-bg border border-border rounded-lg shadow-lg px-4 py-3">
                    <p className="text-sm text-text-muted">No subjects match. Try a different name or code.</p>
                  </div>
                )}
              </div>

              {/* Module Label */}
              <div>
                <label className="label">Module Label * <span className="text-text-muted font-normal">(display name in student view)</span></label>
                <input value={form.module_label} onChange={e => setForm(f => ({ ...f, module_label: e.target.value }))} required className="input-field" placeholder="e.g. Elective Module, Year 1 Electives"/>
                <p className="text-xs text-text-muted mt-1">Students see subjects grouped under this label.</p>
              </div>

              {/* Classification */}
              <div>
                <label className="label">Classification in this Degree *</label>
                <select value={form.classification} onChange={e => setForm(f => ({ ...f, classification: e.target.value }))} className="input-field">
                  <option value="elective">🟡 Elective</option>
                  <option value="mandatory">🔴 Mandatory</option>
                </select>
                <p className="text-xs text-text-muted mt-1">The same subject may have a different classification in another degree.</p>
              </div>

              {/* Status */}
              <div>
                <label className="label">Visibility</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-field">
                  <option value="active">Active — visible to students</option>
                  <option value="inactive">Inactive — hidden from students</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2 border-t border-border">
                <button type="submit" disabled={saving || !form.subjectId || !form.degreeId}
                  className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-md">
                  {saving ? "Saving…" : editing ? "Update Rule" : "Add Rule"}
                </button>
                <button type="button" onClick={close} className="px-5 py-2.5 border border-border rounded-md text-text-muted hover:text-primary font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminRegistrationRules;
