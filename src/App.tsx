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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/news" element={<NewsIndex />} />
          <Route path="/news/:slug" element={<NewsPost />} />
          <Route path="/svedeniya" element={<Svedeniya />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/media"
            element={
              <ProtectedRoute redirectTo="/">
                <AdminMedia />
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
