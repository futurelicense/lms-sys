import Editor from '@monaco-editor/react';

const LANG_MAP = {
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  javascript: 'javascript',
  sql: 'sql',
};

/**
 * Read-only syntax-highlighted code display using Monaco (vs-dark theme).
 * Used in the result report page to show what the student submitted.
 */
export const CodeViewer = ({ sourceCode = '', language = 'python', maxHeight = 400 }) => {
  const monacoLang = LANG_MAP[language?.toLowerCase()] ?? 'plaintext';

  if (!sourceCode?.trim()) {
    return (
      <div style={{
        padding: '14px 16px',
        borderRadius: 8,
        background: '#1e1e2e',
        color: '#6b7280',
        fontSize: 13,
        fontFamily: 'monospace',
      }}>
        No code submitted for this question.
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 8,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      maxHeight,
    }}>
      <div style={{
        background: '#16162a',
        padding: '6px 14px',
        fontSize: 11,
        fontWeight: 600,
        color: '#a0a0b0',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {language}
      </div>
      <Editor
        height={Math.min(maxHeight - 32, Math.max(80, (sourceCode.split('\n').length + 1) * 20))}
        language={monacoLang}
        value={sourceCode}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'none',
          fontSize: 13,
          tabSize: 4,
          automaticLayout: true,
          scrollbar: { vertical: 'auto', horizontal: 'auto' },
        }}
        theme="vs-dark"
      />
    </div>
  );
};

export default CodeViewer;
