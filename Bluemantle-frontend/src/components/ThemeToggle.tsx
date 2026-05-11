"use client";

import { useEffect, useState } from "react";
import "./ThemeToggle.css";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDarkMode = document.documentElement.classList.contains("dark") || 
                       localStorage.theme === 'dark';
    
    if (isDarkMode) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  if (!mounted) return <div className="w-[60px] h-[30px]" />; // Skeleton

  return (
    <label className="theme-switch transform scale-[0.6] origin-right ml-4">
      <input 
        type="checkbox" 
        className="theme-switch__checkbox"
        id="theme-checkbox" 
        checked={isDark}
        onChange={toggleTheme}
      />
      <div className="theme-switch__container">
        <div className="theme-switch__clouds"></div>
        <div className="theme-switch__stars-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 55" fill="none">
            <path fill="currentColor" d="M103.491 54.0625L104.793 49.336L109.122 51.5283L107.039 47.1656L111.455 45.197L106.822 43.766L108.36 39.1235L104.593 42.8252L101.408 39.1235L102.395 43.8967L97.7617 45.4216L102.164 47.2625L100.122 51.6441L104.425 49.3855L103.491 54.0625Z"></path>
            <path fill="currentColor" d="M37.9736 17.5255L34.1979 12.0125L40.2373 10.3705L35.2536 6.30519L39.8826 1.70014L34.05 3.3276L32.1866 -2.4375L30.9326 3.49887L24.8931 1.85686L29.3562 6.44474L24.636 10.9631L30.5592 9.47545L32.3225 15.3429L33.6841 9.49755L37.9736 17.5255Z"></path>
            <path fill="currentColor" d="M129.563 21.0503L129.213 14.6186L135.204 13.9238L129.742 10.7412L133.565 5.56846L127.535 7.42398L124.965 1.45264L124.515 7.84275L118.524 8.53755L123.518 11.2427L119.593 16.3262L125.688 14.6214L128.149 20.6558L127.8 14.2238L129.563 21.0503Z"></path>
          </svg>
        </div>
        <div className="theme-switch__circle-container">
          <div className="theme-switch__sun-moon-container">
            <div className="theme-switch__moon">
              <div className="theme-switch__spot"></div>
              <div className="theme-switch__spot"></div>
              <div className="theme-switch__spot"></div>
            </div>
          </div>
        </div>
      </div>
    </label>
  );
}
