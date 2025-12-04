import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ToastContainer } from "./components/Toast/ToastContainer";
import "./index.css";
import "ol/ol.css";
import { ToastProvider } from "./context/ToastContext.tsx";

createRoot(document.getElementById("root")!).render(
  <ToastProvider>
    <App />
    <ToastContainer />
  </ToastProvider>
);
