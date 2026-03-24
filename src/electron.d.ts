/**
 * Baunity Desktop (Electron) – TypeScript type declarations
 *
 * Provides types for `window.baunityDesktop` which is exposed
 * by the Electron preload script via contextBridge.
 *
 * This file covers all namespaces, methods, and event listeners
 * available in the desktop environment.
 */

// ---------------------------------------------------------------------------
// Shared helper types
// ---------------------------------------------------------------------------

interface DialogFileFilter {
  name: string;
  extensions: string[];
}

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Main interface
// ---------------------------------------------------------------------------

interface BaunityDesktop {
  // -- Root properties ------------------------------------------------------

  readonly isDesktop: true;
  readonly platform: string;
  readonly version: string;

  // -- credentials ----------------------------------------------------------

  credentials: {
    save(email: string, password: string): Promise<{ success: boolean }>;
    load(): Promise<{ email: string; password: string } | null>;
    delete(): Promise<{ success: boolean }>;
  };

  // -- window ---------------------------------------------------------------

  window: {
    isFocused(): Promise<boolean>;
    open(opts: {
      url: string;
      title?: string;
      width?: number;
      height?: number;
    }): Promise<{ success: boolean; id?: number }>;
    pip(opts: {
      url: string;
      width?: number;
      height?: number;
    }): Promise<{ success: boolean; id?: number }>;
    setKiosk(enabled: boolean): Promise<{ success: boolean }>;
    setAlwaysOnTop(enabled: boolean, level?: string): Promise<{ success: boolean }>;
    setFullscreen(enabled: boolean): Promise<{ success: boolean }>;
    getAll(): Promise<
      Array<{
        id: number;
        title: string;
        bounds: WindowBounds;
        focused: boolean;
        visible: boolean;
      }>
    >;
    close(windowId: number): Promise<{ success: boolean }>;
  };

  // -- tray -----------------------------------------------------------------

  tray: {
    setBadge(count: number): void;
  };

  // -- notifications --------------------------------------------------------

  notifications: {
    show(opts: { title: string; body: string; route?: string }): void;
    showWithActions(opts: {
      title: string;
      body: string;
      actions?: string[];
      route?: string;
      icon?: string;
    }): Promise<{ success: boolean }>;
    showSilent(opts: {
      title: string;
      body: string;
      route?: string;
    }): Promise<{ success: boolean }>;
  };

  // -- autostart ------------------------------------------------------------

  autostart: {
    isEnabled(): Promise<boolean>;
    toggle(): Promise<boolean>;
  };

  // -- flash ----------------------------------------------------------------

  flash: {
    frame(): void;
  };

  // -- progress -------------------------------------------------------------

  progress: {
    set(value: number): void;
  };

  // -- dialog ---------------------------------------------------------------

  dialog: {
    saveFile(opts: {
      data: string;
      filename: string;
      filters?: DialogFileFilter[];
    }): Promise<{ success: boolean; filePath?: string; canceled?: boolean }>;

    openFile(opts: {
      filters?: DialogFileFilter[];
    }): Promise<{ success: boolean; data?: string; filePath?: string; canceled?: boolean }>;

    selectDirectory(opts?: {
      title?: string;
      defaultPath?: string;
    }): Promise<{ success: boolean; path?: string; canceled?: boolean }>;

    openFiles(opts?: {
      title?: string;
      filters?: DialogFileFilter[];
      multi?: boolean;
    }): Promise<{
      success: boolean;
      files?: Array<{ name: string; path: string; data: string }>;
      canceled?: boolean;
    }>;

    messageBox(opts: {
      type?: string;
      title: string;
      message: string;
      detail?: string;
      buttons?: string[];
      defaultId?: number;
      checkboxLabel?: string;
    }): Promise<{ response: number; checkboxChecked?: boolean }>;

    error(opts: { title: string; content: string }): Promise<{ success: boolean }>;
  };

  // -- briefcase ------------------------------------------------------------

  briefcase: {
    export(data: {
      installation: unknown;
      documents: unknown[];
    }): Promise<{ success: boolean; path?: string }>;
    list(): Promise<
      Array<{
        id: string;
        publicId: string;
        customerName: string;
        exportedAt: string;
        path: string;
      }>
    >;
    delete(data: { id: string }): Promise<{ success: boolean }>;
  };

  // -- print ----------------------------------------------------------------

  print: {
    page(): Promise<{ success: boolean }>;
    pdf(data: { base64Data: string }): Promise<{ success: boolean }>;
    getPrinters(): Promise<
      Array<{ name: string; isDefault: boolean; status: number }>
    >;
    silent(opts: {
      deviceName?: string;
      copies?: number;
      pageRanges?: Array<{ from: number; to: number }>;
    }): Promise<{ success: boolean; error?: string }>;
    pageToPdf(opts?: {
      pageSize?: string;
      landscape?: boolean;
      margins?: { top: number; bottom: number; left: number; right: number };
    }): Promise<{ success: boolean; data?: string; error?: string }>;
    pageToPdfFile(opts?: {
      pageSize?: string;
      landscape?: boolean;
    }): Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
  };

  // -- clipboard ------------------------------------------------------------

