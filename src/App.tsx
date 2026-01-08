import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Categoria from "./pages/Categoria";
import Categorias from "./pages/Categorias";
import Sobre from "./pages/Sobre";
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
import AdminOrders from "./components/admin/AdminOrders";
import AdminCoupons from "./components/admin/AdminCoupons";
import Colecoes from "./pages/Colecoes";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/categoria/:slug" element={<Categoria />} />
            <Route path="/categorias" element={<Categorias />} />
            <Route path="/colecoes" element={<Colecoes />} />
            <Route path="/produto/:id" element={<Produto />} />
            <Route path="/buscar" element={<Buscar />} />
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/contato" element={<Contato />} />
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/products/new" element={<AdminProductForm />} />
            <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
            <Route path="/admin/carousel" element={<AdminCarousel />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/collections" element={<AdminCollections />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
