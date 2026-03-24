import { useToastContext } from "./ToastContext";
import "./toast.css";

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

export function ToastContainer() {
  const { toasts, remove } = useToastContext();

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-item toast-${t.type}`}
          onClick={() => remove(t.id)}
        >
          {safeString(t.message)}
        </div>
      ))}
    </div>
  );
}