  clipboard: {
    writeText(text: string): Promise<{ success: boolean }>;
    writeImage(base64: string): Promise<{ success: boolean }>;
    read(): Promise<{
      text: string;
      html: string;
      rtf: string;
      formats: string[];
      hasImage: boolean;
    }>;
    writeMulti(opts: {
      text?: string;
      html?: string;
      rtf?: string;
    }): Promise<{ success: boolean }>;
    readImage(): Promise<{ success: boolean; data: string | null }>;
    clear(): Promise<{ success: boolean }>;
    startWatch(): Promise<{ success: boolean }>;
    stopWatch(): Promise<{ success: boolean }>;
  };

  // -- capture --------------------------------------------------------------

  capture: {
    toClipboard(): Promise<{ success: boolean }>;
    toFile(): Promise<{ success: boolean; filePath?: string }>;
  };

  // -- shell ----------------------------------------------------------------

  shell: {
    openPath(folderPath: string): Promise<string>;
  };

  // -- portal ---------------------------------------------------------------

  portal: {
    openImpersonate(opts: {
      url: string;
      userName: string;
    }): Promise<{ success: boolean }>;
  };

  // -- system ---------------------------------------------------------------

  system: {
    info(): Promise<{
      cpu: unknown;
      mem: unknown;
      os: unknown;
      graphics: unknown;
      battery: unknown;
      disk: unknown;
    }>;
    gpuInfo(): Promise<unknown>;
    battery(): Promise<{
      hasBattery: boolean;
      isCharging: boolean;
      percent: number;
      timeRemaining: number;
    }>;
    idleTime(): Promise<number>;
    idleState(threshold?: number): Promise<string>;
    locale(): Promise<{
      locale: string;
      systemLocale: string;
      preferredLanguages: string[];
    }>;
    appMetrics(): Promise<
      Array<{ pid: number; type: string; cpu: unknown; memory: unknown }>
    >;
    displays(): Promise<
      Array<{
        id: number;
        bounds: WindowBounds;
        workArea: unknown;
        scaleFactor: number;
        isPrimary: boolean;
      }>
    >;
    paths(): Promise<Record<string, string>>;
    appInfo(): Promise<{
      name: string;
      version: string;
      locale: string;
      isPackaged: boolean;
      resourcesPath: string;
    }>;
  };

  // -- theme ----------------------------------------------------------------

  theme: {
    get(): Promise<{
      shouldUseDarkColors: boolean;
      themeSource: string;
      accentColor: string;
    }>;
    setSource(source: "system" | "light" | "dark"): Promise<{ success: boolean }>;
    accentColor(): Promise<string>;
  };

  // -- accessibility --------------------------------------------------------

  accessibility: {
    isScreenReaderActive(): Promise<boolean>;
    setEnabled(enabled: boolean): Promise<{ success: boolean }>;
  };

  // -- security -------------------------------------------------------------

  security: {
    setContentProtection(enabled: boolean): Promise<{ success: boolean }>;
    startIdleWatch(timeoutSeconds: number): Promise<{ success: boolean }>;
    stopIdleWatch(): Promise<{ success: boolean }>;
  };

  // -- spellcheck -----------------------------------------------------------

  spellcheck: {
    setLanguages(languages: string[]): Promise<{ success: boolean }>;
    getLanguages(): Promise<string[]>;
    addWord(word: string): Promise<{ success: boolean }>;
    getAvailableLanguages(): Promise<string[]>;
  };

  // -- log ------------------------------------------------------------------

  log: {
    write(level: string, message: string, data?: unknown): Promise<{ success: boolean }>;
    getPath(): Promise<string>;
    readRecent(lines?: number): Promise<string[]>;
  };

  // -- scheduler ------------------------------------------------------------

  scheduler: {
    create(opts: {
      id: string;
      schedule: string;
      event: string;
    }): Promise<{ success: boolean; error?: string }>;
    stop(id: string): Promise<{ success: boolean }>;
    list(): Promise<string[]>;
    stopAll(): Promise<{ success: boolean }>;
  };

  // -- file -----------------------------------------------------------------

  file: {
    openWith(filePath: string): Promise<string>;
    showInFolder(filePath: string): void;
    trash(filePath: string): Promise<{ success: boolean }>;
    openExternal(url: string): Promise<{ success: boolean }>;
    createZip(opts: {
      outputPath: string;
      files: Array<{ name: string; base64: string }>;
    }): Promise<{ success: boolean; path?: string; error?: string }>;
    watchDir(dirPath: string): Promise<{ success: boolean }>;
    unwatchDir(dirPath: string): Promise<{ success: boolean }>;
    readBase64(filePath: string): Promise<{ success: boolean; data?: string; error?: string }>;
    addRecent(filePath: string): Promise<{ success: boolean }>;
    clearRecent(): Promise<{ success: boolean }>;
    startDrag(opts: { file: string; icon?: string }): void;
  };

  // -- network --------------------------------------------------------------

