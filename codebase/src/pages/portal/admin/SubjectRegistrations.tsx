import React, { useEffect, useState, useCallback } from "react";
import { Search, Filter, X, AlertCircle, UserCheck } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const statusStyles: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-300",
  active:    "bg-blue-100 text-blue-800 border-blue-300",
  passed:    "bg-green-100 text-green-800 border-green-300",
  failed:    "bg-red-100 text-red-800 border-red-300",
  withdrawn: "bg-gray-100 text-gray-700 border-gray-300",
  dropped:   "bg-gray-100 text-gray-700 border-gray-300",
};
const classStyle = (c: string) =>
  c === "mandatory" ? "bg-red-100 text-red-700 border-red-300" : "bg-yellow-100 text-yellow-700 border-yellow-300";

const ALL_STATUSES = ["pending", "active", "passed", "failed", "withdrawn", "dropped"];

const AdminSubjectRegistrations: React.FC = () => {
  const [records, setRecords]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch]         = useState("");
  const [updating, setUpdating]     = useState<string | null>(null);
  const [detailRec, setDetailRec]   = useState<any | null>(null);
  const [noteInput, setNoteInput]   = useState("");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const filter = filterStatus ? `status = "${filterStatus}"` : "";
      const data = await pb.collection("subject_registrations").getFullList({
        filter,
        expand: "student,curriculum_subject.degree,subject",
        sort:   "-created",
        requestKey: null,
      });
      setRecords(data);
    } finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const updateStatus = async (id: string, status: string, notes?: string) => {
    setUpdating(id);
    try {
      const approved_by = status === "active" ? pb.authStore.record?.id : undefined;
      await pb.collection("subject_registrations").update(id, {
        status,
        ...(approved_by ? { approved_by } : {}),
        ...(notes !== undefined ? { notes } : {}),
      });
      await fetchRecords();
      if (detailRec?.id === id) setDetailRec(null);
    } catch (err: any) { alert(err.message); }
    finally { setUpdating(null); }
  };

  const openDetail = (r: any) => { setDetailRec(r); setNoteInput(r.notes || ""); };

  const visible = search
    ? records.filter(r =>
        (r.expand?.student?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.expand?.student?.studentId || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.expand?.subject?.subjectName || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.expand?.subject?.subjectCode || "").toLowerCase().includes(search.toLowerCase())
      )
    : records;

  const pendingCount = records.filter(r => r.status === "pending").length;

  const getCurriculumSubject = (r: any) => r.expand?.curriculum_subject;
  const getDegree = (r: any) => {
    const cs = getCurriculumSubject(r);
    return cs?.expand?.degree;
  };

  return (
    <PortalLayout role="admin">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="font-heading font-bold text-2xl text-primary mb-1">Subject Registrations</h2>
          <p className="text-text-muted text-sm">
            Review and manage student cross-curriculum subject registration requests.
            Approving a registration does not change the student's primary degree.
          </p>
        </div>

        {/* Stats bar */}
        {pendingCount > 0 && (
          <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-300 rounded-lg">
            <AlertCircle size={16} className="text-yellow-700 shrink-0"/>
            <p className="text-sm text-yellow-800 font-semibold">{pendingCount} registration{pendingCount > 1 ? "s" : ""} pending approval</p>
            <button onClick={() => setFilterStatus("pending")} className="ml-auto text-xs text-yellow-700 underline hover:no-underline">View pending</button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student or subject…" className="input-field pl-9 max-w-72"/>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-text-muted shrink-0"/>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field max-w-48">
              <option value="">All Statuses ({records.length})</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)} ({records.filter(r => r.status === s).length})</option>
              ))}
            </select>
          </div>
          {filterStatus && <button onClick={() => setFilterStatus("")} className="text-xs text-text-muted hover:text-primary">Clear</button>}
        </div>

        {loading ? (
          <p className="text-center text-text-muted py-12">Loading…</p>
        ) : visible.length === 0 ? (
          <div className="text-center py-16 border border-border rounded-xl bg-surface">
            <UserCheck size={44} className="mx-auto text-text-muted/25 mb-4"/>
            <p className="font-semibold text-primary mb-1">No registrations found</p>
            <p className="text-sm text-text-muted">
              Students register for elective subjects through the Enrollment page under "Elective Subjects".
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-primary text-white">
                  <th className="text-left px-5 py-3">Student</th>
                  <th className="text-left px-5 py-3">Subject</th>
                  <th className="text-left px-4 py-3">Curriculum Placement</th>
                  <th className="text-center px-4 py-3">Classification</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3">Registered</th>
                  <th className="text-center px-4 py-3">Actions</th>
                </tr></thead>
                <tbody>
                  {visible.map(r => {
                    const cs  = getCurriculumSubject(r);
                    const deg = getDegree(r);
                    return (
                      <tr key={r.id} className={`border-b border-border last:border-0 hover:bg-bg transition-colors ${r.status === "pending" ? "bg-yellow-50/30" : ""}`}>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-primary">{r.expand?.student?.name || "—"}</p>
                          <p className="text-xs text-text-muted">{r.expand?.student?.studentId || r.expand?.student?.email || ""}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-primary">{r.expand?.subject?.subjectName || "—"}</p>
                          <p className="text-xs font-mono text-text-muted">{r.expand?.subject?.subjectCode || ""}</p>
                          {r.expand?.subject?.credit_no > 0 && (
                            <p className="text-xs text-text-muted">{r.expand.subject.credit_no} credits</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-primary font-semibold">{deg?.degreeName || "—"}</p>
                          <p className="text-xs text-text-muted">{cs?.module_label || ""}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${classStyle(cs?.classification || "elective")}`}>
                            {cs?.classification === "mandatory" ? "🔴 Mandatory" : "🟡 Elective"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusStyles[r.status] || ""}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-text-muted">
                          {r.created ? r.created.slice(0, 10) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-1.5 flex-wrap">
                            {r.status === "pending" && (
                              <>
                                <button onClick={() => updateStatus(r.id, "active")}
                                  disabled={updating === r.id}
                                  className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-colors disabled:opacity-60">
                                  {updating === r.id ? "…" : "Approve"}
                                </button>
                                <button onClick={() => updateStatus(r.id, "withdrawn")}
                                  disabled={updating === r.id}
                                  className="px-2.5 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold rounded transition-colors disabled:opacity-60">
                                  {updating === r.id ? "…" : "Reject"}
                                </button>
                              </>
                            )}
                            <button onClick={() => openDetail(r)}
                              className="px-2.5 py-1 border border-border hover:border-accent text-text-muted hover:text-primary text-xs font-semibold rounded transition-colors">
                              Manage
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

      {/* Detail / Manage Modal */}
      {detailRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={() => setDetailRec(null)}/>
          <div className="relative w-full max-w-md bg-bg rounded-lg border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-surface flex items-center justify-between shrink-0">
              <h3 className="font-heading font-bold text-lg text-primary">Manage Registration</h3>
              <button onClick={() => setDetailRec(null)} className="text-text-muted hover:text-primary"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Student</p>
                  <p className="font-semibold text-primary text-sm">{detailRec.expand?.student?.name}</p>
                  <p className="text-xs text-text-muted">{detailRec.expand?.student?.studentId || ""}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Subject</p>
                  <p className="font-semibold text-primary text-sm">{detailRec.expand?.subject?.subjectName}</p>
                  <p className="text-xs font-mono text-text-muted">{detailRec.expand?.subject?.subjectCode}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Curriculum Placement</p>
                  <p className="text-sm text-primary">{getDegree(detailRec)?.degreeName || "—"}</p>
                  <p className="text-xs text-text-muted">{getCurriculumSubject(detailRec)?.module_label || ""}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Current Status</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusStyles[detailRec.status]}`}>
                    {detailRec.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="label">Notes for Student</label>
                <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)} rows={3}
                  className="input-field resize-none" placeholder="Optional notes (reason for rejection, instructions…)"/>
              </div>
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Change Status</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map(s => (
                    <button key={s} onClick={() => updateStatus(detailRec.id, s, noteInput)}
                      disabled={updating === detailRec.id || detailRec.status === s}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors capitalize ${
                        detailRec.status === s
                          ? (statusStyles[s] || "") + " cursor-default"
                          : "border-border text-text-muted hover:text-primary hover:border-accent disabled:opacity-50"
                      }`}>
                      {s === detailRec.status ? `✓ ${s}` : s}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Changing to <strong>active</strong> enrolls the student. <strong>passed</strong> / <strong>failed</strong> locks the registration.
                  <strong> withdrawn</strong> / <strong>dropped</strong> allow re-registration.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminSubjectRegistrations;
