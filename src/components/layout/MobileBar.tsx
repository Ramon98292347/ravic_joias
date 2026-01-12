import { Home, Search, Grid3X3, ShoppingBag } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const MobileBar = () => {
  const location = useLocation();

  const items = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Buscar", href: "/buscar" },
    { icon: Grid3X3, label: "Coleções", href: "/colecoes" },
    { icon: Grid3X3, label: "Catálogos", href: "/catalogos" },
    { icon: ShoppingBag, label: "Carrinho", href: "/carrinho" },
  ];

  return (
    <div className="mobile-bar md:hidden">
      {items.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.label}
            to={item.href}
            className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${
              isActive ? "text-primary" : "text-muted"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default MobileBar;
