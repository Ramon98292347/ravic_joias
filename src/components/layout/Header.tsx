import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Search, User, ShoppingBag, X, Heart, Home, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cartService } from "@/services/cart";

const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);

  const navLinks: Array<{ name: string; href: string }> = [];

  useEffect(() => {
    const refresh = async () => {
      const items = await cartService.listItems();
      const count = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
      setCartCount(count);
    };
    refresh();
    const onUpdated = () => refresh();
    window.addEventListener("cart:updated", onUpdated);
    window.addEventListener("focus", onUpdated);
    document.addEventListener("visibilitychange", onUpdated);
    return () => {
      window.removeEventListener("cart:updated", onUpdated);
      window.removeEventListener("focus", onUpdated);
      document.removeEventListener("visibilitychange", onUpdated);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-foreground hover:text-primary">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-background border-border">
              <nav className="flex flex-col gap-6 mt-8">
                <div className="border-t border-border pt-6 mt-4">
                  <Link to="/sobre" className="block text-sm text-muted hover:text-primary transition-colors mb-4">
                    Sobre a Ravic
                  </Link>
                  <Link to="/contato" className="block text-sm text-muted hover:text-primary transition-colors">
                    Contato
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 w-32">
            <h1 className="font-serif text-2xl md:text-3xl tracking-wider text-foreground">
              <span className="text-primary">R</span>AVIC
              <span className="block text-[10px] md:text-xs tracking-[0.3em] text-muted font-sans font-light -mt-1">
                JOIAS
              </span>
            </h1>
          </Link>

          {/* Desktop Navigation Buttons */}
          <nav className="hidden md:flex items-center gap-6 flex-1 justify-evenly max-w-lg">
            <Link
              to="/"
              className="flex flex-col items-center gap-1 px-3 py-2 text-muted hover:text-primary transition-colors"
            >
              <Home className="h-5 w-5" />
              <span className="text-xs font-medium">Home</span>
            </Link>
            <Link
              to="/colecoes"
              className="flex flex-col items-center gap-1 px-3 py-2 text-muted hover:text-primary transition-colors"
            >
              <Grid3X3 className="h-5 w-5" />
              <span className="text-xs font-medium">Coleções</span>
            </Link>
            <Link
              to="/buscar"
              className="flex flex-col items-center gap-1 px-3 py-2 text-muted hover:text-primary transition-colors"
            >
              <Search className="h-5 w-5" />
              <span className="text-xs font-medium">Buscar</span>
            </Link>
            <Link
              to="/carrinho"
              className="flex flex-col items-center gap-1 px-3 py-2 text-muted hover:text-primary transition-colors relative"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="text-xs font-medium">Carrinho</span>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary text-[8px] font-medium flex items-center justify-center text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>

          <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center max-w-2xl"></nav>

          {/* Icons */}
          <div className="flex items-center gap-2 md:gap-4 w-32 justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:text-primary"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>
            <Link to="/admin/login">
              <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/carrinho">
              <Button variant="ghost" size="icon" className="relative text-foreground hover:text-primary">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium flex items-center justify-center text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="py-4 border-t border-border/50 animate-fade-in">
            <form 
              className="relative max-w-xl mx-auto"
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  window.location.href = `/buscar?q=${encodeURIComponent(searchQuery)}`;
                }
              }}
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
              <input
                type="text"
                placeholder="Buscar joias, relógios, canetas..."
                className="w-full pl-12 pr-4 py-3 bg-secondary/50 border border-border rounded-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
