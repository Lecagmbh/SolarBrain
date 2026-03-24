import { createContext, useContext } from "react";

type GlobalEmailStoreType = {
  unassignedCount: number;
};

const GlobalEmailStore = createContext<GlobalEmailStoreType>({
  unassignedCount: 0,
});

export function useGlobalEmailStore() {
  return useContext(GlobalEmailStore);
}

export function GlobalEmailStoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <GlobalEmailStore.Provider value={{ unassignedCount: 0 }}>
      {children}
    </GlobalEmailStore.Provider>
  );
}
