import { useContext } from "react";
import { Toast } from "./Toast";
import css from "./Toast.module.css";
import { ToastContext } from "../../context/ToastContext";

export function ToastContainer() {
  const context = useContext(ToastContext);

  if (!context) {
    return null;
  }

  const { toasts, removeToast } = context;

  return (
    <div className={css.toastContainer}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}
