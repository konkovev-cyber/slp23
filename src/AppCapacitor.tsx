import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Lazy-loaded school components
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

// School Auth pages
const SchoolLogin = lazy(() => import("./pages/school/SchoolLoginPage"));
const SignupPage = lazy(() => import("./pages/school/SignupPage"));
const PendingApprovalPage = lazy(() => import("./pages/school/PendingApprovalPage"));

import SchoolProtectedRoute from "@/components/school/SchoolProtectedRoute";

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

/**
 * Приложение для APK версии
 * Только школьный портал - без лендинга и админки сайта
 */
const AppCapacitor = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* APK: При заходе на корень сразу показываем вход */}
            <Route path="/" element={<Navigate to="/school/login" replace />} />
            
            {/* School Auth Routes */}
            <Route path="/school/login" element={<SchoolLogin />} />
            <Route path="/school/signup" element={<SignupPage />} />
            <Route path="/school/pending" element={<PendingApprovalPage />} />

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

            {/* Catch-all redirect to login */}
            <Route path="*" element={<Navigate to="/school/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default AppCapacitor;
