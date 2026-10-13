import React, { useEffect, useState, useCallback } from "react";
import { Activity, Filter, Search, RefreshCw } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const ACTION_LABELS: Record<string, string> = {
  login:               "Login",
  logout:              "Logout",
  enrollment_request:  "Enrollment Request",
  enrollment_approve:  "Enrollment Approved",
  enrollment_reject:   "Enrollment Rejected",
  student_archived:    "Student Archived",
  user_create:         "User Created",
  user_delete:         "User Deleted",
  role_change:         "Role Changed",
  grade_published:     "Grade Published",
};

const ACTION_COLORS: Record<string, string> = {
  login:               "bg-green-100 text-green-800 border-green-300",
  logout:              "bg-gray-100 text-gray-700 border-gray-300",
  enrollment_request:  "bg-yellow-100 text-yellow-800 border-yellow-300",
  enrollment_approve:  "bg-blue-100 text-blue-800 border-blue-300",
  enrollment_reject:   "bg-red-100 text-red-800 border-red-300",
  student_archived:    "bg-orange-100 text-orange-800 border-orange-300",
  user_create:         "bg-green-100 text-green-800 border-green-300",
  user_delete:         "bg-red-100 text-red-800 border-red-300",
  role_change:         "bg-purple-100 text-purple-800 border-purple-300",
  grade_published:     "bg-blue-100 text-blue-800 border-blue-300",
};

const ROLE_COLORS: Record<string, string> = {
  admin:   "bg-accent/10 text-primary border-accent/30",
  student: "bg-blue-100 text-blue-700 border-blue-300",
  teacher: "bg-secondary/10 text-secondary border-secondary/30",
};

const AdminActivityLogs: React.FC = () => {
  const [logs, setLogs]             = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PER_PAGE = 30;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const filters: string[] = [];
      if (roleFilter !== "all")   filters.push(pb.filter("role = {:r}",   { r: roleFilter }));
      if (actionFilter !== "all") filters.push(pb.filter("action = {:a}", { a: actionFilter }));
      if (search)                 filters.push(pb.filter("(user_name ~ {:q} || details ~ {:q})", { q: search }));
      const filter = filters.join(" && ");

      const result = await pb.collection("activity_logs").getList(page, PER_PAGE, {
        filter, sort: "-created", requestKey: null,
      });
      setLogs(result.items);
      setTotalPages(result.totalPages || 1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [roleFilter, actionFilter, search, page]);

  useEffect(() => { setPage(1); }, [roleFilter, actionFilter, search]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  };

  return (
    <PortalLayout role="admin">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-1">Activity Logs</h2>
            <p className="text-text-muted text-sm">System-wide audit trail of user actions</p>
          </div>
          <button onClick={fetchLogs} className="p-2.5 rounded-md border border-border hover:bg-surface text-text-muted hover:text-primary transition-colors" title="Refresh">
            <RefreshCw size={16}/>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-[220px] border border-border rounded-md px-3 bg-surface">
            <Search size={15} className="text-text-muted shrink-0"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user or details…"
              className="flex-1 py-2 text-sm bg-transparent focus:outline-none text-text"/>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-text-muted"/>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field max-w-[140px]">
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="input-field max-w-[200px]">
            <option value="all">All Actions</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* Log table */}
        {loading ? (
          <p className="text-center text-text-muted py-12">Loading logs…</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-14 border border-border rounded-lg bg-surface">
            <Activity size={44} className="mx-auto text-text-muted/30 mb-3"/>
            <p className="text-text-muted">No activity logs found</p>
          </div>
        ) : (
          <>
            <div className="border border-border rounded-lg overflow-hidden bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-primary text-white">
                    <th className="text-left px-5 py-3">Timestamp</th>
                    <th className="text-left px-5 py-3">User</th>
                    <th className="text-center px-4 py-3">Role</th>
                    <th className="text-center px-4 py-3">Action</th>
                    <th className="text-left px-5 py-3">Details</th>
                  </tr></thead>
                  <tbody>{logs.map(log => (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                      <td className="px-5 py-3 text-xs text-text-muted whitespace-nowrap">{fmtTime(log.created)}</td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-primary">{log.user_name || "Unknown"}</p>
                        <p className="text-xs text-text-muted">{log.user_id}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${ROLE_COLORS[log.role] || "bg-gray-100 text-gray-700 border-gray-300"}`}>{log.role}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700 border-gray-300"}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-text-muted text-xs max-w-[320px] truncate">{log.details}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-surface">← Prev</button>
                <span className="text-sm text-text-muted">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-surface">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </PortalLayout>
  );
};

export default AdminActivityLogs;
