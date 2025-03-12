import React, { createContext, useState, useContext, useEffect } from "react";

type FrameworkContextType = {
  framework: string | null;
  setFramework: (framework: string | null) => void;
};

const FrameworkContext = createContext<FrameworkContextType>({
  framework: null,
  setFramework: () => {},
});

export function FrameworkProvider({ children }: { children: React.ReactNode }) {
  const [framework, setFramework] = useState<string | null>(() => {
    // Try to get from sessionStorage first, then fallback to null
    return sessionStorage.getItem("selectedFramework") || null;
  });

  // Sync framework state to sessionStorage whenever it changes
  useEffect(() => {
    if (framework) {
      sessionStorage.setItem("selectedFramework", framework);
    }
  }, [framework]);

  return (
    <FrameworkContext.Provider value={{ framework, setFramework }}>
      {children}
    </FrameworkContext.Provider>
  );
}

export function useFramework() {
  return useContext(FrameworkContext);
}
