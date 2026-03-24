import type { ReactNode, MouseEvent } from "react";
interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, children, maxWidth = "max-w-5xl" }: ModalProps) {
  if (!open) return null;

  const handleBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4"
      onClick={handleBackdrop}
    >
      <div
        className={`bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-hidden flex flex-col`}
      >
        <div className="flex justify-end p-2">
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-xs"
          >
            ✕
          </button>
        </div>
        <div className="px-6 pb-5 pt-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
