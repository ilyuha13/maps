import { useContext } from "react";
import { ToastContext } from "../context/ToastContext";

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return {
    success: (message: string, duration?: number) => {
      context.addToast("success", message, duration);
    },
    error: (message: string, duration?: number) => {
      context.addToast("error", message, duration);
    },
    info: (message: string, duration?: number) => {
      context.addToast("info", message, duration);
    },
    remove: context.removeToast,
  };
};
