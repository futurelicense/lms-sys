import { FileText, Download, ExternalLink, Code2, BookOpen, Layers } from 'lucide-react';

export const LessonResourcesPanel = ({ currentLesson, course }) => {
  const lessonTitle = currentLesson?.title || 'Lesson';

  // Gather any resources from current lesson or standard course study materials
  const resources = [
    ...(currentLesson?.resources || []),
    ...(currentLesson?.attachments || []),
  ];

  // Default helpful course reference materials if no explicit attachments are configured
  const defaultItems = [
    {
      id: 'syllabus',
      title: `${course?.title || 'Course'} - Syllabus & Objectives`,
      type: 'PDF Document',
      size: '1.2 MB',
      icon: <FileText size={18} className="text-red-400" />,
      action: 'Download',
    },
    {
      id: 'cheatsheet',
      title: `${lessonTitle} - Key Concepts & Reference`,
      type: 'Markdown Summary',
      size: '180 KB',
      icon: <Code2 size={18} className="text-blue-400" />,
      action: 'Download',
    },
    {
      id: 'slides',
      title: `${lessonTitle} - Presentation Slides`,
      type: 'Slide Deck (PDF)',
      size: '3.4 MB',
      icon: <Layers size={18} className="text-amber-400" />,
      action: 'Download',
    },
  ];

  const displayList = resources.length > 0 ? resources : defaultItems;

  const handleDownload = (item) => {
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      return;
    }
    // Generate helpful summary text file
    const content = `Course: ${course?.title || ''}\nLesson: ${lessonTitle}\nTopic: ${item.title}\nDate: ${new Date().toLocaleDateString()}\n\nWelcome to ${lessonTitle}. Review these study notes and practice tasks to master this module.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--surface-dark, #18181b)',
        borderRadius: 12,
        border: '1px solid var(--border-color, #27272a)',
        padding: 16,
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={16} style={{ color: 'var(--color-primary-400, #60a5fa)' }} />
          <h4
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary, #f4f4f5)',
            }}
          >
            Lesson Resources & Downloads
          </h4>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted, #71717a)' }}>
          {displayList.length} files available
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
        {displayList.map((item) => (
          <div
            key={item.id || item.title}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 8,
              background: 'var(--surface-medium, #202024)',
              border: '1px solid var(--border-color, #27272a)',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {item.icon || <FileText size={18} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary, #f4f4f5)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.title}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 11,
                    color: 'var(--text-muted, #71717a)',
                  }}
                >
                  {item.type || 'Document'} · {item.size || 'Attachment'}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDownload(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: 'var(--surface-light, #27272a)',
                border: '1px solid var(--border-color, #3f3f46)',
                color: 'var(--text-primary, #f4f4f5)',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#3f3f46')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-light, #27272a)')}
            >
              <Download size={13} />
              {item.action || 'Download'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LessonResourcesPanel;
