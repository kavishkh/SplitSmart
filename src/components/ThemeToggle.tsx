import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const [isBlackTheme, setIsBlackTheme] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or respect OS preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "black" || (!savedTheme && prefersDark)) {
      setIsBlackTheme(true);
      document.documentElement.classList.add("black-theme");
    }
  }, []);

  const toggleTheme = () => {
    if (isBlackTheme) {
      document.documentElement.classList.remove("black-theme");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("black-theme");
      localStorage.setItem("theme", "black");
    }
    setIsBlackTheme(!isBlackTheme);
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className="theme-transition hover:bg-gray-800 hover:text-white hover:scale-110 transition-all duration-300"
    >
      {isBlackTheme ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};