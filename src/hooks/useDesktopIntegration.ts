/**
 * useDesktopIntegration Hook
 * Initialisiert Desktop-spezifische Features wenn die App in Electron läuft:
 * - CSS Variable für Titlebar-Höhe
 * - Tray-Navigation-Listener (React Router)
 * - Power-Resume-Listener (WebSocket-Reconnect)
 * - Keyboard Shortcuts (Ctrl+P, Ctrl+Shift+S)
 * - Toast-Listener vom Main Process
 * - Command Palette Trigger
 * - Helper-Exports für Tray Badge, Notifications, Flash Frame, Progress
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const isDesktop = Boolean(window.baunityDesktop?.isDesktop);
const TITLEBAR_HEIGHT = 38;

/** Set Tray badge count (open tasks) */
export function setTrayBadge(count: number): void {
  if (isDesktop) {
    window.baunityDesktop!.tray.setBadge(count);
  }
}

/** Show a native OS notification. Click navigates to route. */
export function showDesktopNotification(
  title: string,
  body: string,
  route?: string
): void {
  if (isDesktop) {
    window.baunityDesktop!.notifications.show({ title, body, route });
  }
}

/** Flash the taskbar icon to get attention */
export function flashFrame(): void {
  if (isDesktop) {
    window.baunityDesktop!.flash.frame();
  }
}

/** Set taskbar progress bar (0-1 for progress, -1 to clear) */
export function setProgress(value: number): void {
  if (isDesktop) {
    window.baunityDesktop!.progress.set(value);
  }
}

/** Check if the desktop window is currently focused */
export async function isWindowFocused(): Promise<boolean> {
  if (isDesktop) {
    return window.baunityDesktop!.window.isFocused();
  }
  return document.hasFocus();
}

/** Copy text to clipboard (native on Desktop, navigator.clipboard on Web) */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (isDesktop) {
    const result = await window.baunityDesktop!.clipboard.writeText(text);
    return result.success;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Screenshot to clipboard (Desktop only) */
export async function screenshotToClipboard(): Promise<boolean> {
  if (!isDesktop) return false;
  const result = await window.baunityDesktop!.capture.toClipboard();
  return result.success;
}

/** Native print current page (Desktop: native dialog, Web: window.print) */
export function printPage(): void {
  if (isDesktop) {
    window.baunityDesktop!.print.page();
  } else {
    window.print();
  }
}

/**
 * Main hook — call once in AdminLayout.
 * Sets up CSS variables, navigation listener, power resume handler,
 * keyboard shortcuts, and toast listener.
 */
export function useDesktopIntegration(
  options?: {
    showToast?: (message: string, type?: string) => void;
    openCommandPalette?: () => void;
  }
): void {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isDesktop) return;

    // CSS Variable für Titlebar-Höhe setzen
    document.documentElement.style.setProperty(
      "--desktop-titlebar-height",
      `${TITLEBAR_HEIGHT}px`
    );
    document.body.classList.add("is-desktop");

    // Tray-Navigation: Empfange Route von Main Process
    const unsubNav = window.baunityDesktop!.onNavigate((route: string) => {
      navigate(route);
    });

    // Power Resume: Seite neu laden für WebSocket-Reconnect
    const unsubResume = window.baunityDesktop!.onPowerResume(() => {
      window.location.reload();
    });

    // Toast from main process (e.g. screenshot feedback)
    const unsubToast = window.baunityDesktop!.onToast((data) => {
      if (options?.showToast) {
        options.showToast(data.message, data.type);
      }
    });

    // Command palette trigger from thumbar button
    const unsubCmd = window.baunityDesktop!.onOpenCommandPalette(() => {
      if (options?.openCommandPalette) {
        options.openCommandPalette();
      }
    });

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+P → Native print
      if (e.ctrlKey && !e.shiftKey && e.key === "p") {
        e.preventDefault();
        window.baunityDesktop!.print.page();
      }

      // Ctrl+Shift+S → Screenshot to clipboard
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        window.baunityDesktop!.capture.toClipboard().then((result) => {
          if (result.success && options?.showToast) {
            options.showToast("Screenshot kopiert!", "success");
          }
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.documentElement.style.removeProperty("--desktop-titlebar-height");
      document.body.classList.remove("is-desktop");
      document.removeEventListener("keydown", handleKeyDown);
      unsubNav();
      unsubResume();
      unsubToast();
      unsubCmd();
    };
  }, [navigate, options]);
}

export default useDesktopIntegration;
