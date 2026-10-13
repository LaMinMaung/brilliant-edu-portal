import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CustomCursor from "./components/CustomCursor";
import ScrollProgress from "./components/ScrollProgress";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import About from "./pages/About";
import Partners from "./pages/Partners";
import OrganizationStructure from "./pages/OrganizationStructure";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import Admissions from "./pages/Admissions";
import ResourcePage from "./pages/ResourcePage";
import Services from "./pages/Services";
import MediaNews from "./pages/MediaNews";
import NewsDetail from "./pages/NewsDetail";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { PageEditorProvider } from "./lib/pageEditor";
import AdminEditBar from "./components/AdminEditBar";

// Student Portal
import StudentDashboard from "./pages/portal/student/Dashboard";
import StudentCourses from "./pages/portal/student/Courses";
import StudentGrades from "./pages/portal/student/Grades";
import StudentEnrollment from "./pages/portal/student/Enrollment";
import StudentProfile from "./pages/portal/student/Profile";
import StudentBulletin from "./pages/portal/student/Bulletin";
import StudentResources from "./pages/portal/student/Resources";

// Teacher Portal
import TeacherDashboard from "./pages/portal/teacher/Dashboard";
import TeacherCourses from "./pages/portal/teacher/Courses";
import TeacherGrades from "./pages/portal/teacher/Grades";
import TeacherStudents from "./pages/portal/teacher/Students";
import TeacherAssignments from "./pages/portal/teacher/Assignments";

// Admin Portal
import AdminDashboard from "./pages/portal/admin/Dashboard";
import AdminUsers from "./pages/portal/admin/Users";
import AdminEnrollments from "./pages/portal/admin/Enrollments";
import AdminSettings from "./pages/portal/admin/Settings";
import AdminCollaborators from "./pages/portal/admin/Collaborators";
import AdminDegrees from "./pages/portal/admin/Degrees";
import AdminDepartments from "./pages/portal/admin/Departments";
import AdminAcademicCourses from "./pages/portal/admin/AcademicCourses";
import AdminGradeConfig from "./pages/portal/admin/GradeConfig";
import AdminStudents from "./pages/portal/admin/Students";
import AdminGradeManagement from "./pages/portal/admin/GradeManagement";
import AdminAcademicPrograms from "./pages/portal/admin/AcademicPrograms";
import AdminCourseModules from "./pages/portal/admin/CourseModules";
import AdminModuleSubjects from "./pages/portal/admin/ModuleSubjects";
import AdminActivityLogs from "./pages/portal/admin/ActivityLogs";
import AdminRolesPermissions from "./pages/portal/admin/RolesPermissions";
import AdminGallery from "./pages/portal/admin/Gallery";
import AdminBulletin from "./pages/portal/admin/Bulletin";
import AdminResources from "./pages/portal/admin/Resources";
import AdminTransferCredits from "./pages/portal/admin/TransferCredits";
import AdminRegistrationRules from "./pages/portal/admin/RegistrationRules";
import AdminSubjectRegistrations from "./pages/portal/admin/SubjectRegistrations";
import AdminInformationPrograms from "./pages/portal/admin/InformationPrograms";

const App = () => (
  <BrowserRouter>
    <CustomCursor />
    <ScrollProgress />
    <Routes>
      {/* Public Routes */}
      <Route
        path="/*"
        element={
          <PageEditorProvider>
            <Navbar />
            <AdminEditBar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/about/partners" element={<Partners />} />
              <Route path="/organization" element={<OrganizationStructure />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/programs/:id" element={<ProgramDetail />} />
              <Route path="/admissions" element={<Admissions />} />
              <Route path="/services" element={<Services />} />
              <Route path="/media-news" element={<MediaNews />} />
              <Route path="/media-news/:id" element={<NewsDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/resources/:slug" element={<ResourcePage />} />
            </Routes>
            <Footer />
          </PageEditorProvider>
        }
      />

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Student Portal */}
      <Route
        path="/portal/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/student/courses"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/student/grades"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentGrades />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/student/enrollment"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentEnrollment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/student/profile"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/student/bulletin"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentBulletin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/student/resources"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentResources />
          </ProtectedRoute>
        }
      />

      {/* Teacher Portal */}
      <Route
        path="/portal/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/teacher/courses"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/teacher/grades"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherGrades />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/teacher/students"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherStudents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/teacher/assignments"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherAssignments />
          </ProtectedRoute>
        }
      />

      {/* Admin Portal */}
      <Route
        path="/portal/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/admin/enrollments"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminEnrollments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/admin/settings"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminSettings />
          </ProtectedRoute>
        }
      />

      <Route path="/portal/admin/collaborators" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCollaborators /></ProtectedRoute>} />
      <Route path="/portal/admin/degrees"          element={<ProtectedRoute allowedRoles={["admin"]}><AdminDegrees /></ProtectedRoute>} />
      <Route path="/portal/admin/departments"      element={<ProtectedRoute allowedRoles={["admin"]}><AdminDepartments /></ProtectedRoute>} />
      <Route path="/portal/admin/academic-programs" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAcademicPrograms /></ProtectedRoute>} />
      <Route path="/portal/admin/academic-courses"                         element={<ProtectedRoute allowedRoles={["admin"]}><AdminAcademicCourses /></ProtectedRoute>} />
      <Route path="/portal/admin/academic-courses/:courseId/modules"      element={<ProtectedRoute allowedRoles={["admin"]}><AdminCourseModules /></ProtectedRoute>} />
      <Route path="/portal/admin/academic-modules/:moduleId/subjects"     element={<ProtectedRoute allowedRoles={["admin"]}><AdminModuleSubjects /></ProtectedRoute>} />
      <Route path="/portal/admin/grade-config"                            element={<ProtectedRoute allowedRoles={["admin"]}><AdminGradeConfig /></ProtectedRoute>} />
      <Route path="/portal/admin/students"         element={<ProtectedRoute allowedRoles={["admin"]}><AdminStudents /></ProtectedRoute>} />
      <Route path="/portal/admin/grade-management"  element={<ProtectedRoute allowedRoles={["admin"]}><AdminGradeManagement /></ProtectedRoute>} />
      <Route path="/portal/admin/gallery"           element={<ProtectedRoute allowedRoles={["admin"]}><AdminGallery /></ProtectedRoute>} />
      <Route path="/portal/admin/bulletin"          element={<ProtectedRoute allowedRoles={["admin"]}><AdminBulletin /></ProtectedRoute>} />
      <Route path="/portal/admin/resources"         element={<ProtectedRoute allowedRoles={["admin"]}><AdminResources /></ProtectedRoute>} />
      <Route path="/portal/admin/transfer-credits" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTransferCredits /></ProtectedRoute>} />
      <Route path="/portal/admin/registration-rules" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRegistrationRules /></ProtectedRoute>} />
      <Route path="/portal/admin/subject-registrations" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSubjectRegistrations /></ProtectedRoute>} />
      <Route path="/portal/admin/activity-logs"     element={<ProtectedRoute allowedRoles={["admin"]}><AdminActivityLogs /></ProtectedRoute>} />
      <Route path="/portal/admin/roles-permissions" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRolesPermissions /></ProtectedRoute>} />
      {/* Information Programs — accessible by admin AND information_admin */}
      <Route path="/portal/admin/information-programs" element={<ProtectedRoute allowedRoles={["admin", "information_admin"]}><AdminInformationPrograms /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;