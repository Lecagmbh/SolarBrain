import { useToastContext } from "./ToastContext";

export function useToast() {
  const ctx = useToastContext();
  return {
    push: ctx.push,
  };
}
