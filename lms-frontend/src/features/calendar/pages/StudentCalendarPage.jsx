import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle2,
  Zap,
  Download,
  Upload,
  Filter,
  ArrowRight,
  Flame,
  CalendarCheck,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCalendarEvents, useUpcomingDeadlines } from '../hooks/useCalendar';
import { ROUTES } from '../../../constants/routes';
import Spinner from '../../../components/common/Spinner';

const EVENT_COLORS = {
  blue: { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', dot: '#3b82f6', text: '#60a5fa' },
  green: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', dot: '#10b981', text: '#34d399' },
  emerald: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.35)', dot: '#059669', text: '#6ee7b7' },
  amber: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', dot: '#f59e0b', text: '#fbbf24' },
  red: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', dot: '#ef4444', text: '#f87171' },
  violet: { bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.3)', dot: '#8b5cf6', text: '#a78bfa' },
};

const EVENT_ICONS = {
  ASSESSMENT_DEADLINE: FileText,
  ASSESSMENT_START: Zap,
  COURSE_ENROLLED: BookOpen,
  COURSE_COMPLETED: Award,
};

const STATUS_BADGES = {
  upcoming: { label: 'Upcoming', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' },
  active: { label: 'Active Now', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399' },
  overdue: { label: 'Overdue', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' },
  completed: { label: 'Completed', bg: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const StudentCalendarPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'deadlines' | 'timeline'
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Persistent imported events (.ics files)
  const [importedEvents, setImportedEvents] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lms_calendar_imported_events') || '[]');
    } catch {
      return [];
    }
  });

  const { data: rawEvents = [], isLoading: eventsLoading } = useCalendarEvents();
  const { data: deadlines = [], isLoading: deadlinesLoading } = useUpcomingDeadlines(30);

  const events = useMemo(() => [...rawEvents, ...importedEvents], [rawEvents, importedEvents]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Filter events based on typeFilter
  const filteredEvents = useMemo(() => {
    if (typeFilter === 'ALL') return events;
    if (typeFilter === 'ASSESSMENT') {
      return events.filter((e) => e.type?.startsWith('ASSESSMENT'));
    }
    if (typeFilter === 'COURSE') {
      return events.filter((e) => e.type?.startsWith('COURSE'));
    }
    return events;
  }, [events, typeFilter]);

  // Build full 42-day calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];
    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, daysInPrevMonth - i),
      });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        isCurrentMonth: true,
        date: new Date(year, month, d),
      });
    }
    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        day: d,
        isCurrentMonth: false,
        date: new Date(year, month + 1, d),
      });
    }
    return days;
  }, [year, month]);

  // Map events to date strings
  const eventsByDate = useMemo(() => {
    const map = {};
    (filteredEvents || []).forEach((event) => {
      const dateKey = event.startTime
        ? new Date(event.startTime).toDateString()
        : null;
      if (dateKey) {
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(event);
      }
    });
    return map;
  }, [filteredEvents]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDate[selectedDate.toDateString()] || [];
  }, [selectedDate, eventsByDate]);

  const todayStr = new Date().toDateString();

  const navigateMonth = (offset) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const jumpToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const handleEventClick = (event) => {
    if (event.type === 'ASSESSMENT_DEADLINE' || event.type === 'ASSESSMENT_START') {
      navigate(ROUTES.STUDENT_ASSESSMENTS);
    } else if (event.type === 'COURSE_ENROLLED' || event.type === 'COURSE_COMPLETED') {
      navigate(ROUTES.LEARNING(event.referenceId));
    }
  };

  // Export deadlines as .ics file
  const handleExportICS = () => {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LMS Student Academic Schedule//EN',
    ];
    deadlines.forEach((d) => {
      const start = d.startTime ? new Date(d.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : '';
      const end = d.endTime ? new Date(d.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : start;
      lines.push('BEGIN:VEVENT');
      lines.push(`SUMMARY:${d.title || 'LMS Deadline'}`);
      lines.push(`DESCRIPTION:${d.description || ''}`);
      if (start) lines.push(`DTSTART:${start}`);
      if (end) lines.push(`DTEND:${end}`);
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');

    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'academic-deadlines.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportICS = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = [];
        const vevents = text.split('BEGIN:VEVENT');
        for (let i = 1; i < vevents.length; i++) {
          const block = vevents[i].split('END:VEVENT')[0];
          const summary = block.match(/SUMMARY:(.*)/)?.[1]?.trim() || 'Imported Event';
          const description = block.match(/DESCRIPTION:(.*)/)?.[1]?.trim() || '';
          const dtstartRaw = block.match(/DTSTART[:;](.*)/)?.[1]?.trim();
          let startTime = new Date().toISOString();
          if (dtstartRaw) {
            const clean = dtstartRaw.replace(/[^0-9TZ]/g, '');
            if (clean.length >= 8) {
              const y = clean.substr(0, 4);
              const m = clean.substr(4, 2);
              const d = clean.substr(6, 2);
              const time = clean.includes('T') ? clean.split('T')[1].substr(0, 4) : '0900';
              startTime = new Date(`${y}-${m}-${d}T${time.substr(0, 2)}:${time.substr(2, 2)}:00Z`).toISOString();
            }
          }
          parsed.push({
            id: `imp_evt_${Date.now()}_${i}`,
            title: summary,
            description,
            startTime,
            type: 'COURSE_MILESTONE',
            status: 'upcoming',
            isImported: true,
          });
        }
        if (parsed.length > 0) {
          const updated = [...importedEvents, ...parsed];
          setImportedEvents(updated);
          localStorage.setItem('lms_calendar_imported_events', JSON.stringify(updated));
          alert(`Successfully imported ${parsed.length} event(s) to your calendar!`);
        } else {
          alert('No valid events found in this .ics file.');
        }
      } catch {
        alert('Could not parse the selected .ics file.');
      }
    };
    reader.readAsText(file);
  };

  // KPI Calculations
  const totalEventsCount = events.length;
  const activeDeadlinesCount = deadlines.length;
  const completedCount = events.filter((e) => e.status === 'completed').length;
  const nextDeadline = deadlines[0];

  if (eventsLoading) return <Spinner fullPage />;

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
      {/* ── Page Header & Executive KPI Ribbon ── */}
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
                color: '#818cf8',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              Academic Schedule & Deadlines
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              <Sparkles size={12} />
              Fall Term 2026
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
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CalendarIcon size={24} color="#818cf8" />
            </div>
            Calendar & Deadlines
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '6px 0 0' }}>
            Comprehensive schedule of assessment windows, coursework milestones, and upcoming evaluations.
          </p>
        </div>

        {/* Live KPI Metric Badges */}
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
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CalendarCheck size={18} color="#818cf8" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Events
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                {totalEventsCount}
              </div>
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
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={18} color="#f87171" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Upcoming Deadlines
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#f87171' }}>
                {activeDeadlinesCount}
              </div>
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
              }}
            >
              <Award size={18} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Completed
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399' }}>
                {completedCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Control Dock: Tab Switcher + Filters + ICS Export ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {/* Left: View Tabs */}
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
          {[
            { key: 'calendar', label: 'Calendar View', icon: CalendarIcon, count: totalEventsCount },
            { key: 'deadlines', label: 'Upcoming Deadlines', icon: Clock, count: activeDeadlinesCount },
            { key: 'timeline', label: 'Monthly Timeline', icon: Zap, count: null },
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
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
                background: activeTab === key ? '#6366f1' : 'transparent',
                color: activeTab === key ? '#fff' : 'var(--text-muted)',
                boxShadow: activeTab === key ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
              }}
            >
              <Icon size={15} />
              {label}
              {count !== null && (
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 6px',
                    borderRadius: 99,
                    background: activeTab === key ? 'rgba(255,255,255,0.25)' : 'var(--border-color)',
                    color: activeTab === key ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right: Filter Pills + Jump Today + ICS Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: 4,
              borderRadius: 10,
              background: 'var(--surface-medium)',
              border: '1px solid var(--border-color)',
            }}
          >
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ASSESSMENT', label: 'Assessments' },
              { id: 'COURSE', label: 'Courses' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: typeFilter === f.id ? 'var(--bg)' : 'transparent',
                  color: typeFilter === f.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: typeFilter === f.id ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={jumpToToday}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid var(--border-color)',
              background: 'var(--surface-medium)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Jump to Today
          </button>

          <button
            onClick={handleExportICS}
            title="Download iCalendar file (.ics) for Google Calendar or Apple Calendar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid rgba(99, 102, 241, 0.3)',
              background: 'rgba(99, 102, 241, 0.1)',
              color: '#a5b4fc',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={14} />
            Sync .ics
          </button>

          <label
            title="Import calendar events from an external .ics file (Google Calendar, Outlook, Apple Calendar)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid rgba(56, 189, 248, 0.3)',
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Upload size={14} />
            Import .ics
            <input
              type="file"
              accept=".ics,text/calendar"
              onChange={handleImportICS}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* ── Main View Area (fills 100% full screen) ── */}
      {activeTab === 'calendar' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 400px',
            gap: 24,
            alignItems: 'start',
          }}
        >
          {/* ── Left Column: Expansive Full-Size Calendar Canvas ── */}
          <div
            style={{
              background: 'linear-gradient(180deg, #181b24 0%, #12141c 100%)',
              borderRadius: 18,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Month Navigation & Toolbar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 24px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => navigateMonth(-1)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8,
                    width: 36,
                    height: 36,
                    cursor: 'pointer',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                >
                  <ChevronLeft size={18} />
                </button>

                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                  {MONTHS[month]} {year}
                </h2>

                <button
                  onClick={() => navigateMonth(1)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8,
                    width: 36,
                    height: 36,
                    cursor: 'pointer',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Legend Hints */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                  Deadlines
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
                  Courses
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }} />
                  Milestones
                </span>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(0, 0, 0, 0.15)',
              }}
            >
              {DAYS.map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: 'center',
                    padding: '12px 8px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Expansive 7x6 Day Cells Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 1,
                background: 'rgba(255, 255, 255, 0.05)',
                padding: 1,
              }}
            >
              {calendarDays.map((dayInfo, i) => {
                const dateStr = dayInfo.date.toDateString();
                const dayEvents = eventsByDate[dateStr] || [];
                const isToday = dateStr === todayStr;
                const isSelected = selectedDate && dateStr === selectedDate.toDateString();

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDate(dayInfo.date)}
                    style={{
                      background: isSelected
                        ? 'rgba(99, 102, 241, 0.16)'
                        : isToday
                          ? 'rgba(99, 102, 241, 0.06)'
                          : 'var(--bg)',
                      minHeight: 115,
                      padding: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                      border: isSelected
                        ? '1.5px solid #6366f1'
                        : isToday
                          ? '1.5px solid rgba(99, 102, 241, 0.4)'
                          : '1.5px solid transparent',
                      opacity: dayInfo.isCurrentMonth ? 1 : 0.35,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = isToday
                          ? 'rgba(99, 102, 241, 0.06)'
                          : 'var(--bg)';
                      }
                    }}
                  >
                    {/* Day Number Header */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: isToday ? 800 : 600,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isToday ? '#6366f1' : 'transparent',
                          color: isToday ? '#fff' : 'var(--text-primary)',
                        }}
                      >
                        {dayInfo.day}
                      </span>

                      {isToday && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#818cf8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                          }}
                        >
                          Today
                        </span>
                      )}
                    </div>

                    {/* Interactive Event Chips inside Day Cell */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, overflow: 'hidden' }}>
                      {dayEvents.slice(0, 2).map((ev) => {
                        const Icon = EVENT_ICONS[ev.type] || FileText;
                        const c = EVENT_COLORS[ev.color] || EVENT_COLORS.blue;
                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(ev);
                            }}
                            title={ev.title}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '3px 6px',
                              borderRadius: 6,
                              background: c.bg,
                              border: `1px solid ${c.border}`,
                              color: c.text,
                              fontSize: 11,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              cursor: 'pointer',
                              transition: 'transform 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          >
                            <Icon size={11} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ev.title}
                            </span>
                          </div>
                        );
                      })}

                      {dayEvents.length > 2 && (
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            padding: '1px 4px',
                            borderRadius: 4,
                            background: 'rgba(255, 255, 255, 0.05)',
                            textAlign: 'center',
                          }}
                        >
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right Column: Interactive Schedule Hub & Details Panel ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Card 1: Selected Date Agenda */}
            <div
              style={{
                background: 'linear-gradient(180deg, #181b24 0%, #12141c 100%)',
                borderRadius: 18,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                padding: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: 12,
                }}
              >
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
                    Selected Agenda
                  </span>
                  <h3 style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedDate
                      ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                      : 'Select a date'}
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 99,
                    background: selectedDateEvents.length > 0 ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    color: selectedDateEvents.length > 0 ? '#a5b4fc' : 'var(--text-muted)',
                  }}
                >
                  {selectedDateEvents.length} events
                </span>
              </div>

              {selectedDateEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={36} style={{ marginBottom: 10, opacity: 0.4, color: '#10b981' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                    No Scheduled Events
                  </p>
                  <p style={{ fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                    Great day for uninterrupted self-study, reviewing saved revision notes, or practicing coding challenges.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedDateEvents.map((event) => {
                    const Icon = EVENT_ICONS[event.type] || CalendarIcon;
                    const colors = EVENT_COLORS[event.color] || EVENT_COLORS.blue;
                    const statusBadge = STATUS_BADGES[event.status];

                    return (
                      <div
                        key={event.id}
                        style={{
                          padding: 14,
                          borderRadius: 14,
                          border: `1px solid ${colors.border}`,
                          background: colors.bg,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: colors.dot,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={16} color="white" />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {event.title}
                              </h4>
                            </div>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                              {event.description}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                          {statusBadge && (
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 10,
                                fontWeight: 700,
                                background: statusBadge.bg,
                                color: statusBadge.color,
                              }}
                            >
                              {statusBadge.label}
                            </span>
                          )}

                          <button
                            onClick={() => handleEventClick(event)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: 'none',
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Open
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Card 2: Urgent Deadlines Countdown */}
            <div
              style={{
                background: 'linear-gradient(180deg, #181b24 0%, #12141c 100%)',
                borderRadius: 18,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                padding: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} color="#f87171" />
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                    Urgent Deadlines
                  </h3>
                </div>
                <span style={{ fontSize: 11, color: '#f87171', fontWeight: 700 }}>
                  {deadlines.length} Due Soon
                </span>
              </div>

              {deadlinesLoading ? (
                <div style={{ padding: 20, textAlign: 'center' }}>
                  <Spinner size="sm" />
                </div>
              ) : deadlines.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={32} style={{ marginBottom: 8, opacity: 0.3, color: '#10b981' }} />
                  <p style={{ fontSize: 13, margin: 0, fontWeight: 600 }}>All deadlines clear!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {deadlines.slice(0, 4).map((d) => {
                    const dueDate = d.endTime ? new Date(d.endTime) : null;
                    const daysLeft = dueDate ? Math.ceil((dueDate - new Date()) / 86400000) : null;
                    const isUrgent = daysLeft !== null && daysLeft <= 3;

                    return (
                      <div
                        key={d.id}
                        onClick={() => handleEventClick(d)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: isUrgent ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.06)'}`,
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(2px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {d.title}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Pending'}
                          </div>
                        </div>

                        <span
                          style={{
                            flexShrink: 0,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 800,
                            background: isUrgent ? '#ef4444' : 'rgba(99, 102, 241, 0.2)',
                            color: isUrgent ? '#fff' : '#a5b4fc',
                          }}
                        >
                          {daysLeft !== null ? (daysLeft <= 0 ? 'Today' : `${daysLeft}d left`) : 'Soon'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Card 3: Academic Term Sync Info */}
            <div
              style={{
                background: 'linear-gradient(180deg, #181b24 0%, #12141c 100%)',
                borderRadius: 18,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Bell size={16} color="#818cf8" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  External Calendar Sync
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Click <strong>Sync .ics</strong> above to import all deadlines and test windows directly into Google Calendar, Outlook, or Apple Calendar.
              </p>
            </div>
          </div>
        </div>
      ) : activeTab === 'deadlines' ? (
        /* ── Deadlines List View (Spans 100% full width) ── */
        <div
          style={{
            background: 'linear-gradient(180deg, #181b24 0%, #12141c 100%)',
            borderRadius: 18,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '18px 24px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(245, 158, 11, 0.15) 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>
                <AlertCircle style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} size={20} color="#f87171" />
                Active Deadlines & Assessment Windows
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
                Sorted by urgency for the next 30 days.
              </p>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 99,
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              {deadlines.length} Required Actions
            </span>
          </div>

          {deadlinesLoading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <Spinner />
            </div>
          ) : deadlines.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={48} style={{ marginBottom: 16, opacity: 0.3, color: '#10b981' }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>All clear! No upcoming deadlines.</p>
              <p style={{ fontSize: 13 }}>You have no assessments or course milestones due in the next 30 days.</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: 16,
                padding: 24,
              }}
            >
              {deadlines.map((event) => {
                const Icon = EVENT_ICONS[event.type] || Clock;
                const colors = EVENT_COLORS[event.color] || EVENT_COLORS.blue;
                const dueDate = event.endTime ? new Date(event.endTime) : null;
                const daysLeft = dueDate ? Math.ceil((dueDate - new Date()) / 86400000) : null;
                const isUrgent = daysLeft !== null && daysLeft <= 3;

                return (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: 20,
                      borderRadius: 16,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: colors.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon size={18} color={colors.dot} />
                        </div>

                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 800,
                            background: isUrgent ? '#ef4444' : 'rgba(99, 102, 241, 0.2)',
                            color: isUrgent ? '#fff' : '#a5b4fc',
                          }}
                        >
                          {daysLeft !== null ? (daysLeft <= 0 ? 'Due Today!' : `${daysLeft} days remaining`) : 'Upcoming'}
                        </span>
                      </div>

                      <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {event.title}
                      </h3>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {event.description}
                      </p>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 18,
                        paddingTop: 12,
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Due: <strong>{dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBD'}</strong>
                      </div>

                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 14px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Launch
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ── Monthly Timeline Schedule (Spans 100% full width) ── */
        <div
          style={{
            background: 'linear-gradient(180deg, #181b24 0%, #12141c 100%)',
            borderRadius: 18,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: 28,
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              Monthly Milestone Timeline
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              Chronological progress markers and evaluation windows for {MONTHS[month]} {year}.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', paddingLeft: 24 }}>
            {/* Timeline Vertical Track */}
            <div
              style={{
                position: 'absolute',
                top: 8,
                bottom: 8,
                left: 10,
                width: 2,
                background: 'rgba(99, 102, 241, 0.3)',
              }}
            />

            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                No milestones recorded for this month.
              </div>
            ) : (
              events.map((ev, index) => {
                const Icon = EVENT_ICONS[ev.type] || CalendarIcon;
                const colors = EVENT_COLORS[ev.color] || EVENT_COLORS.blue;
                const evDate = ev.startTime ? new Date(ev.startTime) : null;

                return (
                  <div
                    key={ev.id || index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 16,
                      position: 'relative',
                    }}
                  >
                    {/* Node Dot */}
                    <div
                      style={{
                        position: 'absolute',
                        left: -20,
                        top: 14,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: colors.dot,
                        border: '3px solid #181b24',
                      }}
                    />

                    <div
                      onClick={() => handleEventClick(ev)}
                      style={{
                        flex: 1,
                        padding: 16,
                        borderRadius: 14,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 16,
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: colors.text, textTransform: 'uppercase' }}>
                          {ev.type?.replace(/_/g, ' ')}
                        </span>
                        <h4 style={{ margin: '3px 0', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {ev.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                          {ev.description}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {evDate ? evDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Term Event'}
                        </div>
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: 4,
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 700,
                            background: colors.bg,
                            color: colors.text,
                          }}
                        >
                          {ev.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCalendarPage;
