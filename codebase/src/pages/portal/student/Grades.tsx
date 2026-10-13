import React, { useEffect, useState } from "react";
import { Award, ChevronDown, GraduationCap, BookOpen, PlusCircle } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

interface SubjectGrade {
  subjectId: string; subjectName: string; subjectCode: string;
  teacherName: string; creditNo: number;
  gradeLabel: string; gradePoint: number;
}

interface TermResult {
  moduleId: string; moduleName: string; moduleOrder: number;
  subjects: SubjectGrade[];
  avgGPA: number; avgLabel: string;
}

interface CourseSection {
  courseId: string; courseName: string; courseCode: string; yearLevel?: number;
  terms: TermResult[];
}

const labelColor = (l: string) => {
  if (!l || l === "—") return "bg-gray-100 text-gray-500 border-gray-300";
  if (l.startsWith("A")) return "bg-green-100 text-green-800 border-green-300";
  if (l.startsWith("B")) return "bg-blue-100 text-blue-800 border-blue-300";
  if (l.startsWith("C")) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (l.startsWith("D")) return "bg-orange-100 text-orange-800 border-orange-300";
  return "bg-red-100 text-red-800 border-red-300";
};

const modeLabel = (labels: string[]): string => {
  const freq: Record<string, number> = {};
  labels.forEach(l => { freq[l] = (freq[l] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
};

const StudentGrades: React.FC = () => {
  const [degreeInfo, setDegreeInfo]         = useState<any>(null);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [loading, setLoading]               = useState(true);
  const [expanded, setExpanded]             = useState<Set<string>>(new Set());
  const toggle = (id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Elective grades state
  const [electiveGrades, setElectiveGrades] = useState<any[]>([]);
  const [electiveLoading, setElectiveLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const studentId = pb.authStore.record?.id;
      try {
        // Get student's degree — from assignedDegree, or fall back to assignedCourse.degree
        const me = await pb.collection("users").getOne(studentId!, {
          expand: "assignedDegree,assignedCourse,assignedCourse.degree",
          requestKey: null,
        });

        const degree = me.expand?.assignedDegree
          || me.expand?.assignedCourse?.expand?.degree;

        if (!degree) { setLoading(false); return; }
        setDegreeInfo(degree);

        // All courses in this degree
        const allCourses = await pb.collection("academic_courses").getFullList({
          filter: `degree = "${degree.id}"`,
          sort: "year_level,courseCode",
          requestKey: null,
        });
        if (allCourses.length === 0) { setLoading(false); return; }

        // Student enrollments and published grades
        const [allEnrollments, allGrades] = await Promise.all([
          pb.collection("module_enrollments").getFullList({
            filter: `student = "${studentId}"`, requestKey: null,
          }),
          pb.collection("grade_records").getFullList({
            filter: `student = "${studentId}" && gradingStatus = "published"`, requestKey: null,
          }),
        ]);

        // Graded modules for these courses
        const courseIds = allCourses.map(c => c.id);
        const modFilter = courseIds.map(id => `course = "${id}"`).join(" || ");
        const allModules = await pb.collection("academic_modules").getFullList({
          filter: `(${modFilter}) && status = "graded"`,
          sort: "moduleOrder",
          requestKey: null,
        });

        // Subjects for graded modules
        let allSubjects: any[] = [];
        if (allModules.length > 0) {
          const subjFilter = allModules.map(m => `module = "${m.id}"`).join(" || ");
          allSubjects = await pb.collection("academic_subjects").getFullList({
            filter: subjFilter, requestKey: null,
          });
        }

        const enrollMap = new Map(allEnrollments.map(e => [e.module, e]));
        const gradeMap  = new Map(allGrades.map(r => [r.subject, r]));

        const sections: CourseSection[] = allCourses.map(course => {
          const courseMods = allModules.filter(m =>
            m.course === course.id && enrollMap.has(m.id)
          );

          const terms: TermResult[] = courseMods.map(m => {
            const enrol = enrollMap.get(m.id)!;
            const selectedSubIds: string[] = enrol.selected_subjects || [];
            const modSubs = allSubjects.filter(s =>
              s.module === m.id &&
              (selectedSubIds.length === 0 || selectedSubIds.includes(s.id))
            );

            const subGrades: SubjectGrade[] = modSubs.map(s => {
              const rec = gradeMap.get(s.id);
              return {
                subjectId: s.id, subjectName: s.subjectName, subjectCode: s.subjectCode,
                teacherName: s.teacher_name || "—", creditNo: s.credit_no || 0,
                gradeLabel: rec?.gradeLabel || "—", gradePoint: rec?.gradePoint || 0,
              };
            });

            const gradedSubs = subGrades.filter(s => s.gradeLabel !== "—");
            const avgGPA = gradedSubs.length > 0
              ? gradedSubs.reduce((a, s) => a + s.gradePoint, 0) / gradedSubs.length : 0;
            const avgLabel = modeLabel(gradedSubs.map(s => s.gradeLabel));

            return {
              moduleId: m.id, moduleName: m.moduleName, moduleOrder: m.moduleOrder,
              subjects: subGrades, avgGPA, avgLabel,
            };
          });

          return {
            courseId: course.id, courseName: course.courseName,
            courseCode: course.courseCode, yearLevel: course.year_level,
            terms,
          };
        }).filter(cs => cs.terms.length > 0);

        setCourseSections(sections);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Load elective (subject_registration) grade records separately
  useEffect(() => {
    const studentId = pb.authStore.record?.id;
    if (!studentId) { setElectiveLoading(false); return; }
    (async () => {
      try {
        const recs = await pb.collection("grade_records").getFullList({
          filter: `student = "${studentId}" && subject_registration != "" && gradingStatus = "published"`,
          expand: "subject,subject_registration.curriculum_subject",
          sort: "created",
          requestKey: null,
        });
        setElectiveGrades(recs);
      } catch { /* subject_registration field may not exist in older records */ }
      finally { setElectiveLoading(false); }
    })();
  }, []);

  /* Overall summary */
  const allTerms   = courseSections.flatMap(cs => cs.terms);
  const gradedTerms = allTerms.filter(t => t.avgGPA > 0);
  const overallGPA  = gradedTerms.length > 0
    ? gradedTerms.reduce((a, t) => a + t.avgGPA, 0) / gradedTerms.length : 0;
  const overallLabel = modeLabel(
    allTerms.flatMap(t => t.subjects.filter(s => s.gradeLabel !== "—").map(s => s.gradeLabel))
  );

  return (
    <PortalLayout role="student">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="font-heading font-bold text-2xl text-primary mb-1">My Grades</h2>
          <p className="text-text-muted text-sm">Published grades grouped by course and term</p>
        </div>

        {loading ? (
          <p className="text-center text-text-muted py-12">Loading grades…</p>
        ) : !degreeInfo ? (
          <div className="text-center py-16 border border-border rounded-lg bg-surface">
            <Award size={48} className="mx-auto text-text-muted/30 mb-4"/>
            <p className="text-primary font-semibold">No degree assigned.</p>
            <p className="text-sm text-text-muted mt-1">Contact your academic advisor to get started.</p>
          </div>
        ) : courseSections.length === 0 ? (
          <div className="text-center py-16 border border-border rounded-lg bg-surface">
            <Award size={48} className="mx-auto text-text-muted/30 mb-4"/>
            <p className="text-primary font-semibold mb-1">No grades available yet</p>
            <p className="text-sm text-text-muted">Grades appear once your instructor marks a term as graded.</p>
          </div>
        ) : (
          <>
            {/* Overall Summary */}
            <div className="border border-border rounded-xl p-6 bg-surface mb-8">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap size={18} className="text-primary"/>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-primary">{degreeInfo.degreeName}</h3>
                  <p className="text-xs text-text-muted">Overall academic summary</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-text-muted mb-1">Terms Graded</p>
                  <p className="font-bold text-2xl text-primary">{allTerms.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-text-muted mb-1">Average Grade</p>
                  <p className="font-bold text-2xl text-secondary">{overallLabel !== "—" ? overallLabel : "—"}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-text-muted mb-1">Overall GPA</p>
                  <p className="font-bold text-2xl text-accent">{overallGPA > 0 ? overallGPA.toFixed(2) : "—"}</p>
                </div>
              </div>
            </div>

            {/* Course Sections */}
            <div className="space-y-10">
              {courseSections.map(cs => (
                <div key={cs.courseId}>
                  {/* Course Header */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
                    <BookOpen size={16} className="text-primary shrink-0"/>
                    <div>
                      <h3 className="font-heading font-semibold text-base text-primary">{cs.courseName}</h3>
                      <p className="text-xs text-text-muted">{cs.courseCode}</p>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="space-y-3">
                    {cs.terms.map(term => {
                      const open = expanded.has(term.moduleId);
                      return (
                        <div key={term.moduleId} className="border border-border rounded-xl overflow-hidden bg-surface">
                          <button onClick={() => toggle(term.moduleId)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-bg transition-colors">
                            <div className="w-9 h-9 rounded-full bg-accent/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">{term.moduleOrder}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-primary">{term.moduleName}</p>
                              {term.avgGPA > 0 && (
                                <p className="text-xs text-text-muted mt-0.5">
                                  Average Grade: <span className="font-semibold text-secondary">{term.avgLabel}</span>
                                  {" · "}GPA: <span className="font-semibold text-accent">{term.avgGPA.toFixed(2)}</span>
                                </p>
                              )}
                            </div>
                            <ChevronDown size={16} className={`text-text-muted transition-transform shrink-0 ${open ? "rotate-180" : ""}`}/>
                          </button>

                          {open && (
                            <div className="border-t border-border px-5 py-4 bg-bg">
                              {term.subjects.length === 0 ? (
                                <p className="text-sm text-text-muted">No subjects found.</p>
                              ) : (
                                <table className="w-full text-sm">
                                  <thead><tr className="text-xs text-text-muted border-b border-border">
                                    <th className="text-left pb-2">Subject</th>
                                    <th className="text-left pb-2">Teacher</th>
                                    <th className="text-center pb-2">Credits</th>
                                    <th className="text-center pb-2">Grade</th>
                                    <th className="text-center pb-2">GPA Pts</th>
                                  </tr></thead>
                                  <tbody>{term.subjects.map(s => (
                                    <tr key={s.subjectId} className="border-t border-border/50">
                                      <td className="py-2.5 font-medium">
                                        {s.subjectName}
                                        <span className="text-xs text-text-muted ml-1">({s.subjectCode})</span>
                                      </td>
                                      <td className="py-2.5 text-xs text-text-muted">{s.teacherName}</td>
                                      <td className="py-2.5 text-center text-xs">{s.creditNo || "—"}</td>
                                      <td className="py-2.5 text-center">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${labelColor(s.gradeLabel)}`}>{s.gradeLabel}</span>
                                      </td>
                                       <td className="py-2.5 text-center font-semibold text-secondary">{s.gradePoint ? s.gradePoint.toFixed(2) : "—"}</td>
                                    </tr>
                                  ))}</tbody>
                                </table>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Elective Subject Grades ── */}
        {!electiveLoading && electiveGrades.length > 0 && (() => {
          const classIcon = (c: string) => c === "mandatory" ? "🔴" : "🟡";
          const classStyle = (c: string) =>
            c === "mandatory" ? "bg-red-100 text-red-700 border-red-300" : "bg-yellow-100 text-yellow-700 border-yellow-300";
          const electiveGPA = electiveGrades.length > 0
            ? electiveGrades.reduce((s, g) => s + (g.gradePoint || 0), 0) / electiveGrades.length : 0;

          return (
            <div className="mt-10">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                <PlusCircle size={17} className="text-primary"/>
                <div>
                  <h3 className="font-heading font-semibold text-base text-primary">Elective Subjects</h3>
                  <p className="text-xs text-text-muted">Cross-curriculum subjects registered individually</p>
                </div>
                <span className="ml-auto text-xs font-semibold text-secondary">
                  Elective GPA: {electiveGPA.toFixed(2)}
                </span>
              </div>
              <div className="border border-border rounded-xl overflow-hidden bg-surface">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-text-muted border-b border-border bg-bg">
                    <th className="text-left px-5 py-2.5">Subject</th>
                    <th className="text-left px-4 py-2.5">Context</th>
                    <th className="text-center px-4 py-2.5">Classification</th>
                    <th className="text-center px-4 py-2.5">Credits</th>
                    <th className="text-center px-4 py-2.5">Grade</th>
                    <th className="text-center px-4 py-2.5">GPA Pts</th>
                  </tr></thead>
                  <tbody>
                    {electiveGrades.map(g => {
                      const sub = g.expand?.subject;
                      const cs  = g.expand?.subject_registration?.expand?.curriculum_subject;
                      return (
                        <tr key={g.id} className="border-t border-border/50">
                          <td className="px-5 py-3">
                            <p className="font-medium text-primary">{sub?.subjectName || "—"}</p>
                            <p className="text-xs font-mono text-text-muted">{sub?.subjectCode || ""}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-text-muted">{cs?.module_label || "—"}</td>
                          <td className="px-4 py-3 text-center">
                            {cs && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${classStyle(cs.classification)}`}>
                                {classIcon(cs.classification)} {cs.classification}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-xs">{sub?.credit_no || "—"}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${labelColor(g.gradeLabel)}`}>{g.gradeLabel || "—"}</span>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-secondary">
                            {g.gradePoint != null ? g.gradePoint.toFixed(2) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

      </div>
    </PortalLayout>
  );
};

export default StudentGrades;
