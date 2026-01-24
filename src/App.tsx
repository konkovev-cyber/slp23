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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/news" element={<NewsIndex />} />
          <Route path="/news/:slug" element={<NewsPost />} />
          <Route path="/svedeniya" element={<Svedeniya />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute redirectTo="/">
                <AdminLayout title="Дашборд">
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/access"
            element={
              <ProtectedRoute redirectTo="/">
                <AdminLayout title="Доступ">
                  <AdminAccess />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sections"
            element={
              <ProtectedRoute redirectTo="/">
                <AdminLayout title="Секции">
                  <AdminSections />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sections/hero"
            element={
              <ProtectedRoute redirectTo="/">
                <AdminLayout title="Hero">
                  <AdminSectionHero />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sections/:id"
            element={
              <ProtectedRoute redirectTo="/">
                <AdminLayout title="Редактор секции">
                  <AdminSectionHero />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/media"
            element={
              <ProtectedRoute redirectTo="/">
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
