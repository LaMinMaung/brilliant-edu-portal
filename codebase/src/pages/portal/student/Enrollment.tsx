import React, { useEffect, useState } from "react";
import {
  CheckCircle, Lock, Clock, Layers, X, Hourglass, AlertCircle,
  ChevronDown, GraduationCap, BookOpen, PlusCircle,
} from "lucide-react";
import pb from "../../../lib/pocketbase";
import { logActivity } from "../../../lib/logActivity";
import PortalLayout from "../../../components/PortalLayout";

/* ── Helpers ──────────────────────────────────────────────── */
const todayDate = (): Date => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const parseDate = (s: string): Date => { const d = new Date(s.slice(0, 10)); d.setHours(0, 0, 0, 0); return d; };
const ordinalYear = (n: number) =>
  ["First","Second","Third","Fourth","Fifth","Sixth","Seventh","Eighth"][n - 1] || `Year ${n}`;

/* ── Types ────────────────────────────────────────────────── */
interface CourseEntry { course: any; modules: any[]; }
interface YearGroup {
  year: number;
  courses: CourseEntry[];
  isComplete: boolean;
  isLocked: boolean;
}

/* ── Classification helpers ── */
const classStyle = (c: string) =>
  c === "mandatory" ? "bg-red-100 text-red-700 border-red-300" : "bg-yellow-100 text-yellow-700 border-yellow-300";
const classIcon = (c: string) => c === "mandatory" ? "🔴" : "🟡";

const regStatusStyle: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-300",
  active:    "bg-blue-100 text-blue-800 border-blue-300",
  passed:    "bg-green-100 text-green-800 border-green-300",
  failed:    "bg-red-100 text-red-800 border-red-300",
  withdrawn: "bg-gray-100 text-gray-700 border-gray-300",
  dropped:   "bg-gray-100 text-gray-700 border-gray-300",
};

