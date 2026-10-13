import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Award, ClipboardList, Hourglass, TrendingUp } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const StudentDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState("");
  const [stats, setStats] = useState({
    totalTerms:     0,
    activeTerms:    0,
    pendingTerms:   0,
    completedTerms: 0,
    averageGPA:     0,
    totalSubjects:  0,
  });

  useEffect(() => {
    (async () => {
      const studentId = pb.authStore.record?.id;
      if (!studentId) { setLoading(false); return; }
      try {
        const me = await pb.collection("users").getOne(studentId, {
          expand: "assignedCourse", requestKey: null,
        });
        const course = me.expand?.assignedCourse;
        setCourseName(course?.courseName || "");

        const [moduleEnrollments, gradeRecords] = await Promise.all([
          pb.collection("module_enrollments").getFullList({
            filter: `student = "${studentId}"`, requestKey: null,
          }),
          pb.collection("grade_records").getFullList({
            filter: `student = "${studentId}" && gradingStatus = "published"`, requestKey: null,
          }),
        ]);

        // Average GPA from published grade records
        const avgGPA = gradeRecords.length > 0
          ? gradeRecords.reduce((sum, g) => sum + (g.gradePoint || 0), 0) / gradeRecords.length
          : 0;

        const totalSubs = moduleEnrollments.reduce((n, e) => n + ((e.selected_subjects || []).length), 0);

        setStats({
          totalTerms:     moduleEnrollments.length,
          activeTerms:    moduleEnrollments.filter(e => e.status === "active").length,
          pendingTerms:   moduleEnrollments.filter(e => e.status === "pending").length,
          completedTerms: moduleEnrollments.filter(e => e.status === "completed").length,
          averageGPA:     avgGPA,
          totalSubjects:  totalSubs,
        });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const gradeColor = stats.averageGPA >= 3.5 ? "text-green-600" : stats.averageGPA >= 2.5 ? "text-secondary" : stats.averageGPA > 0 ? "text-red-500" : "text-text-muted";

  return (
    <PortalLayout role="student">
      <div className="max-w-4xl mx-auto">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="font-heading font-bold text-2xl text-primary mb-1">
            Welcome back, {pb.authStore.record?.name}!
          </h2>
          <p className="text-text-muted text-sm">
            {courseName ? <>Enrolled in: <span className="font-semibold text-primary">{courseName}</span></> : "Here's your academic overview."}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-muted">Loading your progress…</p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: <BookOpen size={22}/>,      label: "Total Terms",       value: stats.totalTerms,    c: "text-primary",    link: "/portal/student/courses" },
                { icon: <ClipboardList size={22}/>, label: "In Progress",       value: stats.activeTerms,   c: "text-blue-600",   link: "/portal/student/courses" },
                { icon: <Hourglass size={22}/>,     label: "Pending Approval",  value: stats.pendingTerms,  c: "text-yellow-600", link: "/portal/student/enrollment" },
                { icon: <Award size={22}/>,         label: "Completed",         value: stats.completedTerms,c: "text-green-600",  link: "/portal/student/grades" },
                { icon: <TrendingUp size={22}/>,    label: "Avg. Grade (GPA)",  value: stats.averageGPA > 0 ? stats.averageGPA.toFixed(2) : "—", c: gradeColor, link: "/portal/student/grades" },
                { icon: <BookOpen size={22}/>,      label: "Enrolled Subjects", value: stats.totalSubjects, c: "text-primary",    link: "/portal/student/courses" },
              ].map(card => (
                <Link key={card.label} to={card.link}
                  className="border border-border rounded-xl p-5 bg-surface hover:border-accent/50 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3 text-primary group-hover:scale-105 transition-transform">
                    {card.icon}
                  </div>
                  <p className="text-xs text-text-muted mb-0.5">{card.label}</p>
                  <p className={`font-heading font-bold text-2xl ${card.c}`}>{card.value}</p>
                </Link>
              ))}
            </div>

            {/* Quick actions */}
            <div className="border border-border rounded-xl bg-surface p-6">
              <h3 className="font-heading font-semibold text-lg text-primary mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { to: "/portal/student/enrollment", label: "Request Enrollment", desc: "Enroll in your next term",     color: "bg-accent hover:bg-accent-light text-primary" },
                  { to: "/portal/student/courses",    label: "My Courses",         desc: "View terms and subjects",      color: "bg-primary hover:bg-primary/90 text-white" },
                  { to: "/portal/student/grades",     label: "View Grades",        desc: "Check published results",      color: "bg-surface hover:bg-bg border border-border text-primary" },
                ].map(a => (
                  <Link key={a.label} to={a.to}
                    className={`${a.color} rounded-lg px-4 py-3.5 transition-colors`}>
                    <p className="font-semibold text-sm">{a.label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{a.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
};

export default StudentDashboard;
