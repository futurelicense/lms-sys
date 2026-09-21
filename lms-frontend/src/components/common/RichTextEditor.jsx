import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Bold, Italic, List, ListOrdered, Code, Link2, Heading1, Heading2,
  Quote, Minus, Eye, Edit3, Image as ImageIcon
} from 'lucide-react';

/**
 * Lightweight Rich Text / Markdown Editor
 * 
 * Provides a toolbar with formatting shortcuts and a live preview toggle.
 * Outputs raw Markdown text (compatible with existing TextArea-based forms).
 * 
 * Props:
 *   - value: string (Markdown text)
 *   - onChange: (e: { target: { value: string, name?: string } }) => void
 *   - label, placeholder, error, required, rows, name
 */

// ── Simple Markdown → HTML converter ──
function markdownToHtml(md) {
  if (!md) return '';
  let html = md
    // Code blocks (```...```)
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:rgba(139,92,246,0.1);padding:2px 6px;border-radius:4px;font-size:0.9em">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // H2
    .replace(/^## (.+)$/gm, '<h3 style="font-size:16px;font-weight:700;margin:12px 0 6px">$1</h3>')
    // H1
    .replace(/^# (.+)$/gm, '<h2 style="font-size:18px;font-weight:700;margin:16px 0 8px">$1</h2>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid var(--border-color);padding:4px 12px;margin:8px 0;color:var(--text-muted);font-style:italic">$1</blockquote>')
    // Unordered list
    .replace(/^[-*] (.+)$/gm, '<li style="margin-left:16px;list-style:disc">$1</li>')
    // Ordered list
    .replace(/^\d+\. (.+)$/gm, '<li style="margin-left:16px;list-style:decimal">$1</li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border-color);margin:12px 0" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#3b82f6;text-decoration:underline">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:8px 0" />')
    // Line breaks
    .replace(/\n/g, '<br/>');

  // Wrap consecutive <li> in <ul>/<ol>
  html = html.replace(/((<li[^>]*>.*?<\/li><br\/>?)+)/g, '<ul style="margin:8px 0;padding:0">$1</ul>');

  return html;
}

// ── Toolbar Button ──
const ToolBtn = ({ icon: Icon, label, onClick, active }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    style={{
      width: 30, height: 30, borderRadius: 6,
      border: 'none',
      background: active ? 'var(--text-primary)' : 'transparent',
      color: active ? 'var(--lms-background)' : 'var(--text-muted)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', transition: 'all 0.12s ease',
      fontFamily: 'inherit',
    }}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--border-color)'; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
  >
    <Icon size={14} />
  </button>
);

const RichTextEditor = forwardRef(({
  value = '',
  onChange,
  label,
  placeholder = 'Write using Markdown...',
  error,
  required,
  rows = 8,
  name,
  ...rest
}, ref) => {
  const [mode, setMode] = useState('edit'); // 'edit' | 'preview' | 'split'
  const textareaRef = useRef(null);

  useImperativeHandle(ref, () => textareaRef.current);

  const fireChange = useCallback((newVal) => {
    if (onChange) {
      // Mimic native event shape for react-hook-form compatibility
      const syntheticEvent = {
        target: { value: newVal, name: name || '' },
      };
      onChange(syntheticEvent);
    }
  }, [onChange, name]);

  const insertMarkdown = useCallback((before, after = '', placeholder = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const insert = selected || placeholder;
    const newValue = value.substring(0, start) + before + insert + after + value.substring(end);
    fireChange(newValue);
    // Set cursor after insertion
    requestAnimationFrame(() => {
      const cursorPos = start + before.length + insert.length + after.length;
      ta.setSelectionRange(cursorPos, cursorPos);
      ta.focus();
    });
  }, [value, fireChange]);

  const wrapSelection = useCallback((wrapper) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    if (selected) {
      const newValue = value.substring(0, start) + wrapper + selected + wrapper + value.substring(end);
      fireChange(newValue);
    } else {
      insertMarkdown(wrapper, wrapper, 'text');
    }
  }, [value, fireChange, insertMarkdown]);

  const prependLine = useCallback((prefix) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    // Find start of current line
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const newValue = value.substring(0, lineStart) + prefix + value.substring(lineStart);
    fireChange(newValue);
  }, [value, fireChange]);

  const charCount = (value || '').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Label */}
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <label style={labelStyle}>
            {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
          <span style={{ fontSize: 11, color: charCount > 5000 ? '#ef4444' : 'var(--text-muted)' }}>
            {charCount} chars
          </span>
        </div>
      )}

      {/* Editor Container */}
      <div style={containerStyle(error)}>
        {/* Toolbar */}
        <div style={toolbarStyle}>
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <ToolBtn icon={Bold} label="Bold (Ctrl+B)" onClick={() => wrapSelection('**')} />
            <ToolBtn icon={Italic} label="Italic (Ctrl+I)" onClick={() => wrapSelection('*')} />
            <ToolBtn icon={Code} label="Inline Code" onClick={() => wrapSelection('`')} />
            <div style={dividerStyle} />
            <ToolBtn icon={Heading1} label="Heading 1" onClick={() => prependLine('# ')} />
            <ToolBtn icon={Heading2} label="Heading 2" onClick={() => prependLine('## ')} />
            <div style={dividerStyle} />
            <ToolBtn icon={List} label="Bullet List" onClick={() => prependLine('- ')} />
            <ToolBtn icon={ListOrdered} label="Numbered List" onClick={() => prependLine('1. ')} />
            <ToolBtn icon={Quote} label="Blockquote" onClick={() => prependLine('> ')} />
            <div style={dividerStyle} />
            <ToolBtn icon={Link2} label="Insert Link" onClick={() => insertMarkdown('[', '](https://)', 'link text')} />
            <ToolBtn icon={Minus} label="Horizontal Rule" onClick={() => insertMarkdown('\n---\n')} />
          </div>

          {/* Mode Toggle */}
          <div style={{ display: 'flex', gap: 2 }}>
            <ToolBtn icon={Edit3} label="Edit" onClick={() => setMode('edit')} active={mode === 'edit'} />
            <ToolBtn icon={Eye} label="Preview" onClick={() => setMode(mode === 'preview' ? 'edit' : 'preview')} active={mode === 'preview'} />
          </div>
        </div>

        {/* Content Area */}
        {mode === 'edit' && (
          <textarea
            ref={textareaRef}
            value={value || ''}
            onChange={(e) => fireChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            name={name}
            style={textareaStyle}
            onKeyDown={(e) => {
              // Ctrl+B → Bold
              if (e.ctrlKey && e.key === 'b') { e.preventDefault(); wrapSelection('**'); }
              // Ctrl+I → Italic
              if (e.ctrlKey && e.key === 'i') { e.preventDefault(); wrapSelection('*'); }
            }}
            {...rest}
          />
        )}

        {mode === 'preview' && (
          <div
            style={previewStyle(rows)}
            dangerouslySetInnerHTML={{ __html: markdownToHtml(value) || '<em style="color:var(--text-muted)">Nothing to preview</em>' }}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <span style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>{error}</span>
      )}
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

// ── Styles ──
const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const containerStyle = (hasError) => ({
  border: `1px solid ${hasError ? '#ef4444' : 'var(--border-color)'}`,
  borderRadius: 10,
  overflow: 'hidden',
  background: 'var(--bg-primary)',
  transition: 'border-color 0.15s ease',
});

const toolbarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 10px',
  borderBottom: '1px solid var(--border-color)',
  background: 'var(--surface-medium, var(--lms-card))',
  flexWrap: 'wrap',
  gap: 4,
};

const dividerStyle = {
  width: 1,
  height: 18,
  background: 'var(--border-color)',
  margin: '0 4px',
};

const textareaStyle = {
  width: '100%',
  padding: '14px 16px',
  border: 'none',
  outline: 'none',
  resize: 'vertical',
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  lineHeight: 1.6,
  color: 'var(--text-primary)',
  background: 'var(--bg-primary)',
  boxSizing: 'border-box',
};

const previewStyle = (rows) => ({
  padding: '14px 16px',
  minHeight: `${rows * 1.6}em`,
  maxHeight: 400,
  overflow: 'auto',
  fontSize: 14,
  lineHeight: 1.7,
  color: 'var(--text-primary)',
});

export { RichTextEditor, markdownToHtml };
export default RichTextEditor;
