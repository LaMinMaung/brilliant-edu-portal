import React, { useEffect, useState } from "react";
import {
  CheckCircle, Lock, Clock, ChevronDown, BookOpen,
  Layers, Calendar, GraduationCap, User, Star, CheckCircle2,
  ArrowRightLeft, Building2, PlusCircle
} from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

/* ── Status config ─────────────────────────────────────────── */
const modStatusCfg: Record<string, { badge: string; label: string; icon: React.ReactNode; ring: string }> = {
  upcoming:  { badge: "bg-yellow-100 text-yellow-800 border-yellow-300",  label: "Upcoming",    icon: <Calendar size={12}/>,     ring: "border-yellow-400 bg-yellow-50" },
  ongoing:   { badge: "bg-blue-100 text-blue-800 border-blue-300",        label: "Ongoing",     icon: <Clock size={12}/>,         ring: "border-blue-400 bg-blue-50" },
  finish:    { badge: "bg-green-100 text-green-800 border-green-300",     label: "Finished",    icon: <CheckCircle size={12}/>,   ring: "border-green-400 bg-green-50" },
  graded:    { badge: "bg-purple-100 text-purple-800 border-purple-300",  label: "Graded",      icon: <CheckCircle size={12}/>,   ring: "border-purple-400 bg-purple-50" },
  locked:    { badge: "bg-gray-100 text-gray-400 border-gray-200",        label: "Locked",      icon: <Lock size={12}/>,          ring: "border-gray-200 bg-gray-50" },
  active:    { badge: "bg-blue-100 text-blue-800 border-blue-300",        label: "In Progress", icon: <Clock size={12}/>,         ring: "border-blue-400 bg-blue-50" },
  completed: { badge: "bg-green-100 text-green-800 border-green-300",     label: "Completed",   icon: <CheckCircle size={12}/>,   ring: "border-green-400 bg-green-50" },
};

const ordinal = (n: number) =>
  ["First","Second","Third","Fourth","Fifth","Sixth","Seventh","Eighth","Ninth","Tenth"][n-1] || `Year ${n}`;

