import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { SolanaWalletProvider } from "./contexts/SolanaWalletContext";
import { Toaster } from "./components/ui/toaster";

createRoot(document.getElementById("root")!).render(
  <SolanaWalletProvider>
    <App />
    <Toaster />
  </SolanaWalletProvider>
);
