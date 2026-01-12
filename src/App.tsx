import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/context/AuthProvider";
import AdminGuard from "@/components/admin/AdminGuard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Categoria from "./pages/Categoria";
import Categorias from "./pages/Categorias";
import Sobre from "./pages/Sobre";
import Institucional from "./pages/Institucional";
import GravacaoLaser from "./pages/GravacaoLaser";
import Garantia from "./pages/Garantia";
import Trocas from "./pages/Trocas";
import Contato from "./pages/Contato";
import Buscar from "./pages/Buscar";
import Carrinho from "./pages/Carrinho";
import Produto from "./pages/Produto";
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminProducts from "./components/admin/AdminProducts";
import AdminProductForm from "./components/admin/AdminProductForm";
import AdminCarousel from "./components/admin/AdminCarousel";
import AdminSettings from "./components/admin/AdminSettings";
import AdminUsers from "./components/admin/AdminUsers";
import AdminCategories from "./components/admin/AdminCategories";
import AdminCollections from "./components/admin/AdminCollections";
import AdminCatalogs from "./components/admin/AdminCatalogs";
import AdminOrders from "./components/admin/AdminOrders";
import AdminCoupons from "./components/admin/AdminCoupons";
import Colecoes from "./pages/Colecoes";
import Catalogos from "./pages/Catalogos";
import Finalizar from "./pages/Finalizar";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/categoria/:slug" element={<Categoria />} />
            <Route path="/categorias" element={<Categorias />} />
            <Route path="/colecoes" element={<Colecoes />} />
            <Route path="/catalogos" element={<Catalogos />} />
            <Route path="/produto/:id" element={<Produto />} />
            <Route path="/buscar" element={<Buscar />} />
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/finalizar" element={<Finalizar />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/institucional" element={<Institucional />} />
            <Route path="/gravacao-a-laser" element={<GravacaoLaser />} />
            <Route path="/garantia" element={<Garantia />} />
            <Route path="/trocas" element={<Trocas />} />
            <Route path="/contato" element={<Contato />} />
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
            <Route path="/admin/products" element={<AdminGuard><AdminProducts /></AdminGuard>} />
            <Route path="/admin/products/new" element={<AdminGuard><AdminProductForm /></AdminGuard>} />
            <Route path="/admin/products/:id/edit" element={<AdminGuard><AdminProductForm /></AdminGuard>} />
            <Route path="/admin/carousel" element={<AdminGuard><AdminCarousel /></AdminGuard>} />
            <Route path="/admin/users" element={<AdminGuard><AdminUsers /></AdminGuard>} />
            <Route path="/admin/collections" element={<AdminGuard><AdminCollections /></AdminGuard>} />
            <Route path="/admin/catalogos" element={<AdminGuard><AdminCatalogs /></AdminGuard>} />
            <Route path="/admin/orders" element={<AdminGuard><AdminOrders /></AdminGuard>} />
            <Route path="/admin/coupons" element={<AdminGuard><AdminCoupons /></AdminGuard>} />
            <Route path="/admin/settings" element={<AdminGuard><AdminSettings /></AdminGuard>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
