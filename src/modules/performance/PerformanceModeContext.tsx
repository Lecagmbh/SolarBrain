import { createContext, useContext, useEffect, useState } from "react";

type PerformanceModeContextType = {
  performanceMode: boolean;
};

const PerformanceModeContext = createContext<PerformanceModeContextType>({
  performanceMode: false,
});

export function usePerformanceMode() {
  return useContext(PerformanceModeContext);
}

export function PerformanceModeProvider({ children }: { children: React.ReactNode }) {
  const [performanceMode, setPerformanceMode] = useState(false);

  useEffect(() => {
    const isLowPower =
      typeof navigator !== "undefined" &&
      navigator.hardwareConcurrency &&
      navigator.hardwareConcurrency <= 4;

    const isMobile =
      typeof navigator !== "undefined" &&
      /iphone|android/i.test(navigator.userAgent);

    if (isLowPower || isMobile) {
      setPerformanceMode(true);
    }
  }, []);

  return (
    <PerformanceModeContext.Provider value={{ performanceMode }}>
      {children}
    </PerformanceModeContext.Provider>
  );
}
