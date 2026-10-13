import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, GraduationCap, FileText, LogOut, Menu, X,
  Users, Settings, ClipboardList, Award, User, ExternalLink,
  Globe, Building2, LibraryBig, SlidersHorizontal, UserSquare, BarChart3,
  ChevronRight, BookMarked, Activity, ShieldCheck, Images, Link2, Library,
  ArrowRightLeft, UserCheck
} from "lucide-react";
import pb from "../lib/pocketbase";
import { logActivity } from "../lib/logActivity";
import { useSessionTimeout } from "../hooks/useSessionTimeout";

interface Props {
  children: React.ReactNode;
  role: "student" | "teacher" | "admin" | "information_admin";
}

type NavItem =
  | { type: "item"; to: string; icon: React.ReactNode; label: string; isExternal?: boolean; permKey?: string }
  | { type: "section"; label: string };

const PortalLayout: React.FC<Props> = ({ children, role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const user      = pb.authStore.record;

  // RBAC state for admin role
  const [userPermissions, setUserPermissions] = useState<string[] | null>(null); // null = all (system admin / loading)
  const [rbacLoaded, setRbacLoaded]           = useState(role !== "admin"); // non-admins and information_admin skip RBAC

  // Student sidebar: live credit total (BEI earned + approved transfers)
  const [studentCredits, setStudentCredits]   = useState<number | null>(null);

  useSessionTimeout();

  useEffect(() => {
    if (role !== "admin") return;
    const uid = pb.authStore.record?.id;
    if (!uid) { setRbacLoaded(true); return; }
    pb.collection("users").getOne(uid, { expand: "admin_role", requestKey: null })
      .then(u => {
        const adminRole = u.expand?.admin_role;
        if (!adminRole || adminRole.is_system) {
          setUserPermissions(null); // full access
        } else {
          setUserPermissions(adminRole.permissions || []);
        }
      })
      .catch(() => setUserPermissions(null)) // fail open
      .finally(() => setRbacLoaded(true));
  }, [role]);

  /* Compute student total credits: BEI (published grades) + approved transfers */
  useEffect(() => {
    if (role !== "student") return;
    const uid = pb.authStore.record?.id;
    if (!uid) return;
    (async () => {
      try {
        // 1. BEI credits: published grade records → distinct subjects → sum credit_no
        const gradeRecs = await pb.collection("grade_records").getFullList({
          filter: `student = "${uid}" && gradingStatus = "published"`,
          fields: "subject", requestKey: null,
        });
        const subjectIds = [...new Set(gradeRecs.map((r: any) => r.subject))].filter(Boolean) as string[];
        let beiCredits = 0;
        if (subjectIds.length > 0) {
          const subs = await pb.collection("academic_subjects").getFullList({
            filter: subjectIds.map(id => `id = "${id}"`).join(" || "),
            fields: "id,credit_no", requestKey: null,
          });
          beiCredits = subs.reduce((s: number, sub: any) => s + (sub.credit_no || 0), 0);
        }
        // 2. Approved transfer credits
        const tcourses = await pb.collection("transfer_courses").getFullList({
          filter: `transfer_record.student = "${uid}" && transfer_record.status = "approved"`,
          fields: "credits", requestKey: null,
        }).catch(() => [] as any[]);
        const transferCredits = tcourses.reduce((s: number, c: any) => s + (c.credits || 0), 0);
        setStudentCredits(beiCredits + transferCredits);
      } catch { /* fail silently — sidebar still renders without credit count */ }
    })();
  }, [role]);

  const handleLogout = async () => {
    await logActivity("logout", "User logged out");
    pb.authStore.clear();
    navigate("/login");
  };

  const isPermitted = (item: NavItem): boolean => {
    if (item.type !== "item") return false;
    if (!item.permKey) return true;
    if (userPermissions === null) return true; // system admin or non-admin
    return userPermissions.includes(item.permKey);
  };

  /* Build nav items */
  const courseLabel = studentCredits !== null
    ? `My Courses (${studentCredits} Credits)` : "My Courses";

  const allMenuItems: Record<string, NavItem[]> = {
    student: [
      { type: "item", to: "/portal/student/dashboard",  icon: <LayoutDashboard size={18}/>, label: "Dashboard" },
      { type: "item", to: "/portal/student/courses",    icon: <BookOpen size={18}/>,        label: courseLabel },
      { type: "item", to: "/portal/student/grades",     icon: <Award size={18}/>,            label: "Grades" },
      { type: "item", to: "/portal/student/enrollment", icon: <ClipboardList size={18}/>,    label: "Enrollment" },
      { type: "item", to: "/portal/student/profile",    icon: <User size={18}/>,             label: "Profile" },
      { type: "item", to: "https://study.brilliant-edu.org/login", icon: <ExternalLink size={18}/>, label: "Student Campus", isExternal: true },
      { type: "item", to: "/portal/student/bulletin",   icon: <Link2 size={18}/>,            label: "Bulletin (Forms & Links)" },
      { type: "item", to: "/portal/student/resources",  icon: <Library size={18}/>,          label: "Resources" },
    ],
    teacher: [
      { type: "item", to: "/portal/teacher/dashboard",   icon: <LayoutDashboard size={18}/>, label: "Dashboard" },
      { type: "item", to: "/portal/teacher/courses",     icon: <BookOpen size={18}/>,        label: "My Courses" },
      { type: "item", to: "/portal/teacher/grades",      icon: <Award size={18}/>,            label: "Grade Management" },
      { type: "item", to: "/portal/teacher/assignments", icon: <FileText size={18}/>,         label: "Assignments" },
      { type: "item", to: "/portal/teacher/students",    icon: <Users size={18}/>,            label: "Students" },
    ],
    admin: [
      { type: "item", to: "/portal/admin/dashboard",          icon: <LayoutDashboard size={18}/>, label: "Dashboard" },

      { type: "section", label: "User Management" },
      { type: "item", to: "/portal/admin/users",              icon: <Users size={18}/>,            label: "Staff & Admins",      permKey: "users" },
      { type: "item", to: "/portal/admin/enrollments",        icon: <ClipboardList size={18}/>,    label: "Enrollments",         permKey: "enrollments" },

      { type: "section", label: "Academic" },
      { type: "item", to: "/portal/admin/departments",        icon: <Building2 size={18}/>,        label: "Departments",         permKey: "departments" },
      { type: "item", to: "/portal/admin/academic-programs",  icon: <BookMarked size={18}/>,       label: "Programs",            permKey: "programs" },
      { type: "item", to: "/portal/admin/degrees",            icon: <GraduationCap size={18}/>,    label: "Degrees",             permKey: "degrees" },
      { type: "item", to: "/portal/admin/academic-courses",   icon: <LibraryBig size={18}/>,       label: "Courses",             permKey: "courses" },
      { type: "item", to: "/portal/admin/grade-config",       icon: <SlidersHorizontal size={18}/>,label: "Grade Config",        permKey: "grade_config" },
      { type: "item", to: "/portal/admin/registration-rules", icon: <BookMarked size={18}/>,       label: "Registration Rules",  permKey: "registration_rules" },

      { type: "section", label: "Students" },
      { type: "item", to: "/portal/admin/students",            icon: <UserSquare size={18}/>,      label: "Student Management",  permKey: "students" },
      { type: "item", to: "/portal/admin/grade-management",    icon: <BarChart3 size={18}/>,       label: "Grade Management",    permKey: "grades" },
      { type: "item", to: "/portal/admin/transfer-credits",    icon: <ArrowRightLeft size={18}/>,  label: "Transfer Credits",    permKey: "transfer_credits" },
      { type: "item", to: "/portal/admin/subject-registrations", icon: <UserCheck size={18}/>,    label: "Subject Registrations", permKey: "subject_registrations" },

      { type: "section", label: "Website Content" },
      { type: "item", to: "/portal/admin/information-programs", icon: <Globe size={18}/>,          label: "Information Programs",permKey: "information_programs" },

      { type: "section", label: "System" },
      { type: "item", to: "/portal/admin/collaborators",      icon: <Globe size={18}/>,            label: "Partner Institutions",permKey: "collaborators" },
      { type: "item", to: "/portal/admin/gallery",            icon: <Images size={18}/>,           label: "Gallery",             permKey: "gallery" },
      { type: "item", to: "/portal/admin/bulletin",           icon: <Link2 size={18}/>,            label: "Bulletin (Forms & Links)", permKey: "bulletin" },
      { type: "item", to: "/portal/admin/resources",          icon: <Library size={18}/>,          label: "Resource Management", permKey: "resources" },
      { type: "item", to: "/portal/admin/activity-logs",      icon: <Activity size={18}/>,         label: "Activity Logs",       permKey: "activity_logs" },
      { type: "item", to: "/portal/admin/roles-permissions",  icon: <ShieldCheck size={18}/>,      label: "Roles & Permissions", permKey: "roles" },
      { type: "item", to: "/portal/admin/settings",           icon: <Settings size={18}/>,         label: "Settings",            permKey: "settings" },
    ],

    // information_admin: restricted to Information Programs management only
    information_admin: [
      { type: "item", to: "/portal/admin/information-programs", icon: <Globe size={18}/>, label: "Information Programs" },
    ],
  };

  const rawItems = allMenuItems[role] ?? [];

  /* Filter nav items by RBAC (only affects admin, only when loaded) */
  const visibleItems: NavItem[] = [];
  if (!rbacLoaded) {
    // Still loading — show all to prevent flicker
    visibleItems.push(...rawItems);
  } else {
    let i = 0;
    while (i < rawItems.length) {
      const item = rawItems[i];
      if (item.type === "section") {
        // Peek ahead: include section only if at least one child is visible
        let j = i + 1;
        const children: NavItem[] = [];
        while (j < rawItems.length && rawItems[j].type !== "section") {
          children.push(rawItems[j]); j++;
        }
        const visibleChildren = children.filter(isPermitted);
        if (visibleChildren.length > 0) {
          visibleItems.push(item);
          visibleItems.push(...visibleChildren);
        }
        i = j;
      } else {
        if (isPermitted(item)) visibleItems.push(item);
        i++;
      }
    }
  }

  /* Active label for header — match on all items (not just visible) for sub-routes */
  const activeLabel = rawItems
    .filter((i): i is Extract<NavItem, { type: "item" }> => i.type === "item")
    .find(i => location.pathname === i.to || location.pathname.startsWith(i.to + "/"))?.label || "Portal";

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-primary text-white transform transition-transform duration-300 flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <img src="/public_decc_7cd50fc84ddf4d2f83450ed587f7861a.png" alt="BEI" className="h-9 w-auto"/>
            <span className="font-heading font-semibold text-sm">BEI Portal</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/70 hover:text-white"><X size={18}/></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {visibleItems.map((item, idx) => {
            if (item.type === "section") {
              return <p key={idx} className="px-3 pt-5 pb-1.5 text-[10px] font-bold tracking-widest uppercase text-white/40">{item.label}</p>;
            }
            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            if (item.isExternal) {
              return (
                <a key={item.to} href={item.to} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-white/60 hover:text-white hover:bg-white/10">
                  {item.icon}{item.label}
                </a>
              );
            }
            return (
              <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-accent text-primary font-semibold" : "text-white/70 hover:text-white hover:bg-white/10"}`}>
                {item.icon}{item.label}
                {isActive && <ChevronRight size={14} className="ml-auto"/>}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-accent text-primary flex items-center justify-center font-bold text-sm shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name || "User"}</p>
              <p className="text-xs text-white/50 capitalize">{role === "information_admin" ? "Info Admin" : role}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-md transition-colors">
            <LogOut size={15}/>Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-surface border-b border-border px-4 lg:px-8 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-primary"><Menu size={22}/></button>
            <h1 className="font-heading font-bold text-lg text-primary mx-auto lg:mx-0">{activeLabel}</h1>
            <div className="w-6 lg:hidden"/>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)}/>}
    </div>
  );
};

export default PortalLayout;
