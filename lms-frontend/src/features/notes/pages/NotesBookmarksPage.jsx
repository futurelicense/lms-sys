import { useState, useMemo, useCallback } from 'react';
import {
  StickyNote,
  Bookmark,
  Search,
  Plus,
  Trash2,
  BookOpen,
  Clock,
  FileText,
  ChevronRight,
  X,
  Save,
  Star,
  Edit3,
  Filter,
  Sparkles,
  Folder,
  Tag,
  Check,
  Code,
  ExternalLink,
  Upload,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useNotes,
  useBookmarks,
  useSaveNote,
  useDeleteNote,
  useDeleteBookmark,
} from '../hooks/useNotes';
import { useMyCourses } from '../../courses/hooks/useCourses';
import { ROUTES } from '../../../constants/routes';
import Spinner from '../../../components/common/Spinner';

const TAB_NOTES = 'notes';
const TAB_BOOKMARKS = 'bookmarks';

export const NotesBookmarksPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(TAB_NOTES);
  const [search, setSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [editingNote, setEditingNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCourseId, setNoteCourseId] = useState('');

  // Quick scratchpad state
  const [scratchpadText, setScratchpadText] = useState(() => {
    return localStorage.getItem('lms_student_scratchpad') || '';
  });
  const [scratchpadSaved, setScratchpadSaved] = useState(false);

  // Queries
  const { data: notesData, isLoading: notesLoading } = useNotes({ page: 0, size: 50 });
  const { data: bookmarksData, isLoading: bookmarksLoading } = useBookmarks({ page: 0, size: 50 });
  const { data: coursesData } = useMyCourses();

  const saveNote = useSaveNote();
  const deleteNote = useDeleteNote();
  const deleteBookmark = useDeleteBookmark();

  // Enrolled courses list
  const enrolledCourses = useMemo(() => {
    const raw = coursesData?.content ?? coursesData?.data?.content ?? coursesData ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [coursesData]);

  const courseMap = useMemo(() => {
    const map = {};
    enrolledCourses.forEach((c) => {
      if (c?.id) map[c.id] = c.title;
    });
    return map;
  }, [enrolledCourses]);

  // Normalized notes
  const allNotes = useMemo(() => {
    const raw = notesData?.content ?? notesData?.data?.content ?? notesData ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [notesData]);

  // Filtered notes
  const notes = useMemo(() => {
    let list = allNotes;
    if (selectedCourseFilter !== 'ALL') {
      if (selectedCourseFilter === 'GENERAL') {
        list = list.filter((n) => !n.courseId);
      } else {
        list = list.filter((n) => n.courseId === selectedCourseFilter);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) =>
          (n.title || '').toLowerCase().includes(q) ||
          (n.content || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [allNotes, selectedCourseFilter, search]);

  // Normalized bookmarks
  const allBookmarks = useMemo(() => {
    const raw = bookmarksData?.content ?? bookmarksData?.data?.content ?? bookmarksData ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [bookmarksData]);

  const bookmarks = useMemo(() => {
    let list = allBookmarks;
    if (selectedCourseFilter !== 'ALL') {
      list = list.filter((b) => b.courseId === selectedCourseFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          (b.label || '').toLowerCase().includes(q) ||
          (courseMap[b.courseId] || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [allBookmarks, selectedCourseFilter, search, courseMap]);

  // Handlers
  const handleEditNote = useCallback((note) => {
    setEditingNote(note);
    setNoteTitle(note.title || '');
    setNoteContent(note.content || '');
    setNoteCourseId(note.courseId || '');
  }, []);

  const handleNewNote = useCallback(() => {
    setEditingNote({ id: null, courseId: null, lessonId: null });
    setNoteTitle('');
    setNoteContent('');
    setNoteCourseId('');
  }, []);

  const handleSaveNote = useCallback(() => {
    if (!noteContent.trim() && !noteTitle.trim()) return;
    saveNote.mutate(
      {
        courseId: noteCourseId || null,
        lessonId: editingNote?.lessonId || null,
        title: noteTitle.trim() || 'Untitled Note',
        content: noteContent,
      },
      {
        onSuccess: () => {
          setEditingNote(null);
          setNoteTitle('');
          setNoteContent('');
          setNoteCourseId('');
        },
      },
    );
  }, [editingNote, noteTitle, noteContent, noteCourseId, saveNote]);

  const handleDeleteNote = useCallback(
    (noteId) => {
      if (window.confirm('Delete this study note?')) {
        deleteNote.mutate(noteId);
      }
    },
    [deleteNote],
  );

  const handleDeleteBookmark = useCallback(
    (bmId) => {
      if (window.confirm('Remove this bookmark?')) {
        deleteBookmark.mutate(bmId);
      }
    },
    [deleteBookmark],
  );

  const handleImportNotes = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target.result;
          if (file.name.endsWith('.json')) {
            const parsed = JSON.parse(text);
            const notesArr = Array.isArray(parsed) ? parsed : [parsed];
            notesArr.forEach((n) => {
              saveNote.mutate({
                title: n.title || n.name || file.name.replace(/\.[^/.]+$/, ''),
                content: n.content || n.body || JSON.stringify(n, null, 2),
                courseId: n.courseId || null,
              });
            });
          } else {
            const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
            saveNote.mutate({
              title: cleanTitle,
              content: text,
              courseId: null,
            });
          }
        } catch (err) {
          console.error('Failed to import note file:', err);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleScratchpadSave = () => {
    localStorage.setItem('lms_student_scratchpad', scratchpadText);
    setScratchpadSaved(true);
    setTimeout(() => setScratchpadSaved(false), 2000);
  };

  const handleConvertScratchpadToNote = () => {
    if (!scratchpadText.trim()) return;
    setEditingNote({ id: null, courseId: null, lessonId: null });
    setNoteTitle('Quick Scratchpad Notes');
    setNoteContent(scratchpadText);
    setNoteCourseId('');
    setActiveTab(TAB_NOTES);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalWords = useMemo(() => {
    return allNotes.reduce((acc, n) => {
      const words = (n.content || '').trim().split(/\s+/).filter(Boolean).length;
      return acc + words;
    }, 0);
  }, [allNotes]);

  const isLoading = activeTab === TAB_NOTES ? notesLoading : bookmarksLoading;

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        paddingBottom: 48,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* ── Page Header & Quick Stats Ribbon ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 20,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: 24,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#f59e0b',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              Personal Study Workspace
            </span>
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StickyNote size={24} color="#f59e0b" />
            </div>
            Notes & Bookmarks
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '6px 0 0' }}>
            Capture revision notes, key architectural formulas, and bookmark lessons for instant recall.
          </p>
        </div>

        {/* Live KPI Badges */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'linear-gradient(180deg, #181b24 0%, #11131a 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
              }}
            >
              <FileText size={18} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px' }}>
                TOTAL NOTES
              </p>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>{allNotes.length}</h4>
            </div>
          </div>

          <div
            style={{
              background: 'linear-gradient(180deg, #181b24 0%, #11131a 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <Star size={18} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px' }}>
                BOOKMARKS
              </p>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>{allBookmarks.length}</h4>
            </div>
          </div>

          <div
            style={{
              background: 'linear-gradient(180deg, #181b24 0%, #11131a 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px' }}>
                WORDS CAPTURED
              </p>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>{totalWords}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Tabs, Search, Course Filter, + New Note ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {/* Left: Tab Switcher */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: 4,
            borderRadius: 12,
            background: 'var(--surface-medium)',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={() => setActiveTab(TAB_NOTES)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === TAB_NOTES ? '#f59e0b' : 'transparent',
              color: activeTab === TAB_NOTES ? '#000' : 'var(--text-muted)',
              boxShadow: activeTab === TAB_NOTES ? '0 2px 8px rgba(245, 158, 11, 0.3)' : 'none',
            }}
          >
            <StickyNote size={15} />
            My Notes
            <span
              style={{
                fontSize: 11,
                padding: '2px 6px',
                borderRadius: 99,
                background: activeTab === TAB_NOTES ? 'rgba(0,0,0,0.15)' : 'var(--border-color)',
                color: activeTab === TAB_NOTES ? '#000' : 'var(--text-secondary)',
                fontWeight: 700,
              }}
            >
              {allNotes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab(TAB_BOOKMARKS)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === TAB_BOOKMARKS ? '#6366f1' : 'transparent',
              color: activeTab === TAB_BOOKMARKS ? '#fff' : 'var(--text-muted)',
              boxShadow: activeTab === TAB_BOOKMARKS ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
            }}
          >
            <Bookmark size={15} />
            Bookmarks
            <span
              style={{
                fontSize: 11,
                padding: '2px 6px',
                borderRadius: 99,
                background: activeTab === TAB_BOOKMARKS ? 'rgba(255,255,255,0.2)' : 'var(--border-color)',
                color: activeTab === TAB_BOOKMARKS ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700,
              }}
            >
              {allBookmarks.length}
            </span>
          </button>
        </div>

        {/* Right: Search, Filter, New Note Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 10,
              background: 'var(--surface-medium)',
              border: '1px solid var(--border-color)',
              minWidth: 260,
              flex: '0 1 320px',
            }}
          >
            <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder={activeTab === TAB_NOTES ? 'Search title or notes content...' : 'Search bookmarks...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: 13,
                width: '100%',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Course Filter Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              style={{
                appearance: 'none',
                background: 'var(--surface-medium)',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                padding: '8px 32px 8px 12px',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Subjects & Courses</option>
              <option value="GENERAL">General Study Notes</option>
              {enrolledCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <Filter
              size={13}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--text-muted)',
              }}
            />
          </div>

          {/* + New Note Button */}
          {activeTab === TAB_NOTES && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label
                title="Import Markdown (.md, .txt) or JSON notes"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#fbbf24',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Upload size={15} />
                Import Notes
                <input
                  type="file"
                  accept=".md,.txt,.json"
                  multiple
                  onChange={handleImportNotes}
                  style={{ display: 'none' }}
                />
              </label>

              <button
                onClick={handleNewNote}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#000',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <Plus size={16} strokeWidth={2.5} />
                New Note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Two-Column Content Canvas (fills full width) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: 28,
          alignItems: 'start',
        }}
      >
        {/* ── Left Column: Active Notes / Bookmarks Feed ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Note Editor Modal / Expansion Card */}
          {editingNote && (
            <div
              style={{
                padding: 24,
                borderRadius: 16,
                border: '2px solid #f59e0b',
                background: 'linear-gradient(180deg, #1a1d26 0%, #12141c 100%)',
                boxShadow: '0 8px 32px rgba(245, 158, 11, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Edit3 size={18} color="#f59e0b" />
                  {editingNote.id ? 'Edit Study Note' : 'Create New Study Note'}
                </h3>
                <button
                  onClick={() => setEditingNote(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 4,
                    borderRadius: 6,
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Title + Course Row */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Note title (e.g. React 19 Compiler Architecture)"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  style={{
                    flex: '1 1 300px',
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border-color)',
                    background: 'var(--surface-medium)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />

                <select
                  value={noteCourseId}
                  onChange={(e) => setNoteCourseId(e.target.value)}
                  style={{
                    flex: '0 1 240px',
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border-color)',
                    background: 'var(--surface-medium)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">General (No Course)</option>
                  {enrolledCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Textarea */}
              <textarea
                placeholder="Write your study notes here... (Supports Markdown headers, bullets, code blocks)"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={10}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-medium)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  lineHeight: 1.6,
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />

              {/* Footer Row: word count + actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>{noteContent.trim().split(/\s+/).filter(Boolean).length} words</span>
                  <span>{noteContent.length} characters</span>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setEditingNote(null)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNote}
                    disabled={saveNote.isPending}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 22px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#000',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      opacity: saveNote.isPending ? 0.7 : 1,
                    }}
                  >
                    <Save size={14} />
                    {saveNote.isPending ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Content Grid ── */}
          {isLoading ? (
            <div style={{ padding: 80, textAlign: 'center' }}>
              <Spinner />
            </div>
          ) : activeTab === TAB_NOTES ? (
            notes.length === 0 ? (
              /* Empty State */
              <div
                style={{
                  textAlign: 'center',
                  padding: '70px 24px',
                  color: 'var(--text-muted)',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
                  borderRadius: 18,
                  border: '1px dashed var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    background: 'rgba(245, 158, 11, 0.1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <StickyNote size={32} color="#f59e0b" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                  {search ? 'No notes matched your search' : 'No study notes yet'}
                </h3>
                <p style={{ fontSize: 13, maxWidth: 420, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  {search
                    ? 'Try adjusting your search terms or course filter.'
                    : 'Create revision notes to summarize lessons, memorize formulas, or draft code snippets.'}
                </p>
                <button
                  onClick={handleNewNote}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#000',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={16} strokeWidth={2.5} />
                  Create First Note
                </button>
              </div>
            ) : (
              /* Full-Width Responsive Notes Cards Grid */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 18,
                }}
              >
                {notes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      background: 'linear-gradient(180deg, #181b24 0%, #12141c 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 16,
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => handleEditNote(note)}
                  >
                    <div>
                      {/* Top Tag & Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: note.courseId ? 'rgba(56, 189, 248, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: note.courseId ? '#38bdf8' : '#f59e0b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 200,
                          }}
                        >
                          {note.courseId ? courseMap[note.courseId] || 'Enrolled Course' : 'General Study'}
                        </span>

                        <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEditNote(note)}
                            title="Edit Note"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-muted)',
                              padding: 5,
                              borderRadius: 6,
                            }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            title="Delete Note"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-muted)',
                              padding: 5,
                              borderRadius: 6,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Note Title */}
                      <h4
                        style={{
                          margin: '0 0 10px',
                          fontSize: 16,
                          fontWeight: 700,
                          color: '#fff',
                          letterSpacing: '-0.01em',
                          lineHeight: 1.3,
                        }}
                      >
                        {note.title || 'Untitled Note'}
                      </h4>

                      {/* Content Preview */}
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: '#94a3b8',
                          lineHeight: 1.6,
                          maxHeight: 72,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {note.content || 'No content provided.'}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 18,
                        paddingTop: 12,
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 11 }}>
                        <Clock size={12} />
                        <span>{formatDate(note.updatedAt)}</span>
                      </div>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                        {(note.content || '').length} chars
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* ── Bookmarks Tab ── */
            bookmarks.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '70px 24px',
                  color: 'var(--text-muted)',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
                  borderRadius: 18,
                  border: '1px dashed var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    background: 'rgba(99, 102, 241, 0.1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Bookmark size={32} color="#818cf8" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                  No bookmarks yet
                </h3>
                <p style={{ fontSize: 13, maxWidth: 420, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  While studying courses, click the bookmark icon on any lesson to save it for quick revision here.
                </p>
                <button
                  onClick={() => navigate(ROUTES.MY_COURSES)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <BookOpen size={16} />
                  Browse My Courses
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 16,
                }}
              >
                {bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    style={{
                      background: 'linear-gradient(180deg, #181b24 0%, #12141c 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 16,
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 14,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: 'rgba(99, 102, 241, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#818cf8',
                          flexShrink: 0,
                        }}
                      >
                        <Star size={20} fill="#818cf8" color="#818cf8" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#38bdf8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {courseMap[bm.courseId] || 'Course Lesson'}
                        </span>
                        <h4 style={{ margin: '3px 0 0', fontSize: 15, fontWeight: 700, color: '#fff' }}>
                          {bm.label || 'Bookmarked Lesson'}
                        </h4>
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b' }}>
                          Saved {formatDate(bm.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 12,
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <button
                        onClick={() => navigate(ROUTES.LEARNING(bm.courseId))}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 14px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818cf8',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Open Lesson
                        <ExternalLink size={12} />
                      </button>

                      <button
                        onClick={() => handleDeleteBookmark(bm.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#64748b',
                          padding: 6,
                          borderRadius: 6,
                        }}
                        title="Remove Bookmark"
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* ── Right Column Sidebar: Quick Scratchpad & Subject Index ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Card 1: Study Scratchpad */}
          <div
            style={{
              background: 'linear-gradient(180deg, #181b24 0%, #11131a 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 18,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="#f59e0b" />
                Quick Study Scratchpad
              </h3>
              {scratchpadSaved && (
                <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Check size={12} /> Saved
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
              Auto-saved locally. Jot quick formulas, reminders, or code snippets.
            </p>
            <textarea
              placeholder="Type quick thoughts here..."
              value={scratchpadText}
              onChange={(e) => {
                setScratchpadText(e.target.value);
                localStorage.setItem('lms_student_scratchpad', e.target.value);
              }}
              rows={6}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                background: 'var(--surface-medium)',
                color: 'var(--text-primary)',
                fontSize: 12,
                lineHeight: 1.5,
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleScratchpadSave}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-medium)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save Draft
              </button>
              <button
                onClick={handleConvertScratchpadToNote}
                disabled={!scratchpadText.trim()}
                style={{
                  flex: 1.2,
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: scratchpadText.trim() ? 'pointer' : 'not-allowed',
                  opacity: scratchpadText.trim() ? 1 : 0.5,
                }}
              >
                + Convert to Note
              </button>
            </div>
          </div>

          {/* Card 2: Filter by Enrolled Subject */}
          <div
            style={{
              background: 'linear-gradient(180deg, #181b24 0%, #11131a 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 18,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Folder size={16} color="#38bdf8" />
              Notes by Course
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                onClick={() => setSelectedCourseFilter('ALL')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: selectedCourseFilter === 'ALL' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: selectedCourseFilter === 'ALL' ? '#38bdf8' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>All Notes</span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>{allNotes.length}</span>
              </button>

              <button
                onClick={() => setSelectedCourseFilter('GENERAL')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: selectedCourseFilter === 'GENERAL' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: selectedCourseFilter === 'GENERAL' ? '#38bdf8' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>General Study</span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>
                  {allNotes.filter((n) => !n.courseId).length}
                </span>
              </button>

              {enrolledCourses.map((c) => {
                const count = allNotes.filter((n) => n.courseId === c.id).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCourseFilter(c.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: selectedCourseFilter === c.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      color: selectedCourseFilter === c.id ? '#38bdf8' : 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                      {c.title}
                    </span>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 3: Markdown Quick Reference */}
          <div
            style={{
              background: 'linear-gradient(180deg, #181b24 0%, #11131a 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 18,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Code size={14} color="#818cf8" />
              Markdown Quick Tips
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11, color: '#64748b' }}>
              <div><code style={{ color: '#f59e0b' }}># Header 1</code></div>
              <div><code style={{ color: '#f59e0b' }}>**Bold**</code></div>
              <div><code style={{ color: '#f59e0b' }}>- Bullet</code></div>
              <div><code style={{ color: '#f59e0b' }}>`Code`</code></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesBookmarksPage;
