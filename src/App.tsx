import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Lazy-loaded components
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const NewsIndex = lazy(() => import("./pages/NewsIndex"));
const NewsPost = lazy(() => import("./pages/NewsPost"));
const Svedeniya = lazy(() => import("./pages/Svedeniya"));
const AdminMedia = lazy(() => import("./pages/AdminMedia"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminAccess = lazy(() => import("./pages/AdminAccess"));
const AdminSections = lazy(() => import("./pages/AdminSections"));
const AdminSectionHero = lazy(() => import("./pages/AdminSectionHero"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const AdminRoles = lazy(() => import("./pages/AdminRoles"));
const AdminNews = lazy(() => import("./pages/AdminNews"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ProgramsPage = lazy(() => import("./pages/ProgramsPage"));
const ClubsPage = lazy(() => import("./pages/ClubsPage"));
const ClubDetailsPage = lazy(() => import("./pages/ClubDetailsPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AdminTeachers = lazy(() => import("./pages/AdminTeachers"));
const AdminSvedeniya = lazy(() => import("./pages/AdminSvedeniya"));
const AdminInstructions = lazy(() => import("./pages/AdminInstructions"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));

// School pages
const StudentDiary = lazy(() => import("./pages/school/StudentDiaryPage"));
const StudentGrades = lazy(() => import("./pages/school/StudentGradesPage"));
const StudentSchedule = lazy(() => import("./pages/school/StudentSchedulePage"));
const StudentProfile = lazy(() => import("./pages/school/StudentProfilePage"));
const StudentHomework = lazy(() => import("./pages/school/StudentHomeworkPage"));

// School Admin pages
const AdminUsers = lazy(() => import("./pages/school/admin/AdminUsersPage"));
const AdminClasses = lazy(() => import("./pages/school/admin/AdminClassesPage"));
const AdminSchedule = lazy(() => import("./pages/school/admin/AdminSchedulePage"));
const AdminGrades = lazy(() => import("./pages/school/admin/AdminGradesPage"));

// School Teacher and Parent pages
const TeacherJournal = lazy(() => import("./pages/school/TeacherJournalPage"));
const TeacherHomework = lazy(() => import("./pages/school/TeacherHomeworkPage"));
const ParentChildren = lazy(() => import("./pages/school/ParentChildrenPage"));

import ProtectedRoute from "@/components/admin/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import SchoolProtectedRoute from "@/components/school/SchoolProtectedRoute";

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/clubs" element={<ClubsPage />} />
            <Route path="/clubs/:slug" element={<ClubDetailsPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/news" element={<NewsIndex />} />
            <Route path="/news/:slug" element={<NewsPost />} />
            <Route path="/svedeniya" element={<Svedeniya />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute redirectTo="/admin">
                  <AdminLayout title="Дашборд">
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/access"
              element={
                <ProtectedRoute redirectTo="/admin">
                  <AdminLayout title="Доступ">
                    <AdminAccess />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/roles"
              element={
                <ProtectedRoute redirectTo="/admin">
                  <AdminLayout title="Роли">
                    <AdminRoles />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/news"
              element={
                <ProtectedRoute redirectTo="/admin">
                  <AdminLayout title="Новости">
                    <AdminNews />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/teachers"
              element={
                <ProtectedRoute redirectTo="/admin">
                  <AdminLayout title="Преподаватели">
                    <AdminTeachers />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/svedeniya"
              element={
                <ProtectedRoute redirectTo="/admin">
                  <AdminLayout title="Сведения">
                    <AdminSvedeniya />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sections"
              element={
                <ProtectedRoute redirectTo="/admin">
                  <AdminLayout title="Секции">
                    <AdminSections />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sections/hero"
              element={
                <ProtectedRoute redirectTo="/admin">
                  <AdminLayout title="Hero">
                    <AdminSectionHero />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sections/:id"
              element={
                <ProtectedRoute redirectTo="/admin">
                  <AdminLayout title="Редактор секции">
                    <AdminSectionHero />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/media"
              element={
                <ProtectedRoute redirectTo="/admin">
                  <AdminLayout title="Медиа">
                    <AdminMedia />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/instructions"
              element={
                <ProtectedRoute redirectTo="/admin">
                  <AdminLayout title="Инструкции">
                    <AdminInstructions />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* School Portal Routes */}
            <Route
              path="/school/diary"
              element={
                <SchoolProtectedRoute allowedRoles={['student', 'admin']}>
                  <StudentDiary />
                </SchoolProtectedRoute>
              }
            />
            <Route
              path="/school/grades"
              element={
                <SchoolProtectedRoute allowedRoles={['student', 'parent', 'admin']}>
                  <StudentGrades />
                </SchoolProtectedRoute>
              }
            />
            <Route
              path="/school/schedule"
              element={
                <SchoolProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <StudentSchedule />
                </SchoolProtectedRoute>
              }
            />
            <Route
              path="/school/homework-list"
              element={
                <SchoolProtectedRoute allowedRoles={['student', 'admin']}>
                  <StudentHomework />
                </SchoolProtectedRoute>
              }
            />
            <Route
              path="/school/profile"
              element={
                <SchoolProtectedRoute allowedRoles={['student', 'teacher', 'parent', 'admin']}>
                  <StudentProfile />
                </SchoolProtectedRoute>
              }
            />

            {/* School Teacher & Parent Routes */}
            <Route
              path="/school/journal"
              element={
                <SchoolProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <TeacherJournal />
                </SchoolProtectedRoute>
              }
            />
            <Route
              path="/school/homework"
              element={
                <SchoolProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <TeacherHomework />
                </SchoolProtectedRoute>
              }
            />
            <Route
              path="/school/children"
              element={
                <SchoolProtectedRoute allowedRoles={['parent', 'admin']}>
                  <ParentChildren />
                </SchoolProtectedRoute>
              }
            />

            {/* School Admin Routes */}
            <Route
              path="/school/admin/users"
              element={
                <SchoolProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </SchoolProtectedRoute>
              }
            />
            <Route
              path="/school/admin/classes"
              element={
                <SchoolProtectedRoute allowedRoles={['admin']}>
                  <AdminClasses />
                </SchoolProtectedRoute>
              }
            />
            <Route
              path="/school/admin/schedule"
              element={
                <SchoolProtectedRoute allowedRoles={['admin']}>
                  <AdminSchedule />
                </SchoolProtectedRoute>
              }
            />
            <Route
              path="/school/admin/grades"
              element={
                <SchoolProtectedRoute allowedRoles={['admin']}>
                  <AdminGrades />
                </SchoolProtectedRoute>
              }
            />

            <Route path="/school" element={<Navigate to="/school/diary" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