  network: {
    isOnline(): Promise<boolean>;
    resolveProxy(url: string): Promise<string>;
    setProxy(config: {
      proxyRules?: string;
      proxyBypassRules?: string;
    }): Promise<{ success: boolean }>;
    fetch(opts: {
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    }): Promise<{
      success: boolean;
      status?: number;
      headers?: Record<string, string>;
      data?: string;
      error?: string;
    }>;
  };

  // -- diagnostic -----------------------------------------------------------

  diagnostic: {
    startNetLog(opts?: { path?: string }): Promise<{ success: boolean; filePath?: string }>;
    stopNetLog(): Promise<{ success: boolean; logPath?: string }>;
    startTracing(opts?: { categories?: string[] }): Promise<{ success: boolean }>;
    stopTracing(): Promise<{ success: boolean; filePath?: string }>;
    startCrashReporter(opts?: { submitURL?: string }): Promise<{ success: boolean }>;
    getCrashDumps(): Promise<Array<{ name: string; path: string; size: number }>>;
    processInfo(): Promise<{
      pid: number;
      ppid: number;
      arch: string;
      platform: string;
      nodeVersion: string;
      electronVersion: string;
      chromeVersion: string;
      v8Version: string;
      uptime: number;
      memoryUsage: unknown;
      cpuUsage: unknown;
      cwd: string;
    }>;
  };

  // -- session --------------------------------------------------------------

  session: {
    setDownloadPath(downloadPath: string): Promise<{ success: boolean }>;
    clearData(opts?: {
      storages?: string[];
      quotas?: string[];
    }): Promise<{ success: boolean }>;
    getCookies(filter?: Record<string, string>): Promise<
      Array<{ name: string; value: string; domain: string; path: string }>
    >;
    setCookie(cookie: {
      url: string;
      name: string;
      value: string;
      domain?: string;
      path?: string;
    }): Promise<{ success: boolean }>;
    removeCookie(opts: { url: string; name: string }): Promise<{ success: boolean }>;
    loadExtension(extensionPath: string): Promise<{
      success: boolean;
      id?: string;
      name?: string;
    }>;
  };

  // -- qrcode ---------------------------------------------------------------

  qrcode: {
    generate(opts: {
      text: string;
      options?: {
        width?: number;
        margin?: number;
        dark?: string;
        light?: string;
        errorCorrectionLevel?: string;
      };
    }): Promise<{ success: boolean; dataUrl?: string }>;
    generateToFile(opts: {
      text: string;
      options?: { width?: number; margin?: number };
    }): Promise<{ success: boolean; filePath?: string; canceled?: boolean }>;
  };

  // -- excel ----------------------------------------------------------------

  excel: {
    export(opts: {
      sheets: Array<{
        name?: string;
        headers?: string[];
        rows?: unknown[][];
      }>;
      filename?: string;
    }): Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
  };

  // -- media ----------------------------------------------------------------

  media: {
    ttsAvailable(): Promise<boolean>;
    getScreenSources(): Promise<
      Array<{
        id: string;
        name: string;
        thumbnail: string;
        appIcon: string | null;
        display_id: string;
      }>
    >;
    preventSleep(opts: {
      reason?: string;
      type?: "display" | "app";
    }): Promise<{ success: boolean; key?: string; id?: number }>;
    allowSleep(key: string): Promise<{ success: boolean }>;
    beep(): Promise<{ success: boolean }>;
  };

  // -- recent ---------------------------------------------------------------

  recent: {
    addInstallation(installation: {
      id: number;
      publicId?: string;
      customerName?: string;
    }): void;
  };

  // -- Event listeners (all return cleanup function) ------------------------

  onNavigate(callback: (route: string) => void): () => void;
  onPowerResume(callback: () => void): () => void;
  onPowerSuspend(callback: () => void): () => void;
  onPowerLockScreen(callback: () => void): () => void;
  onPowerUnlockScreen(callback: () => void): () => void;
  onPowerOnBattery(callback: () => void): () => void;
  onPowerOnAC(callback: () => void): () => void;
  onPowerShutdown(callback: () => void): () => void;
  onToast(callback: (data: { type: string; message: string }) => void): () => void;
  onOpenCommandPalette(callback: (searchText?: string) => void): () => void;
  onThemeChanged(
    callback: (data: { shouldUseDarkColors: boolean; themeSource: string }) => void
  ): () => void;
  onAccessibilityChanged(callback: (data: { isActive: boolean }) => void): () => void;
  onSecurityIdleTimeout(callback: () => void): () => void;
  onSchedulerTriggered(callback: (data: { id: string; event: string }) => void): () => void;
  onClipboardChanged(callback: (data: { text: string }) => void): () => void;
  onNotificationClosed(callback: (data: { title: string }) => void): () => void;
  onDownloadProgress(
    callback: (data: {
      filename: string;
      received: number;
      total: number;
      state: string;
    }) => void
  ): () => void;
  onDownloadComplete(
    callback: (data: { filename: string; path: string; state: string }) => void
  ): () => void;
  onWindowUnresponsive(callback: () => void): () => void;
  onWindowResponsive(callback: () => void): () => void;
}

// ---------------------------------------------------------------------------
// Global window extension
// ---------------------------------------------------------------------------

interface Window {
  baunityDesktop?: BaunityDesktop;
}
