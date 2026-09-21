import { useState, useEffect, useCallback, useContext } from 'react';
import { Sun, Moon } from 'lucide-react';
import { ThemeContext } from '../../../context/ThemeContext';

/**
 * ThemeSlider — Premium iOS/macOS styled capsule slider for switching themes.
 *
 * Features:
 * - Direct visual match to pill design with embedded sun & moon glyphs.
 * - Sliding circular thumb containing the illuminated active icon.
 * - Works universally across every domain/portal (Admin, Student, Instructor, Auth, Platform).
 * - Bi-directional sync with ThemeContext, localStorage ('lms-theme'), and <html> data-theme attribute.
 * - Accessible with role="switch", keyboard navigation (Enter / Space), and focus rings.
 *
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Dimensions size preset
 * @param {string} [props.className] - Optional extra class names
 * @param {Object} [props.style] - Optional extra styles
 * @param {boolean} [props.showTooltip=true] - Whether to show title tooltip
 */
export const ThemeSlider = ({
  size = 'md',
  className = '',
  style = {},
  showTooltip = true,
}) => {
  // Try to use ThemeContext if rendered inside ThemeProvider
  const context = useContext(ThemeContext);

  // Fallback / standalone detection from DOM & localStorage
  const getInitialTheme = () => {
    if (context?.theme) return context.theme;
    if (typeof window !== 'undefined') {
      const domTheme = document.documentElement.getAttribute('data-theme');
      if (domTheme === 'light' || domTheme === 'dark') return domTheme;
      const stored = localStorage.getItem('lms-theme');
      if (stored === 'light' || stored === 'dark') return stored;
    }
    return 'dark';
  };

  const [currentTheme, setCurrentTheme] = useState(getInitialTheme);
  const isDark = currentTheme === 'dark';

  // Sync state if context or DOM changes
  useEffect(() => {
    if (context?.theme && context.theme !== currentTheme) {
      setCurrentTheme(context.theme);
    }
  }, [context?.theme]);

  // Listen to external theme changes across tabs/windows/DOM
  useEffect(() => {
    const handleThemeChange = (e) => {
      const newTheme = e.detail || localStorage.getItem('lms-theme');
      if (newTheme && (newTheme === 'light' || newTheme === 'dark')) {
        setCurrentTheme(newTheme);
      }
    };

    const handleStorage = (e) => {
      if (e.key === 'lms-theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setCurrentTheme(e.newValue);
      }
    };

    window.addEventListener('lms-theme-change', handleThemeChange);
    window.addEventListener('storage', handleStorage);

    // Mutation observer on <html> tag to catch any programmatic theme switches
    const observer = new MutationObserver(() => {
      const attr = document.documentElement.getAttribute('data-theme');
      if (attr && (attr === 'light' || attr === 'dark') && attr !== currentTheme) {
        setCurrentTheme(attr);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

    return () => {
      window.removeEventListener('lms-theme-change', handleThemeChange);
      window.removeEventListener('storage', handleStorage);
      observer.disconnect();
    };
  }, [currentTheme]);

  const applyTheme = useCallback((nextTheme) => {
    setCurrentTheme(nextTheme);

    // 1. Update <html> element attributes & classes for CSS selectors
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);

    // 2. Persist in storage
    localStorage.setItem('lms-theme', nextTheme);
    localStorage.setItem('lms.theme', nextTheme);

    // 3. Update React context if available
    if (context?.setTheme) {
      context.setTheme(nextTheme);
    } else if (context?.toggleTheme) {
      context.toggleTheme();
    }

    // 4. Notify any other sliders or listeners
    window.dispatchEvent(new CustomEvent('lms-theme-change', { detail: nextTheme }));
  }, [context]);

  const handleToggle = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    applyTheme(nextTheme);
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  // Dimension presets
  const dimensions = {
    sm: {
      width: 52,
      height: 26,
      padding: 2.5,
      knobSize: 21,
      travel: 26,
      iconSize: 11,
      moonIconSize: 11,
    },
    md: {
      width: 60,
      height: 30,
      padding: 3,
      knobSize: 24,
      travel: 30,
      iconSize: 13,
      moonIconSize: 12,
    },
    lg: {
      width: 68,
      height: 34,
      padding: 3.5,
      knobSize: 27,
      travel: 34,
      iconSize: 15,
      moonIconSize: 14,
    },
  }[size] || dimensions.md;

  const { width, height, padding, knobSize, travel, iconSize, moonIconSize } = dimensions;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={showTooltip ? (isDark ? 'Switch to light mode' : 'Switch to dark mode') : undefined}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width,
        height,
        padding: 0,
        borderRadius: 9999,
        cursor: 'pointer',
        userSelect: 'none',
        border: isDark ? '1px solid #333338' : '1px solid #d4d4d8',
        backgroundColor: isDark ? '#222225' : '#e4e4e7',
        boxShadow: isDark
          ? 'inset 0 1px 3px rgba(0, 0, 0, 0.4)'
          : 'inset 0 1px 2px rgba(0, 0, 0, 0.08)',
        transition: 'background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
        outline: 'none',
        flexShrink: 0,
        ...style,
      }}
    >
      {/* ── Left Track Icon: Sun (dimmed in dark mode) ── */}
      <span
        style={{
          position: 'absolute',
          left: padding,
          top: padding,
          width: knobSize,
          height: knobSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isDark ? '#71717a' : '#9ca3af',
          opacity: isDark ? 0.75 : 0,
          transition: 'opacity 0.2s ease, color 0.2s ease',
          pointerEvents: 'none',
        }}
      >
        <Sun size={iconSize} strokeWidth={2} />
      </span>

      {/* ── Right Track Icon: Moon (dimmed in light mode) ── */}
      <span
        style={{
          position: 'absolute',
          right: padding,
          top: padding,
          width: knobSize,
          height: knobSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isDark ? '#71717a' : '#9ca3af',
          opacity: isDark ? 0 : 0.75,
          transition: 'opacity 0.2s ease, color 0.2s ease',
          pointerEvents: 'none',
        }}
      >
        <Moon size={moonIconSize} strokeWidth={2} />
      </span>

      {/* ── Sliding Circular Thumb (Knob) ── */}
      <span
        style={{
          position: 'absolute',
          left: padding,
          top: padding,
          width: knobSize,
          height: knobSize,
          borderRadius: '50%',
          transform: `translateX(${isDark ? travel : 0}px)`,
          backgroundColor: isDark ? '#141416' : '#ffffff',
          boxShadow: isDark
            ? '0 2px 5px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
            : '0 2px 5px rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition:
            'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.25s ease, box-shadow 0.25s ease',
          pointerEvents: 'none',
        }}
      >
        {/* Sun Icon inside Knob (visible in Light mode) */}
        <span
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isDark ? 0 : 1,
            transform: isDark ? 'rotate(-60deg) scale(0.6)' : 'rotate(0deg) scale(1)',
            color: '#f59e0b',
            transition: 'opacity 0.2s ease, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Sun size={iconSize} strokeWidth={2.4} />
        </span>

        {/* Moon Icon inside Knob (visible in Dark mode — exact match to screenshot) */}
        <span
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isDark ? 1 : 0,
            transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(60deg) scale(0.6)',
            color: '#f4f4f5',
            transition: 'opacity 0.2s ease, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Moon size={moonIconSize} fill="#f4f4f5" strokeWidth={0} />
        </span>
      </span>
    </button>
  );
};

export default ThemeSlider;
