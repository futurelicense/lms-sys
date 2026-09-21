import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Search, ArrowRight } from 'lucide-react';
import usePermission from '../../../hooks/usePermission';

/**
 * Renders a permission-filtered, icon-aware navigation tree.
 */
export const MainNavigation = ({ items = [] }) => {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const allowed = (item) => !item.permission || hasPermission(item.permission);

  const visible = items
    .filter(allowed)
    .map((item) => (item.children ? { ...item, children: item.children.filter(allowed) } : item))
    .filter((item) => !item.children || item.children.length > 0);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Collect searchable items
  const searchableItems = [];
  visible.forEach((item) => {
    if (item.to) {
      searchableItems.push({
        label: item.label,
        to: item.to,
        group: item.group || 'General',
        icon: item.icon,
      });
    }
    if (item.children) {
      item.children.forEach((child) => {
        searchableItems.push({
          label: child.label,
          category: item.label,
          to: child.to,
          group: item.group || 'General',
          icon: item.icon,
        });
      });
    }
  });

  const groups = visible.reduce((acc, item) => {
    const key = item.group ?? '';
    acc[key] = acc[key] ? [...acc[key], item] : [item];
    return acc;
  }, {});

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 2, fontFamily: 'Inter, sans-serif' }}
    >
      {/* ── Quick Search Bar ── */}
      <div style={{ padding: '4px 8px 10px 8px' }}>
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '7px 10px',
            borderRadius: 8,
            cursor: 'pointer',
            font: 'inherit',
            background: 'var(--surface-medium)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            transition: 'all 0.15s ease',
          }}
          className="nav-item"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Search size={15} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
            <span className="truncate text-sm font-medium text-left relative top-[0.5px]">
              Quick search...
            </span>
          </span>
          <kbd
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '2px 5px',
              borderRadius: 4,
              background: 'var(--surface-dark)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontFamily: 'sans-serif',
              lineHeight: 1,
            }}
          >
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* ── Grouped Navigation Tree ── */}
      {Object.entries(groups).map(([group]) => {
        const groupItems = groups[group];
        return (
          <div key={group || 'default'}>
            {/* Group Header */}
            {group && (
              <div style={{ padding: '16px 20px 6px' }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'var(--text-muted)',
                  }}
                >
                  {group}
                </span>
              </div>
            )}

            {/* Menu Items */}
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: '0 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {groupItems.map((item) =>
                item.children ? (
                  <NavSection key={item.label} item={item} />
                ) : (
                  <li key={item.to}>
                    <NavItemLink item={item} />
                  </li>
                ),
              )}
            </ul>
          </div>
        );
      })}

      {/* ── Cloudflare Command Palette Modal (Rendered via Portal) ── */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        items={searchableItems}
        navigate={navigate}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .nav-item:hover {
          background-color: var(--hover-bg) !important;
          color: var(--text-primary) !important;
        }
        .nav-item:hover span {
          color: var(--text-primary) !important;
        }
        .nav-child:hover {
          background-color: var(--hover-bg) !important;
          color: var(--text-primary) !important;
        }
      `,
        }}
      />
    </div>
  );
};

const linkStyle = ({ isActive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 12px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: isActive ? 600 : 500,
  textDecoration: 'none',
  transition: 'all 0.15s ease',
  background: isActive ? 'var(--surface-medium)' : 'transparent',
  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
  border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
});

const NavItemLink = ({ item }) => (
  <NavLink
    to={item.to}
    end={item.end}
    onClick={item.onNavigate}
    style={linkStyle}
    className="nav-item"
  >
    {({ isActive }) => (
      <>
        {item.icon && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              transition: 'color 0.15s ease',
              flexShrink: 0,
            }}
          >
            {item.icon}
          </span>
        )}
        <span className="truncate text-sm font-medium text-left relative top-[0.5px]">
          {item.label}
        </span>
      </>
    )}
  </NavLink>
);

/** A collapsible parent and its children. */
const NavSection = ({ item }) => {
  const { pathname } = useLocation();

  // Open when the current route is inside the section, so a hard refresh or a
  // deep link lands with the right section already expanded.
  const containsActive = item.children.some(
    (child) => pathname === child.to || pathname.startsWith(`${child.to}/`),
  );
  const [isOpen, setIsOpen] = useState(containsActive);
  const expanded = isOpen || containsActive;

  return (
    <li>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={expanded}
        className="nav-item"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '8px 12px',
          borderRadius: 8,
          cursor: 'pointer',
          font: 'inherit',
          textAlign: 'left',
          background: expanded ? 'var(--surface-medium)' : 'transparent',
          color: 'var(--text-primary)',
          border: expanded ? '1px solid var(--border-color)' : '1px solid transparent',
          transition: 'all 0.15s ease',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {item.icon && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                color: expanded ? 'var(--text-primary)' : 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              {item.icon}
            </span>
          )}
          <span className="truncate text-sm font-medium text-left relative top-[0.5px]">
            {item.label}
          </span>
        </span>
        <ChevronDown
          className="h-4 w-4"
          style={{
            flexShrink: 0,
            transition: 'transform 0.15s ease',
            transform: expanded ? 'rotate(180deg)' : 'none',
            color: 'var(--text-muted)',
          }}
        />
      </button>

      {expanded && (
        <ul
          style={{
            listStyle: 'none',
            margin: '4px 0 6px',
            padding: '0 0 0 14px',
            borderLeft: '1px solid var(--border-color)',
            marginLeft: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {item.children.map((child) => (
            <li key={child.to}>
              <NavLink
                to={child.to}
                end={child.end}
                className="nav-child"
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  background: isActive ? 'var(--surface-medium)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                })}
              >
                <span className="truncate text-sm font-medium text-left relative top-[0.5px]">
                  {child.label}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

const footerKbdStyle = {
  fontSize: 10,
  fontWeight: 500,
  padding: '1px 5px',
  borderRadius: 4,
  background: 'var(--surface-dark)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-muted)',
  fontFamily: 'sans-serif',
  lineHeight: 1,
};

const QuickSearchModal = ({ isOpen, onClose, items, navigate }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredItems = query.trim()
    ? items.filter(
        (i) =>
          i.label.toLowerCase().includes(query.toLowerCase()) ||
          (i.category && i.category.toLowerCase().includes(query.toLowerCase())) ||
          (i.group && i.group.toLowerCase().includes(query.toLowerCase())),
      )
    : items;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length),
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          navigate(filteredItems[selectedIndex].to);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          margin: '0 16px',
          background: 'var(--surface-dark)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Inter, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            autoFocus
            placeholder="Search products, pages, and features..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-primary)',
              fontFamily: 'Inter, sans-serif',
            }}
          />
          <kbd
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '2px 7px',
              borderRadius: 4,
              background: 'var(--surface-medium)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontFamily: 'sans-serif',
            }}
          >
            Esc
          </kbd>
        </div>

        {/* Results Body */}
        <div
          style={{
            maxHeight: 380,
            overflowY: 'auto',
            padding: '10px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {query.trim() === '' && (
            <div
              style={{
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Navigation Pages
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              No matching results found for &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => {
                    navigate(item.to);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: isSelected ? 'var(--surface-medium)' : 'transparent',
                    border: isSelected ? '1px solid var(--border-color)' : '1px solid transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    {item.icon && (
                      <span
                        style={{
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.label}
                      </span>
                      {item.category && (
                        <span
                          style={{
                            fontSize: 13,
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          — {item.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight
                    size={15}
                    style={{
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                      flexShrink: 0,
                      opacity: isSelected ? 1 : 0.4,
                    }}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer Bar */}
        <div
          style={{
            padding: '10px 16px',
            background: 'var(--surface-medium)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-flex', gap: 2 }}>
              <kbd style={footerKbdStyle}>↑</kbd>
              <kbd style={footerKbdStyle}>↓</kbd>
            </span>
            <span>to navigate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <kbd style={footerKbdStyle}>↵</kbd>
            <span>to select</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <kbd style={footerKbdStyle}>esc</kbd>
            <span>to dismiss</span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default MainNavigation;