/* ── Component ────────────────────────────────────────────── */
const StudentEnrollment: React.FC = () => {
  /* ── Primary degree enrollment state ── */
  const [degreeInfo, setDegreeInfo]           = useState<any>(null);
  const [yearGroups, setYearGroups]           = useState<YearGroup[]>([]);
  const [allEnrollments, setAllEnrollments]   = useState<any[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [expandedYears, setExpandedYears]     = useState<Set<number>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling]             = useState<string | null>(null);

  /* Subject modal */
  const [modalMod, setModalMod]         = useState<any | null>(null);
  const [modalCourse, setModalCourse]   = useState<any | null>(null);
  const [subjects, setSubjects]         = useState<any[]>([]);
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [loadingSubs, setLoadingSubs]   = useState(false);

  /* ── Elective subjects state ── */
  const [electivePlacements, setElectivePlacements]       = useState<any[]>([]);
  const [electiveRegistrations, setElectiveRegistrations] = useState<any[]>([]);
  const [electiveLoading, setElectiveLoading]             = useState(false);
  const [registeringElective, setRegisteringElective]     = useState<string | null>(null);

  /* ── Load elective placements for this degree ── */
  const loadElectives = async (degreeId: string) => {
    const studentId = pb.authStore.record?.id;
    setElectiveLoading(true);
    try {
      const [placements, registrations] = await Promise.all([
        pb.collection("curriculum_subjects").getFullList({
          filter: `degree = "${degreeId}" && status = "active"`,
          expand: "subject",
          sort: "module_label,classification",
          requestKey: null,
        }),
        pb.collection("subject_registrations").getFullList({
          filter: `student = "${studentId}"`,
          requestKey: null,
        }),
      ]);
      setElectivePlacements(placements);
      setElectiveRegistrations(registrations);
    } catch (err) { console.error(err); }
    finally { setElectiveLoading(false); }
  };

  /* ── Primary degree data loading ── */
  const load = async () => {
    setLoading(true);
    const studentId = pb.authStore.record?.id;
    try {
      const me = await pb.collection("users").getOne(studentId!, {
        expand: "assignedDegree,assignedCourse,assignedCourse.degree",
        requestKey: null,
      });

      const degree =
        me.expand?.assignedDegree ||
        me.expand?.assignedCourse?.expand?.degree;

      if (!degree) { setLoading(false); return; }
      setDegreeInfo(degree);

      const [allCourses, enrs] = await Promise.all([
        pb.collection("academic_courses").getFullList({
          filter: `degree = "${degree.id}"`,
          sort: "year_level,courseName",
          requestKey: null,
        }),
        pb.collection("module_enrollments").getFullList({
          filter: `student = "${studentId}"`,
          requestKey: null,
        }),
      ]);
      setAllEnrollments(enrs);

      if (allCourses.length === 0) { setLoading(false); return; }

      const courseIds = allCourses.map(c => c.id);
      const mFilter   = courseIds.map(id => `course = "${id}"`).join(" || ");
      const openModules = await pb.collection("academic_modules").getFullList({
        filter: `(${mFilter}) && (status = "ongoing" || status = "upcoming")`,
        sort: "moduleOrder",
        requestKey: null,
      });

      const modsByCourse = new Map<string, any[]>();
      openModules.forEach(m => {
        if (!modsByCourse.has(m.course)) modsByCourse.set(m.course, []);
        modsByCourse.get(m.course)!.push(m);
      });

      const yearMap = new Map<number, any[]>();
      allCourses.forEach(c => {
        const yr = c.year_level || 1;
        if (!yearMap.has(yr)) yearMap.set(yr, []);
        yearMap.get(yr)!.push(c);
      });

      const sortedYears = Array.from(yearMap.keys()).sort((a, b) => a - b);
      const groups: YearGroup[] = sortedYears.map((yr, idx) => {
        const yrCourses   = yearMap.get(yr)!;
        const isComplete  = yrCourses.every(c => c.status === "completed");
        let isLocked = false;
        if (idx > 0) {
          const prevYrCourses = yearMap.get(sortedYears[idx - 1])!;
          isLocked = !prevYrCourses.every(c => c.status === "completed");
        }
        const courses: CourseEntry[] = yrCourses.map(c => ({
          course:  c,
          modules: modsByCourse.get(c.id) || [],
        }));
        return { year: yr, courses, isComplete, isLocked };
      });

      setYearGroups(groups);

      const firstOpen = groups.find(g => !g.isLocked);
      if (firstOpen) {
        setExpandedYears(new Set([firstOpen.year]));
        setExpandedCourses(new Set(
          firstOpen.courses.filter(ce => ce.modules.length > 0).map(ce => ce.course.id)
        ));
      }

      // Load elective placements for this degree
      await loadElectives(degree.id);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  /* ── UI toggles ── */
  const toggleYear = (yr: number) =>
    setExpandedYears(p => { const n = new Set(p); n.has(yr) ? n.delete(yr) : n.add(yr); return n; });
  const toggleCourse = (id: string) =>
    setExpandedCourses(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  /* ── Term helpers ── */
  const getEnrolStatus = (modId: string) =>
    allEnrollments.find(e => e.module === modId)?.status || null;

  const isBeforeStart = (mod: any) =>
    mod.start_date ? todayDate() < parseDate(mod.start_date) : false;
  const isAfterEnd = (mod: any) =>
    mod.end_date ? todayDate() > parseDate(mod.end_date) : false;

  const isTermEnrollable = (mod: any, courseModules: any[]): boolean => {
    if (getEnrolStatus(mod.id)) return false;
    if (isBeforeStart(mod))     return false;
    if (isAfterEnd(mod))        return false;
    const idx = courseModules.findIndex(m => m.id === mod.id);
    if (idx === 0) return true;
    return getEnrolStatus(courseModules[idx - 1].id) === "completed";
  };

  const getTermLockReason = (mod: any, courseModules: any[]): string => {
    if (isBeforeStart(mod)) return `Opens on ${mod.start_date.slice(0, 10)}`;
    if (isAfterEnd(mod))    return `Enrollment closed — ended ${mod.end_date.slice(0, 10)}`;
    const idx = courseModules.findIndex(m => m.id === mod.id);
    if (idx > 0) return `Complete Term ${idx} first to unlock`;
    return "Locked";
  };

  /* ── Subject modal ── */
  const openSubjectModal = async (mod: any, course: any) => {
    setModalMod(mod); setModalCourse(course);
    setSelected(new Set()); setLoadingSubs(true);
    try {
      const subs = await pb.collection("academic_subjects").getFullList({
        filter: `module = "${mod.id}" && status = "active"`,
        sort: "subjectType,subjectCode",
        requestKey: null,
      });
      setSubjects(subs);
      setSelected(new Set(
        subs.filter((s: any) => s.subjectType === "mandatory").map((s: any) => s.id)
      ));
    } catch (err) { console.error(err); }
    finally { setLoadingSubs(false); }
  };

  const closeModal = () => { setModalMod(null); setModalCourse(null); };

  const toggleSubject = (id: string, type: string) => {
    if (type === "mandatory") return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleConfirmEnroll = async () => {
    if (!modalMod || !modalCourse) return;
    const studentId = pb.authStore.record?.id;
    setEnrolling(modalMod.id);
    try {
      await pb.collection("module_enrollments").create({
        student: studentId,
        module: modalMod.id,
        course: modalCourse.id,
        status: "pending",
        enrolledDate: new Date().toISOString().slice(0, 10),
        selected_subjects: Array.from(selected),
      });
      await logActivity(
        "enrollment_request",
        `Requested enrollment in term: ${modalMod.moduleName} (${modalCourse.courseName})`
      );
      closeModal();
      await load();
    } catch (err: any) { alert(err.message || "Enrollment failed"); }
    finally { setEnrolling(null); }
  };

  /* ── Elective subject helpers ── */
  const getRegForCs = (csId: string) =>
    electiveRegistrations.find(r => r.curriculum_subject === csId);

  const getRegStatus = (csId: string): string | null =>
    getRegForCs(csId)?.status || null;

  const canRegister = (csId: string): boolean => {
    const status = getRegStatus(csId);
    return !status || status === "failed" || status === "withdrawn" || status === "dropped";
  };

  const registerElective = async (cs: any) => {
    const studentId = pb.authStore.record?.id;
    setRegisteringElective(cs.id);
    try {
      await pb.collection("subject_registrations").create({
        student:            studentId,
        curriculum_subject: cs.id,
        subject:            cs.expand?.subject?.id || cs.subject,
        status:             "pending",
      });
      await logActivity("subject_registration", `Requested registration for: ${cs.expand?.subject?.subjectName || "subject"}`);
      await loadElectives(degreeInfo.id);
    } catch (err: any) { alert(err.message || "Registration failed"); }
    finally { setRegisteringElective(null); }
  };

  /* Group electives by module_label */
  const electiveGroups: Record<string, any[]> = {};
  for (const cs of electivePlacements) {
    const label = cs.module_label || "Elective Subjects";
    if (!electiveGroups[label]) electiveGroups[label] = [];
    electiveGroups[label].push(cs);
  }

  const subjectNo    = modalMod?.subject_no || 0;
  const meetsMinimum = subjectNo > 0 ? selected.size >= subjectNo : selected.size > 0;

  /* ── Render ── */
  return (
    <PortalLayout role="student">
      <div className="max-w-4xl mx-auto">

        {/* Page header */}
        <div className="mb-8">
          <h2 className="font-heading font-bold text-2xl text-primary mb-1">Term Enrollment</h2>
          {degreeInfo ? (
            <p className="text-text-muted text-sm">
              <span className="font-semibold text-primary">{degreeInfo.degreeName}</span>
              {" · "}Progress year-by-year — complete all courses in a year to unlock the next
            </p>
          ) : (
            !loading && <p className="text-text-muted text-sm">No degree assigned. Contact your academic advisor.</p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
            <p className="text-text-muted">Loading enrollment data…</p>
          </div>
        ) : !degreeInfo ? (
          <div className="text-center py-16 border border-border rounded-xl bg-surface">
            <GraduationCap size={48} className="mx-auto text-text-muted/30 mb-4"/>
            <p className="text-primary font-semibold">No degree assigned.</p>
            <p className="text-sm text-text-muted mt-1">Contact your academic advisor to get started.</p>
          </div>
        ) : (
          <>
            {/* ── Year groups ── */}
            {yearGroups.length === 0 ? (
              <div className="text-center py-16 border border-border rounded-xl bg-surface mb-8">
                <Layers size={48} className="mx-auto text-text-muted/30 mb-4"/>
                <p className="text-primary font-semibold">No courses found in your degree program.</p>
              </div>
            ) : (
              <div className="space-y-5 mb-10">
                {yearGroups.map((yg) => {
                  const isYrExpanded   = expandedYears.has(yg.year);
                  const completedCount = yg.courses.filter(ce => ce.course.status === "completed").length;

                  return (
                    <div
                      key={yg.year}
                      className={`border rounded-xl overflow-hidden transition-colors ${
                        yg.isLocked   ? "border-gray-200"   :
                        yg.isComplete ? "border-green-300"  :
                                        "border-border"
                      }`}
                    >
                      {/* ── Year header ── */}
                      <button
                        onClick={() => !yg.isLocked && toggleYear(yg.year)}
                        disabled={yg.isLocked}
                        className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors ${
                          yg.isLocked   ? "bg-gray-50 cursor-default"               :
                          yg.isComplete ? "bg-green-50 hover:bg-green-100/60"       :
                                          "bg-surface hover:bg-bg"
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border-2 ${
                          yg.isLocked   ? "bg-gray-100 border-gray-300 text-gray-400"        :
                          yg.isComplete ? "bg-green-100 border-green-400 text-green-700"     :
                                          "bg-primary border-primary text-white"
                        }`}>
                          {yg.isLocked ? <Lock size={16}/> : yg.isComplete ? <CheckCircle size={16}/> : yg.year}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-heading font-bold text-lg ${yg.isLocked ? "text-gray-400" : "text-primary"}`}>
                              {ordinalYear(yg.year)} Year
                            </h3>
                            {yg.isComplete && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 border border-green-300 rounded-full text-xs font-semibold">
                                All Complete ✓
                              </span>
                            )}
                          </div>
                          <p className={`text-xs mt-0.5 ${yg.isLocked ? "text-gray-400" : "text-text-muted"}`}>
                            {yg.isLocked
                              ? `⚠ Complete ${ordinalYear(yg.year - 1)} Year first · ${yg.courses.length} course${yg.courses.length > 1 ? "s" : ""} unavailable`
                              : `${completedCount} of ${yg.courses.length} course${yg.courses.length > 1 ? "s" : ""} completed`
                            }
                          </p>
                        </div>
                        {!yg.isLocked && (
                          <ChevronDown size={18} className={`text-text-muted transition-transform shrink-0 ${isYrExpanded ? "rotate-180" : ""}`}/>
                        )}
                      </button>

                      {yg.isLocked && (
                        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/70">
                          <div className="flex flex-wrap gap-2">
                            {yg.courses.map(ce => (
                              <span key={ce.course.id}
                                className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                                <BookOpen size={11}/>{ce.course.courseName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {isYrExpanded && !yg.isLocked && (
                        <div className="border-t border-border divide-y divide-border/70">
                          {yg.courses.map(ce => {
                            const isCourseExpanded = expandedCourses.has(ce.course.id);
                            const hasMods = ce.modules.length > 0;

                            return (
                              <div key={ce.course.id}>
                                <button
                                  onClick={() => hasMods && toggleCourse(ce.course.id)}
                                  disabled={!hasMods}
                                  className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors bg-surface ${hasMods ? "hover:bg-bg cursor-pointer" : "cursor-default"}`}
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ce.course.status === "completed" ? "bg-green-100" : "bg-accent/10"}`}>
                                    {ce.course.status === "completed"
                                      ? <CheckCircle size={15} className="text-green-600"/>
                                      : <BookOpen size={15} className="text-primary"/>
                                    }
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-semibold text-primary">{ce.course.courseName}</p>
                                      <span className="text-xs font-mono text-text-muted">{ce.course.courseCode}</span>
                                      {ce.course.status === "completed" && (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 border border-green-300 rounded-full text-xs font-semibold">Completed</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-text-muted mt-0.5">
                                      {hasMods ? `${ce.modules.length} open term${ce.modules.length > 1 ? "s" : ""} available` : "No open terms currently"}
                                      {ce.course.credits > 0 ? ` · ${ce.course.credits} credits` : ""}
                                    </p>
                                  </div>
                                  {hasMods && (
                                    <ChevronDown size={15} className={`text-text-muted transition-transform shrink-0 ${isCourseExpanded ? "rotate-180" : ""}`}/>
                                  )}
                                </button>

                                {isCourseExpanded && hasMods && (
                                  <div className="bg-bg px-6 py-4 space-y-3 border-t border-border/50">
                                    {ce.modules.map(mod => {
                                      const status      = getEnrolStatus(mod.id);
                                      const enrollable  = isTermEnrollable(mod, ce.modules);
                                      const beforeStart = isBeforeStart(mod);
                                      const afterEnd    = isAfterEnd(mod);
                                      const isLocked    = !status && !enrollable;
                                      const enrolRec    = allEnrollments.find(e => e.module === mod.id);
                                      const selectedSubs: string[] = enrolRec?.selected_subjects || [];

                                      return (
                                        <div
                                          key={mod.id}
                                          className={`border rounded-xl p-4 bg-surface transition-colors ${isLocked ? "opacity-55 border-border" : "border-border hover:border-accent/40"}`}
                                        >
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${isLocked ? "bg-gray-100 text-gray-400" : "bg-accent/10 text-primary"}`}>
                                                {mod.moduleOrder}
                                              </div>
                                              <div>
                                                <p className="font-semibold text-sm text-primary">{mod.moduleName}</p>
                                                <div className="flex flex-wrap gap-2 mt-1 text-xs text-text-muted">
                                                  {mod.start_date && <span>Start: {mod.start_date.slice(0, 10)}</span>}
                                                  {mod.end_date   && <span>End: {mod.end_date.slice(0, 10)}</span>}
                                                  {mod.subject_no > 0 && (
                                                    <span className="font-semibold text-primary">Min. {mod.subject_no} subjects required</span>
                                                  )}
                                                </div>
                                                {selectedSubs.length > 0 && (
                                                  <p className="text-xs text-green-700 mt-1">
                                                    {selectedSubs.length} subject{selectedSubs.length > 1 ? "s" : ""} enrolled
                                                  </p>
                                                )}
                                              </div>
                                            </div>

                                            <div className="shrink-0 flex items-center">
                                              {status === "completed" && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 border border-green-300 rounded-full text-xs font-bold">
                                                  <CheckCircle size={11}/>Completed
                                                </span>
                                              )}
                                              {status === "active" && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-xs font-bold">
                                                  <Clock size={11}/>In Progress
                                                </span>
                                              )}
                                              {status === "pending" && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-full text-xs font-bold">
                                                  <Hourglass size={11}/>Pending
                                                </span>
                                              )}
                                              {status === "failed" && (
                                                <span className="px-2.5 py-1 bg-red-100 text-red-800 border border-red-300 rounded-full text-xs font-bold">Failed</span>
                                              )}
                                              {afterEnd && !status && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-bold">
                                                  <AlertCircle size={11}/>Closed
                                                </span>
                                              )}
                                              {beforeStart && !status && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-xs font-bold">
                                                  <Lock size={11}/>Not Open Yet
                                                </span>
                                              )}
                                              {isLocked && !beforeStart && !afterEnd && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-500 border border-gray-300 rounded-full text-xs font-bold">
                                                  <Lock size={11}/>Locked
                                                </span>
                                              )}
                                              {enrollable && !status && (
                                                <button
                                                  onClick={() => openSubjectModal(mod, ce.course)}
                                                  disabled={enrolling === mod.id}
                                                  className="px-3 py-1.5 bg-accent hover:bg-accent-light text-primary font-bold rounded-lg text-xs transition-colors disabled:opacity-60"
                                                >
                                                  {enrolling === mod.id ? "…" : "Enroll"}
                                                </button>
                                              )}
                                            </div>
                                          </div>

                                          {isLocked && (
                                            <p className="text-xs text-text-muted mt-2 pl-11 flex items-center gap-1">
                                              <Lock size={10}/>{getTermLockReason(mod, ce.modules)}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Elective Subjects Section ── */}
            {!electiveLoading && electivePlacements.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2 pb-3 border-b border-border">
                  <PlusCircle size={17} className="text-primary"/>
                  <h3 className="font-heading font-semibold text-lg text-primary">Elective Subjects</h3>
                </div>
                <p className="text-sm text-text-muted mb-5">
                  These subjects are available to your curriculum through registration. Your primary degree will not change.
                  Registrations require admin approval before you are officially enrolled.
                </p>

                {Object.entries(electiveGroups).map(([groupLabel, placements]) => (
                  <div key={groupLabel} className="mb-6">
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{groupLabel}</h4>
                    <div className="space-y-3">
                      {placements.map(cs => {
                        const sub       = cs.expand?.subject;
                        const regStatus = getRegStatus(cs.id);
                        const eligible  = canRegister(cs.id);
                        const isMandatory = cs.classification === "mandatory";

                        return (
                          <div key={cs.id} className={`border rounded-xl p-4 bg-surface transition-colors ${regStatus === "active" ? "border-blue-300" : regStatus === "passed" ? "border-green-300" : "border-border hover:border-accent/40"}`}>
                            <div className="flex items-center gap-3">
                              {/* Classification colour bar */}
                              <div className={`w-1 h-12 rounded-full shrink-0 ${isMandatory ? "bg-red-400" : "bg-yellow-400"}`}/>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-sm text-primary">{sub?.subjectName || "—"}</p>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${classStyle(cs.classification)}`}>
                                    {classIcon(cs.classification)} {cs.classification}
                                  </span>
                                </div>
                                <p className="text-xs text-text-muted mt-0.5">
                                  {sub?.subjectCode && <span className="font-mono">{sub.subjectCode}</span>}
                                  {sub?.credit_no ? <span> · {sub.credit_no} credits</span> : null}
                                  {sub?.teacher_name ? <span> · {sub.teacher_name}</span> : null}
                                </p>
                              </div>

                              {/* Status / action */}
                              <div className="shrink-0">
                                {!regStatus && eligible && (
                                  <button onClick={() => registerElective(cs)} disabled={registeringElective === cs.id}
                                    className="px-3 py-1.5 bg-accent hover:bg-accent-light text-primary font-bold rounded-lg text-xs transition-colors disabled:opacity-60">
                                    {registeringElective === cs.id ? "…" : "Register"}
                                  </button>
                                )}
                                {regStatus && regStatus !== "failed" && regStatus !== "withdrawn" && regStatus !== "dropped" && (
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${regStatusStyle[regStatus] || ""}`}>
                                    {regStatus === "pending" && <Hourglass size={10} className="inline mr-1"/>}
                                    {regStatus === "active"  && <Clock    size={10} className="inline mr-1"/>}
                                    {regStatus === "passed"  && <CheckCircle size={10} className="inline mr-1"/>}
                                    {regStatus}
                                  </span>
                                )}
                                {(regStatus === "failed" || regStatus === "withdrawn" || regStatus === "dropped") && (
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${regStatusStyle[regStatus]}`}>{regStatus}</span>
                                    <button onClick={() => registerElective(cs)} disabled={registeringElective === cs.id}
                                      className="px-3 py-1.5 bg-accent hover:bg-accent-light text-primary font-bold rounded-lg text-xs transition-colors disabled:opacity-60">
                                      {registeringElective === cs.id ? "…" : "Re-Register"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty elective state */}
            {!electiveLoading && electivePlacements.length === 0 && degreeInfo && (
              <div className="mt-8 text-center py-10 border border-dashed border-border rounded-xl text-text-muted text-sm">
                No elective subjects are currently available for your curriculum.
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Subject Selection Modal (primary enrollment — unchanged) ── */}
      {modalMod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={closeModal}/>
          <div className="relative w-full max-w-lg max-h-[90vh] bg-bg rounded-xl border border-border overflow-hidden flex flex-col">

            <div className="px-6 py-4 border-b border-border bg-surface flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-heading font-bold text-lg text-primary">Select Subjects</h3>
                <p className="text-xs text-text-muted">{modalMod.moduleName} · {modalCourse?.courseName}</p>
              </div>
              <button onClick={closeModal} className="text-text-muted hover:text-primary"><X size={18}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingSubs ? (
                <p className="text-center text-text-muted py-8">Loading subjects…</p>
              ) : subjects.length === 0 ? (
                <p className="text-center text-text-muted py-8">No subjects configured for this term.</p>
              ) : (
                <>
                  {subjectNo > 0 && (
                    <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-semibold ${meetsMinimum ? "bg-accent/20 text-primary border border-accent" : "bg-surface border border-border text-text-muted"}`}>
                      {selected.size} subject{selected.size !== 1 ? "s" : ""} selected — minimum {subjectNo} required
                      {!meetsMinimum && <span className="text-red-600 font-normal"> · select {subjectNo - selected.size} more</span>}
                    </div>
                  )}
                  <div className="space-y-2">
                    {subjects.map(s => {
                      const isMandatory = s.subjectType === "mandatory";
                      const isSelected  = selected.has(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            isSelected ? "border-accent bg-accent/5" : "border-border bg-surface hover:border-accent/50"
                          } ${isMandatory ? "cursor-default" : "cursor-pointer"}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isMandatory}
                            onChange={() => toggleSubject(s.id, s.subjectType)}
                            className="w-4 h-4 accent-primary rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-primary">{s.subjectName}</p>
                            <p className="text-xs text-text-muted">
                              {s.subjectCode}
                              {s.teacher_name ? ` · ${s.teacher_name}` : ""}
                              {s.credit_no    ? ` · ${s.credit_no} credits` : ""}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${isMandatory ? "bg-red-100 text-red-700 border-red-300" : "bg-blue-100 text-blue-700 border-blue-300"}`}>
                            {s.subjectType}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="p-5 border-t border-border bg-surface shrink-0">
              <p className="text-xs text-text-muted mb-3">
                Mandatory subjects are pre-selected and required.{" "}
                {subjectNo > 0
                  ? `Select at least ${subjectNo} subjects total to confirm enrollment.`
                  : "Add any optional subjects you wish to take."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmEnroll}
                  disabled={!meetsMinimum || !!enrolling}
                  className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-2.5 rounded-lg transition-colors"
                >
                  {enrolling ? "Enrolling…" : `Confirm Enrollment (${selected.size} subject${selected.size !== 1 ? "s" : ""})`}
                </button>
                <button onClick={closeModal} className="px-5 py-2.5 border border-border rounded-lg text-text-muted hover:text-primary font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default StudentEnrollment;