/* ── Component ─────────────────────────────────────────────── */
const StudentMyCourses: React.FC = () => {
  const [degreeInfo, setDegreeInfo]         = useState<any>(null);
  const [courses, setCourses]               = useState<any[]>([]);
  const [modulesByCourse, setModulesByCourse] = useState<Map<string, any[]>>(new Map());
  const [enrollments, setEnrollments]       = useState<any[]>([]);
  const [gradedSubjectIds, setGradedSubjectIds] = useState<Set<string>>(new Set());
  const [loading, setLoading]               = useState(true);
  const [expanded, setExpanded]             = useState<Set<string>>(new Set());

  // Transfer credits state
  const [transferRecords, setTransferRecords]           = useState<any[]>([]);
  const [transferCoursesByRecord, setTransferCoursesByRecord] = useState<Map<string, any[]>>(new Map());
  const [transferLoading, setTransferLoading]           = useState(true);

  // Elective subject registrations state
  const [electiveRegs, setElectiveRegs]   = useState<any[]>([]);
  const [electiveLoading, setElectiveLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const studentId = pb.authStore.record?.id;
      try {
        // Resolve degree: assignedDegree first, fall back to assignedCourse.degree
        const me = await pb.collection("users").getOne(studentId!, {
          expand: "assignedDegree,assignedCourse,assignedCourse.degree",
          requestKey: null,
        });

        const degree     = me.expand?.assignedDegree || me.expand?.assignedCourse?.expand?.degree;
        const legacyCourse = me.expand?.assignedCourse;

        // Build the list of courses to display
        let allCourses: any[] = [];
        if (degree) {
          setDegreeInfo(degree);
          allCourses = await pb.collection("academic_courses").getFullList({
            filter: `degree = "${degree.id}"`,
            sort: "year_level,courseName",
            requestKey: null,
          });
        } else if (legacyCourse) {
          // Legacy: single course with no degree
          allCourses = [legacyCourse];
        }

        if (allCourses.length === 0) { setLoading(false); return; }

        const courseIds = allCourses.map((c: any) => c.id);
        const courseFilter = courseIds.map((id: string) => `course = "${id}"`).join(" || ");

        // Enrollments and modules for all courses in parallel
        const [allEnrollments, allMods] = await Promise.all([
          pb.collection("module_enrollments").getFullList({
            filter: `student = "${studentId}" && (${courseFilter})`,
            requestKey: null,
          }),
          pb.collection("academic_modules").getFullList({
            filter: courseFilter,
            sort: "course,moduleOrder",
            requestKey: null,
          }),
        ]);

        // Subjects + grade records
        let allSubs: any[]    = [];
        let gradeRecs: any[]  = [];
        if (allMods.length > 0) {
          const modFilter = allMods.map((m: any) => `module = "${m.id}"`).join(" || ");
          [allSubs, gradeRecs] = await Promise.all([
            pb.collection("academic_subjects").getFullList({
              filter: modFilter,
              sort: "module,subjectType,subjectCode",
              requestKey: null,
            }),
            pb.collection("grade_records").getFullList({
              filter: `student = "${studentId}" && (${courseFilter}) && gradingStatus = "published"`,
              fields: "subject",
              requestKey: null,
            }),
          ]);
        }

        // Attach subjects to each module
        allMods.forEach((m: any) => { m._subjects = allSubs.filter((s: any) => s.module === m.id); });

        // Group modules by course
        const modMap = new Map<string, any[]>();
        courseIds.forEach((id: string) =>
          modMap.set(id, allMods.filter((m: any) => m.course === id))
        );

        setGradedSubjectIds(new Set(gradeRecs.map((r: any) => r.subject)));
        setCourses(allCourses);
        setModulesByCourse(modMap);
        setEnrollments(allEnrollments);

        // Auto-expand the first non-locked term across all courses
        const autoOpen = new Set<string>();
        for (const c of allCourses) {
          const mods = modMap.get(c.id) || [];
          const first = mods.find((m: any, i: number) => {
            if (i === 0) return true;
            const prev = allEnrollments.find((e: any) => e.module === mods[i - 1].id);
            return prev?.status === "completed";
          });
          if (first) { autoOpen.add(first.id); break; }
        }
        if (autoOpen.size > 0) setExpanded(autoOpen);

      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  /* Fetch approved transfer records for this student (independent of BEI data) */
  useEffect(() => {
    const studentId = pb.authStore.record?.id;
    if (!studentId) { setTransferLoading(false); return; }
    (async () => {
      try {
        const recs = await pb.collection("transfer_records").getFullList({
          filter: `student = "${studentId}" && status = "approved"`,
          sort: "institution", requestKey: null,
        });
        setTransferRecords(recs);
        if (recs.length === 0) { setTransferLoading(false); return; }
        const filter = recs.map((r: any) => `transfer_record = "${r.id}"`).join(" || ");
        const crs = await pb.collection("transfer_courses").getFullList({
          filter, sort: "transfer_record,course_name", requestKey: null,
        });
        const map = new Map<string, any[]>();
        recs.forEach((r: any) => map.set(r.id, crs.filter((c: any) => c.transfer_record === r.id)));
        setTransferCoursesByRecord(map);
      } catch { /* show empty state if collection doesn't exist yet */ }
      finally { setTransferLoading(false); }
    })();
  }, []);

  /* Fetch elective subject registrations */
  useEffect(() => {
    const studentId = pb.authStore.record?.id;
    if (!studentId) { setElectiveLoading(false); return; }
    (async () => {
      try {
        const regs = await pb.collection("subject_registrations").getFullList({
          filter: `student = "${studentId}"`,
          expand: "curriculum_subject,subject",
          sort: "-created",
          requestKey: null,
        });
        setElectiveRegs(regs);
      } catch { /* collection may not exist in older deployments */ }
      finally { setElectiveLoading(false); }
    })();
  }, []);

  const getEnrolStatus = (modId: string) =>
    enrollments.find((e: any) => e.module === modId)?.status ?? null;

  const getDisplayStatus = (mod: any, idx: number, courseMods: any[]): string => {
    const enrol = getEnrolStatus(mod.id);
    if (mod.status === "graded" || mod.status === "finish") return mod.status;
    if (enrol) return enrol === "active" ? "ongoing" : enrol;
    if (idx > 0) {
      const prevEnrol = getEnrolStatus(courseMods[idx - 1].id);
      if (!prevEnrol || prevEnrol !== "completed") return "locked";
    }
    return mod.status;
  };

  const toggle = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <PortalLayout role="student">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="font-heading font-bold text-2xl text-primary mb-1">My Courses</h2>
          <p className="text-text-muted text-sm">
            {degreeInfo ? `${degreeInfo.degreeName} — your term progression` : "Your assigned course and term progression"}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
            <p className="text-text-muted">Loading your courses…</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 border border-border rounded-xl bg-surface">
            <BookOpen size={52} className="mx-auto text-text-muted/25 mb-4"/>
            <p className="text-primary font-semibold text-lg mb-1">No Active Course</p>
            <p className="text-sm text-text-muted">Contact your academic advisor to get started.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {courses.map(course => {
              const courseMods       = modulesByCourse.get(course.id) || [];
              const courseEnrollments = enrollments.filter((e: any) => e.course === course.id);
              const completedCount   = courseEnrollments.filter((e: any) => e.status === "completed").length;
              const enrolledCount    = courseEnrollments.filter((e: any) => e.status === "active").length;
              const progressPct      = courseMods.length > 0
                ? Math.round((completedCount / courseMods.length) * 100) : 0;
              const isCourseCompleted =
                course.status === "completed" &&
                courseEnrollments.filter((e: any) => e.status === "active" || e.status === "pending").length === 0;

              return (
                <div key={course.id}>
                  {/* ── Course Card ── */}
                  <div className="border border-border rounded-xl bg-surface mb-6 overflow-hidden">
                    <div className="bg-primary px-6 py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-xs font-bold text-accent/80 uppercase tracking-widest">{course.courseCode}</span>
                          <h3 className="font-heading font-bold text-xl text-white mt-1">{course.courseName}</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-white/60">
                            {course.year_level && (
                              <span className="flex items-center gap-1.5"><GraduationCap size={13}/>{ordinal(course.year_level)} Year</span>
                            )}
                            {course.academic_year && (
                              <span className="flex items-center gap-1.5"><Calendar size={13}/>{course.academic_year}</span>
                            )}
                          </div>
                        </div>
                        {course.credits > 0 && (
                          <span className="shrink-0 px-3 py-1.5 bg-accent text-primary text-sm font-bold rounded-full">{course.credits} cr</span>
                        )}
                      </div>
                    </div>

                    {isCourseCompleted ? (
                      <div className="px-6 py-6 text-center">
                        <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3"/>
                        <p className="font-semibold text-primary mb-1">Course Completed</p>
                        <a href="/portal/student/grades" className="text-sm text-accent hover:underline">View Grades →</a>
                      </div>
                    ) : (
                      <div className="px-6 py-5">
                        <div className="grid grid-cols-3 gap-4 mb-5">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-primary">{courseMods.length}</p>
                            <p className="text-xs text-text-muted mt-0.5">Total Terms</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{enrolledCount}</p>
                            <p className="text-xs text-text-muted mt-0.5">In Progress</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                            <p className="text-xs text-text-muted mt-0.5">Completed</p>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-text-muted font-medium">Term Progress</span>
                            <span className="font-bold text-primary">{progressPct}%</span>
                          </div>
                          <div className="h-2.5 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
                          </div>
                          <p className="text-xs text-text-muted mt-1">{completedCount} of {courseMods.length} terms completed</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Term Progression (timeline) ── */}
                  {!isCourseCompleted && (
                    <>
                      <div className="flex items-center gap-2 mb-5">
                        <Layers size={17} className="text-primary"/>
                        <h3 className="font-heading font-semibold text-lg text-primary">Term Progression</h3>
                      </div>

                      {courseMods.length === 0 ? (
                        <p className="text-center text-text-muted py-10 border border-border rounded-xl bg-surface">
                          No terms have been added to this course yet.
                        </p>
                      ) : (
                        <div className="space-y-0">
                          {courseMods.map((mod: any, idx: number) => {
                            const dispStatus = getDisplayStatus(mod, idx, courseMods);
                            const cfg        = modStatusCfg[dispStatus] ?? modStatusCfg.locked;
                            const isOpen     = expanded.has(mod.id);
                            const isLocked   = dispStatus === "locked";
                            const isLast     = idx === courseMods.length - 1;
                            const enrolRec = enrollments.find((e: any) => e.module === mod.id);
                            const selectedSubIds: string[] = enrolRec?.selected_subjects || [];
                            const displayedSubjects = selectedSubIds.length > 0
                              ? (mod._subjects || []).filter((s: any) => selectedSubIds.includes(s.id))
                              : (mod._subjects || []);
                            const subjectCount = displayedSubjects.length;

                            return (
                              <div key={mod.id} className="flex gap-0">
                                {/* Timeline spine */}
                                <div className="flex flex-col items-center mr-4 shrink-0" style={{ width: 36 }}>
                                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-sm z-10 shrink-0 ${
                                    isLocked
                                      ? "border-gray-200 bg-gray-50 text-gray-400"
                                      : dispStatus === "completed" || dispStatus === "graded" || dispStatus === "finish"
                                        ? "border-green-400 bg-green-50 text-green-700"
                                        : dispStatus === "ongoing" || dispStatus === "active"
                                          ? "border-blue-400 bg-blue-50 text-blue-700"
                                          : "border-accent bg-accent/10 text-primary"
                                  }`}>
                                    {dispStatus === "locked" ? <Lock size={14}/> : mod.moduleOrder}
                                  </div>
                                  {!isLast && <div className="w-0.5 flex-1 bg-border mt-1 mb-1"/>}
                                </div>

                                {/* Term Card */}
                                <div className={`flex-1 mb-3 border rounded-xl overflow-hidden transition-all ${isLocked ? "opacity-55 border-border" : "border-border hover:border-accent/40"}`}>
                                  <button
                                    onClick={() => !isLocked && toggle(mod.id)}
                                    disabled={isLocked}
                                    className={`w-full flex items-center gap-3 px-4 py-4 bg-surface text-left ${isLocked ? "cursor-default" : "cursor-pointer"}`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-primary">{mod.moduleName}</p>
                                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-text-muted">
                                        {mod.start_date && (
                                          <span className="flex items-center gap-1">
                                            <Calendar size={10}/>
                                            {mod.start_date.slice(0, 10)} → {mod.end_date?.slice(0, 10) || "?"}
                                          </span>
                                        )}
                                        {subjectCount > 0 && <span>{subjectCount} subject{subjectCount > 1 ? "s" : ""}</span>}
                                      </div>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${cfg.badge}`}>
                                      {cfg.icon}{cfg.label}
                                    </span>
                                    {!isLocked && (
                                      <ChevronDown size={15} className={`text-text-muted transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}/>
                                    )}
                                  </button>

                                  {/* Expanded subjects */}
                                  {isOpen && (
                                    <div className="border-t border-border bg-bg px-4 py-4">
                                      {mod.description && (
                                        <p className="text-sm text-text-muted mb-4 italic">{mod.description}</p>
                                      )}
                                      {subjectCount === 0 ? (
                                        <p className="text-sm text-text-muted text-center py-4">No subjects have been added to this term yet.</p>
                                      ) : (
                                        <>
                                          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                            <Star size={11}/> Subjects
                                          </p>
                                          <div className="space-y-2">
                                            {displayedSubjects.map((s: any) => {
                                              const isGraded = gradedSubjectIds.has(s.id);
                                              return (
                                                <div key={s.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${isGraded ? "border-green-200 bg-green-50" : "border-border bg-surface"}`}>
                                                  <div className={`w-1 h-8 rounded-full shrink-0 ${s.subjectType === "mandatory" ? "bg-red-400" : "bg-blue-400"}`}/>
                                                  <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-primary">{s.subjectName}</p>
                                                    <p className="text-xs text-text-muted">{s.subjectCode}</p>
                                                  </div>
                                                  {s.teacher_name && (
                                                    <span className="hidden sm:flex items-center gap-1 text-xs text-text-muted shrink-0">
                                                      <User size={11}/>{s.teacher_name}
                                                    </span>
                                                  )}
                                                  {s.credit_no > 0 && (
                                                    <span className="text-xs font-semibold text-primary shrink-0">{s.credit_no} cr</span>
                                                  )}
                                                  {isGraded ? (
                                                    <CheckCircle size={16} className="text-green-600 shrink-0" title="Graded"/>
                                                  ) : (
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${
                                                      s.subjectType === "mandatory"
                                                        ? "bg-red-100 text-red-700 border-red-300"
                                                        : "bg-blue-100 text-blue-700 border-blue-300"
                                                    }`}>{s.subjectType}</span>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Elective Subjects Section ──────────────────────────── */}
        {!electiveLoading && electiveRegs.length > 0 && (() => {
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

          // Group by module_label from curriculum_subject
          const groups: Record<string, any[]> = {};
          for (const r of electiveRegs) {
            const label = r.expand?.curriculum_subject?.module_label || "Elective Subjects";
            if (!groups[label]) groups[label] = [];
            groups[label].push(r);
          }

          return (
            <div className="mt-12">
              <div className="flex items-center gap-2 mb-5">
                <PlusCircle size={17} className="text-primary"/>
                <h3 className="font-heading font-semibold text-lg text-primary">Elective Subjects</h3>
              </div>
              {Object.entries(groups).map(([groupLabel, regs]) => (
                <div key={groupLabel} className="mb-6">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{groupLabel}</h4>
                  <div className="space-y-2">
                    {regs.map((r: any) => {
                      const cs  = r.expand?.curriculum_subject;
                      const sub = r.expand?.subject;
                      const isMandatory = cs?.classification === "mandatory";
                      return (
                        <div key={r.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${r.status === "active" ? "border-blue-200 bg-blue-50/30" : r.status === "passed" ? "border-green-200 bg-green-50/30" : "border-border bg-surface"}`}>
                          <div className={`w-1 h-10 rounded-full shrink-0 ${isMandatory ? "bg-red-400" : "bg-yellow-400"}`}/>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm text-primary">{sub?.subjectName || "—"}</p>
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${classStyle(cs?.classification || "elective")}`}>
                                {classIcon(cs?.classification || "elective")} {cs?.classification || "elective"}
                              </span>
                            </div>
                            <p className="text-xs text-text-muted">
                              {sub?.subjectCode && <span className="font-mono">{sub.subjectCode}</span>}
                              {sub?.credit_no > 0 && <span> · {sub.credit_no} cr</span>}
                              {sub?.teacher_name && <span> · {sub.teacher_name}</span>}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize shrink-0 ${regStatusStyle[r.status] || ""}`}>
                            {r.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── Transfer Credits Section ─────────────────────────── */}
        {!transferLoading && (
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-5">
              <ArrowRightLeft size={17} className="text-primary" />
              <h3 className="font-heading font-semibold text-lg text-primary">Transfer Credits</h3>
            </div>

            {transferRecords.length === 0 ? (
              <div className="text-center py-12 border border-border rounded-xl bg-surface">
                <Building2 size={40} className="mx-auto text-text-muted/20 mb-3" />
                <p className="text-primary font-semibold mb-1">No transfer credits have been recorded.</p>
                <p className="text-sm text-text-muted">Contact your academic advisor if you have credits to transfer.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {transferRecords.map((rec: any) => {
                    const crs      = transferCoursesByRecord.get(rec.id) || [];
                    const subtotal = crs.reduce((s: number, c: any) => s + (c.credits || 0), 0);
                    return (
                      <div key={rec.id} className="border border-border rounded-xl bg-surface overflow-hidden">
                        {/* Institution header */}
                        <div className="flex items-center justify-between px-5 py-4 bg-bg border-b border-border">
                          <div className="flex items-center gap-2">
                            <Building2 size={15} className="text-secondary shrink-0" />
                            <span className="font-semibold text-primary">{rec.institution}</span>
                          </div>
                          <span className="text-sm text-text-muted font-medium">
                            Subtotal: <span className="font-bold text-primary">{subtotal} cr</span>
                          </span>
                        </div>
                        {/* Courses */}
                        <div className="divide-y divide-border/60">
                          {crs.map((c: any) => (
                            <div key={c.id} className="flex items-center justify-between px-5 py-3">
                              <span className="text-sm text-primary">{c.course_name}</span>
                              <span className="text-sm font-semibold text-primary shrink-0 ml-4">
                                {c.credits} {c.credits === 1 ? "credit" : "credits"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Grand total */}
                {transferRecords.length > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 mt-4 bg-primary text-white rounded-xl">
                    <span className="font-semibold">Total Transferred Credits</span>
                    <span className="font-bold text-lg">
                      {transferRecords.reduce((sum, rec) => {
                        const crs = transferCoursesByRecord.get(rec.id) || [];
                        return sum + crs.reduce((s: number, c: any) => s + (c.credits || 0), 0);
                      }, 0)} credits
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </PortalLayout>
  );
};

export default StudentMyCourses;
