import React, { useEffect, useState, useCallback } from "react";
import { Search, Save, Lock, Send, BarChart3 } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

interface GradeEntry {
  id?: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  marksObtained: string;
  gradeLabel: string;
  gradePoint: string;
  remarks: string;
  gradingStatus: string;
  enrollmentId: string;
  // Elective cross-registration fields (mutually exclusive with enrollmentId)
  subjectRegistrationId?: string;
  isElective?: boolean;
}

const statusStyle: Record<string, string> = {
  draft:     "bg-yellow-100 text-yellow-800 border-yellow-300",
  published: "bg-green-100 text-green-800 border-green-300",
  locked:    "bg-gray-200 text-gray-700 border-gray-400",
};

function computeGrade(marks: number, maxMarks: number, configs: any[]): { gradeLabel: string; gradePoint: number } {
  const pct = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
  const match = configs.find(c => pct >= c.minMarks && pct <= c.maxMarks);
  return match ? { gradeLabel: match.gradeLabel, gradePoint: match.gradePoint } : { gradeLabel: "—", gradePoint: 0 };
}

const AdminGradeManagement: React.FC = () => {
  const [degrees, setDegrees]   = useState<any[]>([]);
  const [courses, setCourses]   = useState<any[]>([]);
  const [modules, setModules]   = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [configs, setConfigs]   = useState<any[]>([]);

  const [selDegree,  setSelDegree]  = useState("");
  const [selCourse,  setSelCourse]  = useState("");
  const [selModule,  setSelModule]  = useState("");
  const [selSubject, setSelSubject] = useState("");

  const [grades,   setGrades]   = useState<GradeEntry[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState("");
  const [sessionMaxMarks, setSessionMaxMarks] = useState("100");

  /* ── bootstrap ── */
  useEffect(() => {
    Promise.all([
      pb.collection("degrees").getFullList({ sort: "degreeName", requestKey: null }),
      pb.collection("grade_configs").getFullList({ sort: "-minMarks", requestKey: null }),
    ]).then(([d, gc]) => { setDegrees(d); setConfigs(gc); });
  }, []);

  /* Degree → Courses */
  useEffect(() => {
    setCourses([]); setSelCourse("");
    setModules([]); setSelModule("");
    setSubjects([]); setSelSubject(""); setGrades([]);
    if (!selDegree) return;
    pb.collection("academic_courses").getFullList({
      filter: `degree = "${selDegree}" && status != "inactive"`,
      sort: "year_level,courseName", requestKey: null,
    }).then(setCourses);
  }, [selDegree]);

  /* Course → Terms (finish status only) */
  useEffect(() => {
    setModules([]); setSelModule("");
    setSubjects([]); setSelSubject(""); setGrades([]);
    if (!selCourse) return;
    pb.collection("academic_modules").getFullList({
      filter: `course = "${selCourse}" && status = "finish"`,
      sort: "moduleOrder", requestKey: null,
    }).then(mods => {
      setModules(mods);
      if (mods.length === 0) alert("No terms with Finish status in this course. Change a term's status to Finish first.");
    });
  }, [selCourse]);

  /* Term → Subjects */
  useEffect(() => {
    setSubjects([]); setSelSubject(""); setGrades([]);
    if (!selModule) return;
    pb.collection("academic_subjects").getFullList({
      filter: `module = "${selModule}" && status = "active"`,
      sort: "subjectName", requestKey: null,
    }).then(setSubjects);
  }, [selModule]);

  /* ── Auto-complete check after locking ── */
  const checkAndAutoComplete = useCallback(async () => {
    if (!selModule || !selCourse) return;
    try {
      const [allSubjs, allEnrs] = await Promise.all([
        pb.collection("academic_subjects").getFullList({ filter: `module = "${selModule}" && status = "active"`, fields: "id", requestKey: null }),
        pb.collection("module_enrollments").getFullList({ filter: `module = "${selModule}" && course = "${selCourse}" && status != "dropped" && status != "failed"`, requestKey: null }),
      ]);
      if (allSubjs.length === 0 || allEnrs.length === 0) return;

      const allGrades = await pb.collection("grade_records").getFullList({
        filter: `module = "${selModule}"`, fields: "student,subject,gradingStatus", requestKey: null,
      });
      const gradedSet = new Set(
        allGrades
          .filter((g: any) => g.gradingStatus === "published" || g.gradingStatus === "locked")
          .map((g: any) => `${g.student}:${g.subject}`)
      );

      // Only check primary module_enrollment students — elective students do not affect auto-completion
      for (const enr of allEnrs) {
        const sel: string[] = enr.selected_subjects || [];
        const subjsToCheck = sel.length > 0 ? allSubjs.filter((s: any) => sel.includes(s.id)) : allSubjs;
        for (const subj of subjsToCheck) {
          if (!gradedSet.has(`${enr.student}:${subj.id}`)) return;
        }
      }

      await pb.collection("academic_modules").update(selModule, { status: "graded" });
      for (const enr of allEnrs) {
        if (enr.status !== "completed") {
          await pb.collection("module_enrollments").update(enr.id, { status: "completed" });
        }
      }

      const allCourseMods = await pb.collection("academic_modules").getFullList({ filter: `course = "${selCourse}"`, requestKey: null });
      const updatedMods = allCourseMods.map((m: any) => m.id === selModule ? { ...m, status: "graded" } : m);
      if (updatedMods.every((m: any) => m.status === "graded")) {
        await pb.collection("academic_courses").update(selCourse, { status: "completed" });
        alert(`🎓 All terms graded — course automatically marked Completed! ${allEnrs.length} student enrollment(s) updated.`);
      } else {
        alert(`✅ Term fully graded! ${allEnrs.length} student enrollment(s) marked Completed.`);
      }
    } catch (err) {
      console.error("Auto-completion check failed:", err);
    }
  }, [selModule, selCourse]);

  /* ── Load grades ── */
  const loadGrades = useCallback(async () => {
    if (!selModule || !selSubject || !selCourse) return;
    setLoading(true);
    try {
      // 1. Primary: module_enrollments for this module/course
      const enrollments = await pb.collection("module_enrollments").getFullList({
        filter: `module = "${selModule}" && course = "${selCourse}"`,
        expand: "student", requestKey: null,
      });
      const eligible = enrollments.filter((e: any) => {
        const sel: string[] = e.selected_subjects || [];
        return sel.length === 0 || sel.includes(selSubject);
      });

      // 2. Cross-registered: subject_registrations with status "active" for this subject
      const subjectRegs = await pb.collection("subject_registrations").getFullList({
        filter: `subject = "${selSubject}" && status = "active"`,
        expand: "student", requestKey: null,
      }).catch(() => [] as any[]);

      // 3. Existing grade records for this module/subject (covers both primary and elective)
      const existing = await pb.collection("grade_records").getFullList({
        filter: `module = "${selModule}" && subject = "${selSubject}"`,
        requestKey: null,
      });
      const recMap = new Map(existing.map(r => [r.student, r]));
      const maxM = parseFloat(sessionMaxMarks) || 100;

      // Build primary student entries
      const primaryStudentIds = new Set(eligible.map((e: any) => e.student));
      const primaryEntries: GradeEntry[] = eligible.map((e: any) => {
        const rec = recMap.get(e.student);
        const marks = rec ? String(rec.marksObtained) : "";
        const { gradeLabel, gradePoint } = marks !== ""
          ? computeGrade(parseFloat(marks), rec?.maxMarks || maxM, configs)
          : { gradeLabel: "", gradePoint: 0 };
        if (rec && rec.maxMarks) setSessionMaxMarks(String(rec.maxMarks));
        return {
          id: rec?.id,
          studentId: e.student,
          studentName: e.expand?.student?.name || "Unknown",
          studentCode: e.expand?.student?.studentId || "—",
          marksObtained: marks,
          gradeLabel: rec?.gradeLabel || gradeLabel,
          gradePoint: rec ? String(rec.gradePoint) : String(gradePoint),
          remarks: rec?.remarks || "",
          gradingStatus: rec?.gradingStatus || "draft",
          enrollmentId: e.id,
          isElective: false,
        };
      });

      // Build elective (cross-registered) entries — skip if student already in primary
      const electiveEntries: GradeEntry[] = subjectRegs
        .filter((sr: any) => !primaryStudentIds.has(sr.student))
        .map((sr: any) => {
          const rec = recMap.get(sr.student);
          const marks = rec ? String(rec.marksObtained) : "";
          const { gradeLabel, gradePoint } = marks !== ""
            ? computeGrade(parseFloat(marks), rec?.maxMarks || maxM, configs)
            : { gradeLabel: "", gradePoint: 0 };
          if (rec && rec.maxMarks) setSessionMaxMarks(String(rec.maxMarks));
          return {
            id: rec?.id,
            studentId: sr.student,
            studentName: sr.expand?.student?.name || "Unknown",
            studentCode: sr.expand?.student?.studentId || "—",
            marksObtained: marks,
            gradeLabel: rec?.gradeLabel || gradeLabel,
            gradePoint: rec ? String(rec.gradePoint) : String(gradePoint),
            remarks: rec?.remarks || "",
            gradingStatus: rec?.gradingStatus || "draft",
            enrollmentId: "",
            subjectRegistrationId: sr.id,
            isElective: true,
          };
        });

      setGrades([...primaryEntries, ...electiveEntries]);
    } finally { setLoading(false); }
  }, [selModule, selSubject, selCourse, configs, sessionMaxMarks]);

  useEffect(() => { if (selSubject) loadGrades(); }, [selSubject]);

  const updateEntry = (idx: number, field: keyof GradeEntry, value: string) => {
    setGrades(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "marksObtained" && value !== "") {
        const maxM = parseFloat(sessionMaxMarks) || 100;
        const { gradeLabel, gradePoint } = computeGrade(parseFloat(value), maxM, configs);
        next[idx].gradeLabel = gradeLabel;
        next[idx].gradePoint = String(gradePoint);
      }
      return next;
    });
  };

  const saveAll = async (targetStatus?: string) => {
    setSaving(true);
    const gradedBy = pb.authStore.record?.id;
    const maxM = parseFloat(sessionMaxMarks) || 100;
    try {
      for (const entry of grades) {
        if (entry.marksObtained === "") continue;
        if (entry.gradingStatus === "locked" && !targetStatus) continue;

        // Build base payload — conditionally use enrollment or subject_registration
        const base: Record<string, any> = {
          student:       entry.studentId,
          course:        selCourse,
          module:        selModule,
          subject:       selSubject,
          marksObtained: parseFloat(entry.marksObtained),
          maxMarks:      maxM,
          gradeLabel:    entry.gradeLabel,
          gradePoint:    parseFloat(entry.gradePoint) || 0,
          remarks:       entry.remarks,
          gradingStatus: targetStatus || entry.gradingStatus,
          gradedBy,
        };

        if (entry.isElective && entry.subjectRegistrationId) {
          // Cross-registered student: use subject_registration; enrollment is omitted
          base.subject_registration = entry.subjectRegistrationId;
        } else {
          // Primary module-enrolled student
          base.enrollment = entry.enrollmentId;
        }

        if (entry.id) await pb.collection("grade_records").update(entry.id, base);
        else          await pb.collection("grade_records").create(base);
      }
      await loadGrades();
      if (targetStatus === "locked") {
        await checkAndAutoComplete();
      }
    } catch (err: any) { alert(err.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const visible = search ? grades.filter(g => g.studentName.toLowerCase().includes(search.toLowerCase())) : grades;
  const subjectData = subjects.find(s => s.id === selSubject);
  const ordinal = (n: number) => ["First","Second","Third","Fourth","Fifth"][n-1] || `Year ${n}`;

  const electiveCount  = grades.filter(g => g.isElective).length;
  const primaryCount   = grades.filter(g => !g.isElective).length;

  return (
    <PortalLayout role="admin">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="font-heading font-bold text-2xl text-primary mb-1">Grade Management</h2>
          <p className="text-text-muted text-sm">
            Only terms with <span className="font-semibold text-green-700">Finish</span> status appear here.
            Both module-enrolled and elective-registered students appear for each subject.
          </p>
        </div>

        {/* Cascading filters */}
        <div className="bg-surface border border-border rounded-lg p-5 mb-6">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Select Scope</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="label">Degree</label>
              <select value={selDegree} onChange={e => setSelDegree(e.target.value)} className="input-field">
                <option value="">— Degree —</option>
                {degrees.map(d => <option key={d.id} value={d.id}>{d.degreeName} ({d.academic_year})</option>)}
              </select></div>
            <div><label className="label">Course</label>
              <select value={selCourse} onChange={e => setSelCourse(e.target.value)} disabled={!selDegree} className="input-field disabled:opacity-50">
                <option value="">— Course —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.courseName}{c.year_level ? ` (${ordinal(c.year_level)} Yr)` : ""}</option>)}
              </select></div>
            <div><label className="label">Term <span className="text-green-600 font-normal">(Finish only)</span></label>
              <select value={selModule} onChange={e => setSelModule(e.target.value)} disabled={!selCourse} className="input-field disabled:opacity-50">
                <option value="">— Term —</option>
                {modules.map(m => <option key={m.id} value={m.id}>T{m.moduleOrder}: {m.moduleName}</option>)}
              </select></div>
            <div><label className="label">Subject</label>
              <select value={selSubject} onChange={e => setSelSubject(e.target.value)} disabled={!selModule} className="input-field disabled:opacity-50">
                <option value="">— Subject —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
              </select></div>
          </div>
        </div>

        {selSubject ? (
          <>
            {/* Grade entry header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <p className="font-semibold text-primary">{subjectData?.subjectName}</p>
                <p className="text-xs text-text-muted">
                  {subjectData?.teacher_name ? `Teacher: ${subjectData.teacher_name}  ·  ` : ""}
                  {primaryCount} primary enrolled
                  {electiveCount > 0 && <span className="text-yellow-700 font-semibold"> · {electiveCount} elective registered</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 border border-border rounded-md px-3 bg-surface">
                <span className="text-xs text-text-muted whitespace-nowrap">Max Marks:</span>
                <input type="number" min="1" value={sessionMaxMarks} onChange={e => setSessionMaxMarks(e.target.value)}
                  className="w-16 py-1.5 text-sm bg-transparent focus:outline-none font-semibold text-primary"/>
              </div>
              <div className="flex items-center gap-2 border border-border rounded-md px-3 bg-surface">
                <Search size={14} className="text-text-muted shrink-0"/>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student…" className="py-1.5 text-sm bg-transparent focus:outline-none"/>
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveAll()} disabled={saving} className="bg-secondary hover:bg-secondary/80 text-white px-3 py-2 rounded-md text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"><Save size={14}/>{saving ? "Saving…" : "Save Draft"}</button>
                <button onClick={() => saveAll("published")} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"><Send size={14}/>Publish</button>
                <button onClick={() => saveAll("locked")} disabled={saving} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"><Lock size={14}/>Lock</button>
              </div>
            </div>

            {loading ? <p className="text-center text-text-muted py-10">Loading grades…</p> : visible.length === 0 ? (
              <div className="text-center py-10 border border-border rounded-lg bg-surface">
                <BarChart3 size={44} className="mx-auto text-text-muted/30 mb-3"/>
                <p className="text-text-muted">No students enrolled in this subject</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden bg-surface">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-primary text-white">
                      <th className="text-left px-5 py-3">Student</th>
                      <th className="text-left px-5 py-3">Student ID</th>
                      <th className="text-center px-5 py-3">Marks / {sessionMaxMarks}</th>
                      <th className="text-center px-5 py-3">Grade</th>
                      <th className="text-center px-5 py-3">GPA</th>
                      <th className="text-left px-5 py-3">Remarks</th>
                      <th className="text-center px-5 py-3">Status</th>
                    </tr></thead>
                    <tbody>{visible.map((g, idx) => (
                      <tr key={g.studentId} className={`border-b border-border last:border-0 hover:bg-bg transition-colors ${g.isElective ? "bg-yellow-50/20" : ""}`}>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-primary">{g.studentName}</p>
                          {g.isElective && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-300 rounded">🟡 Elective</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-text-muted font-mono text-xs">{g.studentCode}</td>
                        <td className="px-5 py-3 text-center">
                          {g.gradingStatus === "locked" ? <span className="font-bold">{g.marksObtained || "—"}</span> : (
                            <input type="number" min="0" max={sessionMaxMarks} value={g.marksObtained}
                              onChange={e => updateEntry(idx, "marksObtained", e.target.value)}
                              className="w-20 text-center border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-accent"/>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${g.gradeLabel?.startsWith("A") ? "bg-green-100 text-green-800 border-green-300" : g.gradeLabel === "F" || g.gradeLabel === "—" ? "bg-red-100 text-red-800 border-red-300" : "bg-blue-100 text-blue-800 border-blue-300"}`}>{g.gradeLabel || "—"}</span>
                        </td>
                        <td className="px-5 py-3 text-center font-semibold text-secondary">{g.gradePoint !== "" ? parseFloat(g.gradePoint).toFixed(2) : "—"}</td>
                        <td className="px-5 py-3">
                          {g.gradingStatus === "locked" ? g.remarks : (
                            <input value={g.remarks} onChange={e => updateEntry(idx, "remarks", e.target.value)}
                              className="w-full border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-accent" placeholder="Optional…"/>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusStyle[g.gradingStatus] || statusStyle.draft}`}>{g.gradingStatus}</span>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 border border-border rounded-lg bg-surface">
            <BarChart3 size={48} className="mx-auto text-text-muted/30 mb-4"/>
            <p className="text-primary font-semibold mb-1">Select a Subject to Manage Grades</p>
            <p className="text-sm text-text-muted">Degree → Course → Term (Finish) → Subject</p>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default AdminGradeManagement;
