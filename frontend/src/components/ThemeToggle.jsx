import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.jsx';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`p-2 rounded-lg text-muted hover:text-primary hover:bg-subtle transition-colors ${className}`}
    >
      {theme === 'dark'
        ? <Sun size={20} strokeWidth={1.5} />
        : <Moon size={20} strokeWidth={1.5} />
      }
    </button>
  );
}
