import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Removido: sincronização automática de admin_users no refresh/sign-in para evitar 409 e corridas de hidratação.

createRoot(document.getElementById("root")!).render(<App />);
