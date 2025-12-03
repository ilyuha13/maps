import { useEffect, useState } from "react";
import type { Toast as ToastType } from "../../types";
import css from "./Toast.module.css";

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(toast.id), 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "info":
        return "ℹ";
      default:
        return "ℹ";
    }
  };

  return (
    <div
      className={`${css.toast} ${css[toast.type]} ${
        isVisible ? css.visible : ""
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className={css.icon}>{getIcon()}</div>
      <div className={css.message}>{toast.message}</div>
      <button
        className={css.closeButton}
        onClick={handleClose}
        aria-label="Закрыть уведомление"
      >
        ✕
      </button>
    </div>
  );
}
