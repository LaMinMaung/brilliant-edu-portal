import React, { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, Filter, ClipboardList, Eye, X } from "lucide-react";
import pb from "../../../lib/pocketbase";
import { logActivity } from "../../../lib/logActivity";
import PortalLayout from "../../../components/PortalLayout";

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-300",
  active:    "bg-blue-100 text-blue-800 border-blue-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  failed:    "bg-red-100 text-red-800 border-red-300",
  dropped:   "bg-gray-100 text-gray-700 border-gray-300",
};

const STATUS_LABELS: Record<string, string> = {
  pending:   "Requested",
  active:    "In Progress",
  completed: "Completed",
  failed:    "Failed",
  dropped:   "Dropped",
};

const AdminEnrollments: React.FC = () => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* Subject detail modal */
  const [detailRec, setDetailRec] = useState<any | null>(null);
  const [detailSubs, setDetailSubs] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const filter = statusFilter === "all" ? "" : pb.filter("status = {:s}", { s: statusFilter });
      const data = await pb.collection("module_enrollments").getFullList({
        filter,
        expand: "student,module,course",
        sort: "-created",
        requestKey: null,
      });
      setEnrollments(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  const handleApprove = async (rec: any) => {
    setActionLoading(rec.id);
    try {
      await pb.collection("module_enrollments").update(rec.id, { status: "active" });
      await logActivity(
        "enrollment_approve",
        `Approved enrollment for ${rec.expand?.student?.name} in module: ${rec.expand?.module?.moduleName}`
      );
      setEnrollments(prev => prev.map(e => e.id === rec.id ? { ...e, status: "active" } : e));
    } catch (err: any) { alert(err.message || "Failed to approve"); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (rec: any) => {
    if (!confirm(`Reject enrollment request from ${rec.expand?.student?.name}?`)) return;
    setActionLoading(rec.id);
    try {
      await pb.collection("module_enrollments").delete(rec.id);
      await logActivity(
        "enrollment_reject",
        `Rejected enrollment for ${rec.expand?.student?.name} in module: ${rec.expand?.module?.moduleName}`
      );
      setEnrollments(prev => prev.filter(e => e.id !== rec.id));
    } catch (err: any) { alert(err.message || "Failed to reject"); }
    finally { setActionLoading(null); }
  };

  const openDetail = async (rec: any) => {
    setDetailRec(rec); setDetailSubs([]); setLoadingSubs(true);
    const selectedIds: string[] = rec.selected_subjects || [];
    if (selectedIds.length === 0) { setLoadingSubs(false); return; }
    try {
      const subs = await pb.collection("academic_subjects").getFullList({
        filter: selectedIds.map(id => `id = "${id}"`).join(" || "),
        requestKey: null,
      });
      setDetailSubs(subs);
    } catch (err) { console.error(err); }
    finally { setLoadingSubs(false); }
  };

  const stats = {
    pending:   enrollments.filter(e => e.status === "pending").length,
    active:    enrollments.filter(e => e.status === "active").length,
    completed: enrollments.filter(e => e.status === "completed").length,
    other:     enrollments.filter(e => e.status === "failed" || e.status === "dropped").length,
  };

  return (
    <PortalLayout role="admin">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="font-heading font-bold text-2xl text-primary mb-1">Enrollment Management</h2>
          <p className="text-text-muted text-sm">Review and approve student module enrollment requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Requested",   value: stats.pending,   c: "text-yellow-600" },
            { label: "In Progress", value: stats.active,    c: "text-blue-600" },
            { label: "Completed",   value: stats.completed, c: "text-green-600" },
            { label: "Failed/Dropped", value: stats.other,  c: "text-gray-500" },
          ].map(s => (
            <div key={s.label} className="border border-border rounded-lg p-4 bg-surface">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.c}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="mb-5 flex items-center gap-3">
          <Filter size={16} className="text-text-muted" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field max-w-xs">
            <option value="all">All Statuses</option>
            <option value="pending">Requested (Pending)</option>
            <option value="active">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-center text-text-muted py-12">Loading enrollments…</p>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-14 border border-border rounded-lg bg-surface">
            <ClipboardList size={44} className="mx-auto text-text-muted/30 mb-3" />
            <p className="text-text-muted">
              {statusFilter === "pending" ? "No pending enrollment requests" : "No enrollments found"}
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-primary text-white">
                  <th className="text-left px-5 py-3">Student</th>
                  <th className="text-left px-5 py-3">Module</th>
                  <th className="text-left px-5 py-3">Course</th>
                  <th className="text-center px-4 py-3">Subjects</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Requested</th>
                  <th className="text-center px-4 py-3">Actions</th>
                </tr></thead>
                <tbody>{enrollments.map(enr => {
                  const isBusy = actionLoading === enr.id;
                  const selectedCount = (enr.selected_subjects || []).length;
                  return (
                    <tr key={enr.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-primary">{enr.expand?.student?.name || "—"}</p>
                        <p className="text-xs text-text-muted">{enr.expand?.student?.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-primary">{enr.expand?.module?.moduleName || "—"}</p>
                        <p className="text-xs text-text-muted">Module {enr.expand?.module?.moduleOrder}</p>
                      </td>
                      <td className="px-5 py-3 text-text-muted text-xs">{enr.expand?.course?.courseName || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {selectedCount > 0 ? (
                          <button onClick={() => openDetail(enr)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-accent/10 hover:bg-accent/20 text-primary text-xs font-semibold transition-colors">
                            <Eye size={11}/>{selectedCount}
                          </button>
                        ) : <span className="text-text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[enr.status] || STATUS_STYLES.dropped}`}>
                          {STATUS_LABELS[enr.status] || enr.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {new Date(enr.created).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center items-center gap-1">
                          {enr.status === "pending" ? (
                            <>
                              <button onClick={() => handleApprove(enr)} disabled={isBusy}
                                title="Approve"
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-800 rounded-md text-xs font-bold disabled:opacity-60 transition-colors">
                                <CheckCircle size={13}/>{isBusy ? "…" : "Approve"}
                              </button>
                              <button onClick={() => handleReject(enr)} disabled={isBusy}
                                title="Reject"
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-xs font-bold disabled:opacity-60 transition-colors">
                                <XCircle size={13}/>{isBusy ? "…" : "Reject"}
                              </button>
                            </>
                          ) : (
                            <span className="text-text-muted text-xs">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Subject Detail Modal */}
      {detailRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={() => setDetailRec(null)} />
          <div className="relative w-full max-w-md max-h-[80vh] bg-bg rounded-xl border border-border overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border bg-surface flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-heading font-bold text-lg text-primary">Selected Subjects</h3>
                <p className="text-xs text-text-muted">{detailRec.expand?.student?.name} · {detailRec.expand?.module?.moduleName}</p>
              </div>
              <button onClick={() => setDetailRec(null)} className="text-text-muted hover:text-primary"><X size={18}/></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {loadingSubs ? <p className="text-center text-text-muted py-6">Loading…</p> :
               detailSubs.length === 0 ? <p className="text-center text-text-muted py-6">No subjects selected.</p> : (
                <div className="space-y-2">
                  {detailSubs.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface">
                      <div className={`w-1.5 h-8 rounded-full shrink-0 ${s.subjectType === "mandatory" ? "bg-red-400" : "bg-blue-400"}`}/>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-primary">{s.subjectName}</p>
                        <p className="text-xs text-text-muted">{s.subjectCode}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${s.subjectType === "mandatory" ? "bg-red-100 text-red-700 border-red-300" : "bg-blue-100 text-blue-700 border-blue-300"}`}>{s.subjectType}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminEnrollments;
