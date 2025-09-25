import { createContext, useContext, useEffect, ReactNode } from "react";

type ThemeProviderProps = {
  children: ReactNode;
};

type ThemeProviderState = {
  isDark: boolean;
};

const initialState: ThemeProviderState = {
  isDark: false,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  useEffect(() => {
    // Always use light theme - ensure no dark class is applied
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add("light");
  }, []);

  const value = {
    isDark: false, // Always light theme
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};