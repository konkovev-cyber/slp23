import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NewsIndex from "./pages/NewsIndex";
import NewsPost from "./pages/NewsPost";
import Svedeniya from "./pages/Svedeniya";
import AdminMedia from "./pages/AdminMedia";
import AdminLogin from "./pages/AdminLogin";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAccess from "./pages/AdminAccess";
import AdminSections from "./pages/AdminSections";
import AdminSectionHero from "./pages/AdminSectionHero";
import GalleryPage from "./pages/GalleryPage";
import AdminRoles from "./pages/AdminRoles";
import AdminNews from "./pages/AdminNews";
import AboutPage from "./pages/AboutPage";
import ProgramsPage from "./pages/ProgramsPage";
import ClubsPage from "./pages/ClubsPage";
import ClubDetailsPage from "./pages/ClubDetailsPage";
import ContactPage from "./pages/ContactPage";
import AdminTeachers from "./pages/AdminTeachers";
import AdminSvedeniya from "./pages/AdminSvedeniya";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
              <AdminLayout title="Доступ">
                <AdminAccess />
              </AdminLayout>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
