import { useEffect, useMemo, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Share2, Bookmark, CheckCircle2, PauseCircle, Play, ChevronDown, ChevronUp, Edit3, ArrowLeft,
  FileText, Presentation, FileCode, Music, HelpCircle, Download, ExternalLink, BarChart2,
  Lock, AlertCircle, BookOpen, ChevronLeft, ChevronRight, RotateCcw, Trash2
} from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import Spinner from '../../../components/common/Spinner';
import ErrorState from '../../../components/common/ErrorState';
import Avatar from '../../../components/common/Avatar';
import Button from '../../../components/common/Button';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import useCourse from '../hooks/useCourse';
import { useDeleteCourse } from '../hooks/useCourses';
import { useToast } from '../../../components/feedback/Toast';
import { ROUTES } from '../../../constants/routes';
import { ROLES } from '../../../constants/roles';
import { PERMISSIONS } from '../../../constants/permissions';
import usePermission from '../../../hooks/usePermission';
import useAuth from '../../auth/hooks/useAuth';
import learningService from '../../learning/services/learningService';
import { formatSectionTitle } from '../components/CurriculumBuilder';
import CourseAnalyticsTab from '../components/CourseAnalyticsTab';
import courseService from '../services/courseService';
import LessonNotesPanel from '../components/LessonNotesPanel';
import LessonResourcesPanel from '../components/LessonResourcesPanel';

export const CourseDetailsPage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  return <CourseDetailsContent key={String(user?.id) + ':' + courseId} />;
};

const CourseDetailsContent = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { data: course, isLoading, error, refetch } = useCourse(courseId);
  const deleteMutation = useDeleteCourse();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { hasPermission, hasAnyRole } = usePermission();

  const [activeTab, setActiveTab] = useState('player'); // 'player' | 'analytics'
  const [leftPanelTab, setLeftPanelTab] = useState('overview'); // 'overview' | 'notes' | 'resources'
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [collapsedModules, setCollapsedModules] = useState({});

  const isAdminOrInstructor = hasPermission(PERMISSIONS.COURSE_ANALYTICS_VIEW) ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/instructor') ||
    hasAnyRole([ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.INSTRUCTOR]);

  const modules = course?.modules || [];

  // Derive flat list of all lessons from course modules
  const allLessons = useMemo(() => {
    if (!course?.modules) return [];
    const list = [];
    course.modules.forEach((mod) => {
      if (mod.lessons) {
        mod.lessons.forEach((l) => {
          list.push({ ...l, moduleId: mod.id, moduleTitle: mod.title });
        });
      }
    });
    return list;
  }, [course]);

  const [activeLessonIndex, setActiveLessonIndex] = useState(0);

  useEffect(() => {
    if (lessonId && allLessons.length > 0) {
      const idx = allLessons.findIndex((l) => l.id === lessonId);
      if (idx >= 0) setActiveLessonIndex(idx);
    }
  }, [lessonId, allLessons]);

  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const queryClient = useQueryClient();
  const progressKey = ['learning-progress', userId, courseId];
  const progressQuery = useQuery({
    queryKey: progressKey,
    queryFn: () => learningService.getProgress(courseId),
    enabled: Boolean(courseId) && !isAdminOrInstructor,
  });
  const progressMutation = useMutation({
    mutationFn: (ids) => learningService.saveProgress(courseId, { completedLessonIds: ids }),
    onSuccess: (saved) => {
      queryClient.setQueryData(progressKey, saved);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
  const completedLessonIds = progressQuery.data?.completedLessonIds ?? [];
  const setCompletedLessonIds = (update) => {
    if (isAdminOrInstructor || progressQuery.isPending || progressQuery.error || progressMutation.isPending) return;
    const next = update(completedLessonIds);
    if (next !== completedLessonIds) progressMutation.mutate(next);
  };

  const [recordingPlaybackUrl, setRecordingPlaybackUrl] = useState(null);
  const [startedLessonId, setStartedLessonId] = useState(null);
  const [videoNotice, setVideoNotice] = useState(null);
  const [videoProgressPercent, setVideoProgressPercent] = useState(0);

  const videoRef = useRef(null);
  const maxWatchedTimeRef = useRef(0);
  const videoNoticeTimeoutRef = useRef(null);

  const currentLesson = allLessons[activeLessonIndex] || allLessons[0] || null;

  const isStudent = !isAdminOrInstructor || location.pathname.startsWith('/learn');
  const isAdmin = location.pathname.startsWith('/admin');

  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const lastSavedPositionRef = useRef(0);

  // Key for persisting resume position per student, course, and lesson
  const resumePositionKey = currentLesson?.id
    ? `lms_video_pos_${userId}_${courseId}_${currentLesson.id}`
    : null;

  // Restore maxWatchedTime and resume position from localStorage when switching lessons
  useEffect(() => {
    maxWatchedTimeRef.current = 0;
    setVideoProgressPercent(0);
    setVideoNotice(null);
    setCurrentVideoTime(0);
    lastSavedPositionRef.current = 0;

    if (resumePositionKey) {
      try {
        const savedPos = parseFloat(localStorage.getItem(resumePositionKey) || '0');
        if (!isNaN(savedPos) && savedPos > 0) {
          maxWatchedTimeRef.current = savedPos;
          lastSavedPositionRef.current = savedPos;
        }
      } catch (_) {}
    }
  }, [currentLesson?.id, resumePositionKey]);

  const showNotice = (text, type = 'warning') => {
    if (videoNoticeTimeoutRef.current) {
      clearTimeout(videoNoticeTimeoutRef.current);
    }
    setVideoNotice({ text, type });
    videoNoticeTimeoutRef.current = setTimeout(() => {
      setVideoNotice(null);
    }, 3500);
  };

  const markLessonCompleted = (lessonIdToComplete) => {
    if (!lessonIdToComplete) return;
    setCompletedLessonIds((prev) => {
      if (prev.includes(lessonIdToComplete)) return prev;
      return [...prev, lessonIdToComplete];
    });

  };

  const handleVideoLoadedMetadata = (e) => {
    const video = e.currentTarget;
    if (!video || !resumePositionKey) return;
    try {
      const savedPos = parseFloat(localStorage.getItem(resumePositionKey) || '0');
      if (!isNaN(savedPos) && savedPos > 2 && savedPos 
          (video.duration - 3)) {
        video.currentTime = savedPos;
        maxWatchedTimeRef.current = Math.max(maxWatchedTimeRef.current, savedPos);
        showNotice(`Resumed playback at ${Math.floor(savedPos / 60)}:${String(Math.floor(savedPos % 60)).padStart(2, '0')}`, 'success');
      }
    } catch (_) {}
  };

  const handleVideoTimeUpdate = (e) => {
    const video = e.currentTarget;
    if (!video || !video.duration) return;

    const currentTime = video.currentTime;
    const duration = video.duration;
    const isCompleted = completedLessonIds.includes(currentLesson?.id);

    setCurrentVideoTime(currentTime);

    const pct = Math.min(100, Math.round((currentTime / duration) * 100));
    setVideoProgressPercent(pct);

    // Save resume position periodically (every ~3 seconds)
    if (resumePositionKey && Math.abs(currentTime - lastSavedPositionRef.current) >= 3.0) {
      lastSavedPositionRef.current = currentTime;
      try {
        localStorage.setItem(resumePositionKey, String(Math.floor(currentTime)));
      } catch (_) {}
    }

    // Enforce watch limits for students on uncompleted lessons
    if (isStudent && !isCompleted) {
      // User scrubbed/skipped forward past what has been watched (+ 2s buffer for micro-skips)
      if (currentTime > maxWatchedTimeRef.current + 2.0) {
        video.currentTime = maxWatchedTimeRef.current;
        showNotice('Fast-forward is locked. Please watch the full video to complete this lesson.');
        return;
      }

      if (currentTime > maxWatchedTimeRef.current) {
        maxWatchedTimeRef.current = currentTime;
      }

      // Check if watched through the full video (at least 98% or within 1.5s of the end)
      if (currentTime / duration >= 0.98 || duration - currentTime <= 1.5) {
        markLessonCompleted(currentLesson?.id);
      }
    }
  };

  const handleVideoSeeking = (e) => {
    const video = e.currentTarget;
    if (!video) return;
    const isCompleted = completedLessonIds.includes(currentLesson?.id);

    if (isStudent && !isCompleted) {
      if (video.currentTime > maxWatchedTimeRef.current + 1.5) {
        video.currentTime = maxWatchedTimeRef.current;
        showNotice('Fast-forward is locked. Please watch the full video to complete this lesson.');
      }
    }
  };

  const handleVideoEnded = () => {
    if (currentLesson?.id) {
      markLessonCompleted(currentLesson.id);
      // Clear saved resume position upon successful video completion
      if (resumePositionKey) {
        try { localStorage.removeItem(resumePositionKey); } catch (_) {}
      }
      // Auto-advance to next lesson if available
      if (activeLessonIndex < allLessons.length - 1) {
        showNotice('🎉 Lesson complete! Advancing to next lesson in 2s...', 'success');
        setTimeout(() => {
          setActiveLessonIndex((prev) => (prev < allLessons.length - 1 ? prev + 1 : prev));
        }, 2000);
      }
    }
  };

  const handleSeekToTime = (seconds) => {
    if (videoRef.current) {
      const isCompleted = completedLessonIds.includes(currentLesson?.id);
      // If student hasn't watched that far yet on an incomplete lesson, clamp to max watched
      if (isStudent && !isCompleted && seconds > maxWatchedTimeRef.current + 1.5) {
        videoRef.current.currentTime = maxWatchedTimeRef.current;
        showNotice('Fast-forward is locked. Seek is limited to previously watched segments.');
      } else {
        videoRef.current.currentTime = seconds;
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    const recordingId = currentLesson?.recordingId;

    setRecordingPlaybackUrl(null);
    if (!recordingId) return undefined;

    courseService
      .getRecordingPlaybackUrl(recordingId)
      .then((response) => {
        if (!cancelled) setRecordingPlaybackUrl(response?.playbackUrl ?? null);
      })
      .catch(() => {
        if (!cancelled) setRecordingPlaybackUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [currentLesson?.recordingId]);

  const completedCount = completedLessonIds.length;
  const progressPercent = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  // Persist completed lessons whenever they update
  useEffect(() => {
    if (courseId && !isLoading) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(completedLessonIds));
      } catch (_) {}
      if (isStudent) {
        learningService.saveProgress(courseId, {
          completedLessonIds,
          percent: progressPercent,
        }).catch(() => {});
      }
    }
  }, [courseId, storageKey, completedLessonIds, isStudent, progressPercent, isLoading]);

  const toggleComplete = (id) => {
    setCompletedLessonIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleModuleCollapse = (modId) => {
    setCollapsedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Course link copied to clipboard!');
    }
  };

  if (isLoading) return <Spinner fullPage />;
  if (error || !course) return <ErrorState error={error} onRetry={refetch} />;

  const rawMedia = currentLesson?.content || currentLesson?.videoUrl || recordingPlaybackUrl;
  const mediaUrl = rawMedia;
  const lessonPosterUrl = currentLesson?.thumbnailUrl || course.thumbnailUrl || null;
  const isCurrentLessonPlaying = startedLessonId === currentLesson?.id;

  const backRoute = isStudent ? ROUTES.MY_COURSES : isAdmin ? ROUTES.ADMIN_COURSES : ROUTES.COURSES;
  const editRoute = isAdmin ? ROUTES.ADMIN_COURSE_EDIT(courseId) : ROUTES.COURSE_EDIT(courseId);

  return (
    <PageContainer
      title={course.title}
      breadcrumbs={[{ label: isStudent ? 'My Courses' : 'Courses', to: backRoute }, { label: course.title }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        {/* ── Top Header Navigation Bar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate(backRoute)}
              style={iconBtnStyle}
              title={isStudent ? 'Back to My Courses' : 'Back to Courses'}
            >
              <ArrowLeft size={18} />
            </button>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              {course.title}
            </h1>
          </div>

          {isAdminOrInstructor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(editRoute)}
              >
                <Edit3 size={14} style={{ marginRight: 6 }} /> Edit Course
              </Button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete Course"
                style={{
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Glassmorphic Pill Tab Navigation (Restricted to Admin & Instructor) ── */}
        {isAdminOrInstructor && (
          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
            <button
              onClick={() => setActiveTab('player')}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'inherit',
                border: activeTab === 'player' ? '1px solid var(--text-primary)' : '1px solid var(--border-color)',
                background: activeTab === 'player' ? 'var(--text-primary)' : 'var(--lms-card)',
                color: activeTab === 'player' ? 'var(--lms-background)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              <Play size={16} /> Course Player & Content
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'inherit',
                border: activeTab === 'analytics' ? '1px solid var(--text-primary)' : '1px solid var(--border-color)',
                background: activeTab === 'analytics' ? 'var(--text-primary)' : 'var(--lms-card)',
                color: activeTab === 'analytics' ? 'var(--lms-background)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              <BarChart2 size={16} /> Statistical Analytics & Performance
            </button>
          </div>
        )}

        {isAdminOrInstructor && activeTab === 'analytics' ? (
          <CourseAnalyticsTab courseId={courseId} />
        ) : (
          /* ── Main 2-Column Layout ── */
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 28, alignItems: 'start' }}>

          {/* ── LEFT COLUMN: Media Player + About + Suitability ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Dynamic Content / Media Player Box */}
            <div style={{
              background: '#090d16',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              minHeight: 380,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1px solid var(--border-color)'
            }}>
              {currentLesson?.lessonType === 'DOCUMENT' ? (
                <div style={{ width: '100%', padding: 32, textAlign: 'center', color: '#ffffff' }}>
                  <FileText size={56} color="#ef4444" style={{ marginBottom: 12 }} />
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{currentLesson.title}</h3>
                  <p style={{ margin: '8px 0 20px', fontSize: 13, opacity: 0.8 }}>PDF Document Attachment</p>
                  {mediaUrl ? (
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                      <a href={mediaUrl} target="_blank" rel="noreferrer" style={btnLinkStyle}>
                        <ExternalLink size={16} /> Open PDF Document
                      </a>
                      <a href={mediaUrl} download style={btnOutlineStyle}>
                        <Download size={16} /> Download PDF
                      </a>
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No file attached to this document lesson.</p>
                  )}
                </div>
              ) : currentLesson?.lessonType === 'PRESENTATION' ? (
                <div style={{ width: '100%', padding: 32, textAlign: 'center', color: '#ffffff' }}>
                  <Presentation size={56} color="#f59e0b" style={{ marginBottom: 12 }} />
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{currentLesson.title}</h3>
                  <p style={{ margin: '8px 0 20px', fontSize: 13, opacity: 0.8 }}>PPT / Presentation Slide Deck</p>
                  {mediaUrl ? (
                    <a href={mediaUrl} target="_blank" rel="noreferrer" style={btnLinkStyle}>
                      <ExternalLink size={16} /> View Presentation Deck
                    </a>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No presentation file attached.</p>
                  )}
                </div>
              ) : currentLesson?.lessonType === 'WORD_DOC' ? (
                <div style={{ width: '100%', padding: 32, textAlign: 'center', color: '#ffffff' }}>
                  <FileText size={56} color="#2563eb" style={{ marginBottom: 12 }} />
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{currentLesson.title}</h3>
                  <p style={{ margin: '8px 0 20px', fontSize: 13, opacity: 0.8 }}>Word Document Attachment</p>
                  {mediaUrl ? (
                    <a href={mediaUrl} download style={btnLinkStyle}>
                      <Download size={16} /> Download Word Document
                    </a>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No Word file attached.</p>
                  )}
                </div>
              ) : currentLesson?.lessonType === 'AUDIO' ? (
                <div style={{ width: '100%', padding: 32, textAlign: 'center', color: '#ffffff' }}>
                  <Music size={56} color="#8b5cf6" style={{ marginBottom: 16 }} />
                  <h3 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>{currentLesson.title}</h3>
                  {mediaUrl ? (
                    <audio controls style={{ width: '80%', maxWidth: 400 }}>
                      <source src={mediaUrl} />
                      Your browser does not support audio playback.
                    </audio>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No audio file attached.</p>
                  )}
                </div>
              ) : currentLesson?.lessonType === 'TEXT' ? (
                <div style={{ width: '100%', padding: 32, color: '#ffffff', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <FileCode size={24} color="#10b981" />
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{currentLesson.title}</h3>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.9, whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                    {currentLesson.content || 'No article content available.'}
                  </div>
                </div>
              ) : currentLesson?.lessonType === 'QUIZ' ? (
                <div style={{ width: '100%', padding: 32, textAlign: 'center', color: '#ffffff' }}>
                  <HelpCircle size={56} color="#ec4899" style={{ marginBottom: 12 }} />
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{currentLesson.title}</h3>
                  <p style={{ margin: '8px 0 20px', fontSize: 13, opacity: 0.8 }}>Practice Quiz & Knowledge Check</p>
                  <Button variant="primary" size="md" onClick={() => navigate(isAdmin ? ROUTES.ADMIN_ASSESSMENTS : ROUTES.ASSESSMENTS)}>
                    Start Assessment Test
                  </Button>
                </div>
              ) : mediaUrl && lessonPosterUrl && !isCurrentLessonPlaying ? (
                <button
                  type="button"
                  onClick={() => setStartedLessonId(currentLesson?.id ?? null)}
                  aria-label={`Play ${currentLesson?.title || 'lesson'}`}
                  style={videoPosterButtonStyle}
                >
                  <img
                    src={lessonPosterUrl}
                    alt={`${currentLesson?.title || 'Lesson'} thumbnail`}
                    style={videoPosterImageStyle}
                  />
                  <span style={videoPosterOverlayStyle} />
                  <span style={videoPosterPlayButtonStyle} aria-hidden="true">
                    <Play size={32} fill="currentColor" />
                  </span>
                  <span style={videoPosterLabelStyle}>Play lesson</span>
                </button>
              ) : mediaUrl ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000000' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    controls
                    key={currentLesson?.id}
                    style={{ width: '100%', height: '100%', maxHeight: 420, objectFit: 'contain' }}
                    poster={lessonPosterUrl || undefined}
                    onLoadedMetadata={handleVideoLoadedMetadata}
                    onTimeUpdate={handleVideoTimeUpdate}
                    onSeeking={handleVideoSeeking}
                    onSeeked={handleVideoSeeking}
                    onEnded={handleVideoEnded}
                  >
                    <source src={mediaUrl} />
                    Your browser does not support video playback.
                  </video>

                  {/* Video Notice Banner */}
                  {videoNotice && (
                    <div style={{
                      position: 'absolute',
                      bottom: 54,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: videoNotice.type === 'success' ? '#10b981' : 'rgba(220, 38, 38, 0.95)',
                      color: '#ffffff',
                      padding: '8px 18px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      zIndex: 20,
                      pointerEvents: 'none',
                      backdropFilter: 'blur(6px)',
                      maxWidth: '90%',
                      textAlign: 'center'
                    }}>
                      {videoNotice.type === 'success' ? <CheckCircle2 size={16} /> : <Lock size={16} />}
                      <span>{videoNotice.text}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ width: '100%', padding: 32, textAlign: 'center', color: '#ffffff' }}>
                  <Play size={56} style={{ opacity: 0.8, marginBottom: 12 }} />
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                    {currentLesson?.title || course.title}
                  </h3>
                  <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.8 }}>
                    {currentLesson?.lessonType ? `Format: ${currentLesson.lessonType}` : 'Select a lesson from the playlist on the right'}
                  </p>
                </div>
              )}

              {/* ── Lesson Previous / Next Progression Navigation Bar ── */}
              {allLessons.length > 1 && (
                <div style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  boxSizing: 'border-box',
                }}>
                  <button
                    disabled={activeLessonIndex <= 0}
                    onClick={() => setActiveLessonIndex((i) => Math.max(0, i - 1))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: activeLessonIndex > 0 ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: activeLessonIndex > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: activeLessonIndex > 0 ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <ChevronLeft size={14} /> Previous Lesson
                  </button>

                  <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', fontWeight: 500 }}>
                    Lesson {activeLessonIndex + 1} of {allLessons.length}
                  </span>

                  <button
                    disabled={activeLessonIndex >= allLessons.length - 1}
                    onClick={() => setActiveLessonIndex((i) => Math.min(allLessons.length - 1, i + 1))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: activeLessonIndex < allLessons.length - 1 ? '#3b82f6' : 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: activeLessonIndex < allLessons.length - 1 ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: activeLessonIndex < allLessons.length - 1 ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Next Lesson <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Instructor Profile & Action Bar */}
            <div style={{
              background: 'var(--lms-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 14,
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar name={course.createdByName || 'Instructor'} size={44} />
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {course.createdByName || 'Simon Simorangkir'}
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                    {course.instructorRole || 'Mentor • Instructor'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* Watch Progress Badge for Students */}
                {isStudent && currentLesson && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 99,
                    background: completedLessonIds.includes(currentLesson.id) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    border: `1px solid ${completedLessonIds.includes(currentLesson.id) ? '#10b981' : '#f59e0b'}`,
                    color: completedLessonIds.includes(currentLesson.id) ? '#10b981' : '#f59e0b',
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    {completedLessonIds.includes(currentLesson.id) ? (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <Lock size={13} />
                        <span>Watch full video to complete ({videoProgressPercent}%)</span>
                      </>
                    )}
                  </div>
                )}

                <button onClick={handleShare} style={actionIconBtnStyle} title="Share Course">
                  <Share2 size={18} />
                </button>
                <button
                  onClick={() => setBookmarked(!bookmarked)}
                  style={{ ...actionIconBtnStyle, color: bookmarked ? '#3b82f6' : 'var(--text-muted)' }}
                  title="Save Course"
                >
                  <Bookmark size={18} fill={bookmarked ? '#3b82f6' : 'none'} />
                </button>
              </div>
            </div>

            {/* ── Secondary Sub-Navigation (Overview / Notes / Resources) ── */}
            <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
              {[
                { id: 'overview', label: 'Overview', icon: <BookOpen size={15} /> },
                { id: 'notes', label: 'Lesson Notes', icon: <FileText size={15} /> },
                { id: 'resources', label: 'Resources', icon: <Download size={15} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setLeftPanelTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    border: 'none',
                    background: leftPanelTab === tab.id ? 'var(--surface-medium)' : 'transparent',
                    color: leftPanelTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: leftPanelTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {leftPanelTab === 'notes' && (
              <LessonNotesPanel
                courseId={courseId}
                courseTitle={course.title}
                currentLesson={currentLesson}
                allLessons={allLessons}
                onSelectLesson={(id) => {
                  const idx = allLessons.findIndex((l) => l.id === id);
                  if (idx >= 0) setActiveLessonIndex(idx);
                }}
                currentVideoTime={currentVideoTime}
                onSeekToTime={handleSeekToTime}
              />
            )}

            {leftPanelTab === 'resources' && (
              <LessonResourcesPanel currentLesson={currentLesson} course={course} />
            )}

            {leftPanelTab === 'overview' && (
              <>
                {/* About This Course Section */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                    About This Course
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-line',
                    display: '-webkit-box',
                    WebkitLineClamp: showFullDesc ? 'none' : 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {course.description || course.summary || 'Unlock your potential with this comprehensive course! Designed to take you from novice to confident practitioner through hands-on projects, step-by-step guidance, and expert techniques.'}
                  </p>

                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    style={{
                      background: 'transparent', border: 'none', padding: '8px 0 0',
                      color: 'var(--text-primary)', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    {showFullDesc ? <>Show less <ChevronUp size={14} /></> : <>Show more <ChevronDown size={14} /></>}
                  </button>
                </div>

                {/* This Course Suit For Section */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                    This Course Suit For:
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                    <li>Anyone who wants to start their career & get paid for their skills.</li>
                    <li>This course is for beginners, newbies & amateurs in the field.</li>
                    <li>For anyone that needs to add certified projects to their portfolio.</li>
                    <li>Aimed at people looking for structured, high-quality learning.</li>
                  </ul>
                </div>
              </>
            )}

          </div>

          {/* ── RIGHT COLUMN: Study Progress + Course Completion Playlist ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Top Card: Your Study Progress */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Your Study Progress
                </h4>
                <span style={pctBadgeStyle}>{progressPercent}%</span>
              </div>

              {/* Stepper Progress Bar */}
              <div style={{ position: 'relative', margin: '20px 0 28px' }}>
                <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--text-primary)', borderRadius: 99, transition: 'width 0.3s' }} />
                </div>
                
                {/* Milestone Stepper Checkpoints */}
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'absolute', top: -9, left: 0, right: 0 }}>
                  {[25, 50, 75, 100].map((step) => {
                    const reached = progressPercent >= step;
                    return (
                      <div
                        key={step}
                        style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: reached ? 'var(--text-primary)' : 'var(--lms-card)',
                          border: reached ? '2px solid var(--text-primary)' : '2px solid var(--border-color)',
                          color: reached ? 'var(--lms-background)' : 'var(--text-muted)',
                          fontSize: 10, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        {step}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Motivational Callout Box */}
              <div style={{
                background: 'var(--surface-medium)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                padding: 14,
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}>
                Great Job! 🎉 You&apos;re on the path to becoming certified in <strong>{course.title}</strong>. Your dedication to learning is impressive. Finish strong!
              </div>
            </div>

            {/* Bottom Card: Course Completion Playlist (GROUPED BY SECTION) */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Course Completion
                </h4>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {completedCount}/{allLessons.length || 1}
                </span>
              </div>

              {/* Section Accordions with Materials nested underneath */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {modules.length > 0 ? (
                  modules.map((mod, modIdx) => {
                    const isCollapsed = !!collapsedModules[mod.id];
                    const lessons = mod.lessons || [];

                    return (
                      <div key={mod.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* Section Header */}
                        <div
                          onClick={() => toggleModuleCollapse(mod.id)}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 12px', borderRadius: 8,
                            background: 'var(--surface-medium)',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {formatSectionTitle(mod.title, modIdx + 1)}
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                            {lessons.length} {lessons.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>

                        {/* Lessons List in Section */}
                        {!isCollapsed && lessons.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 4 }}>
                            {lessons.map((l) => {
                              const globalIndex = allLessons.findIndex(item => item.id === l.id);
                              const isCompleted = completedLessonIds.includes(l.id);
                              const isActive = globalIndex === activeLessonIndex;

                              return (
                                <div
                                  key={l.id}
                                  onClick={() => setActiveLessonIndex(globalIndex >= 0 ? globalIndex : 0)}
                                  style={{
                                    padding: '10px 12px',
                                    borderRadius: 10,
                                    border: isActive ? '2px solid var(--text-primary)' : '1px solid var(--border-color)',
                                    background: isActive ? 'var(--surface-medium)' : 'var(--lms-card)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {/* Status Icon */}
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isStudent) {
                                        toggleComplete(l.id);
                                      } else if (!isCompleted) {
                                        showNotice('Please watch the full video to complete this lesson.');
                                      }
                                    }}
                                    style={{
                                      cursor: isStudent ? 'default' : 'pointer',
                                      flexShrink: 0
                                    }}
                                    title={
                                      isCompleted
                                        ? 'Completed'
                                        : isStudent
                                          ? 'Watch full video to complete this lesson'
                                          : 'Mark complete'
                                    }
                                  >
                                    {isCompleted ? (
                                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CheckCircle2 size={14} />
                                      </div>
                                    ) : isActive ? (
                                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--text-primary)', color: 'var(--lms-background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <PauseCircle size={14} />
                                      </div>
                                    ) : (
                                      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                        <Play size={11} style={{ marginLeft: 2 }} />
                                      </div>
                                    )}
                                  </div>

                                  {/* Lesson Thumbnail & Title */}
                                  {l.thumbnailUrl && (
                                    <img 
                                      src={l.thumbnailUrl} 
                                      alt={l.title} 
                                      style={{ width: 38, height: 26, borderRadius: 4, objectFit: 'cover', border: '1px solid var(--border-color)', flexShrink: 0 }} 
                                    />
                                  )}
                                  <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <p style={{
                                      margin: 0, fontSize: 13, fontWeight: isActive ? 700 : 600,
                                      color: 'var(--text-primary)',
                                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                    }}>
                                      {l.title}
                                    </p>
                                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                                      {l.durationMinutes || 20} min
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                    No sections or lessons in this course yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Course Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            if (course?.status === 'PUBLISHED') {
              await courseService.unpublish(courseId);
            }
            await deleteMutation.mutateAsync(courseId);
            toast.success('Course deleted successfully.');
            navigate(backRoute);
          } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || 'Failed to delete course.');
          } finally {
            setIsDeleting(false);
          }
        }}
        title="Delete Course"
        message={
          course?.status === 'PUBLISHED'
            ? `"${course?.title}" is currently PUBLISHED. To safely delete it, it will be unpublished first and then permanently removed. Are you sure?`
            : `Are you sure you want to delete "${course?.title}"? This action cannot be undone.`
        }
        confirmLabel="Delete"
        isDestructive
        isLoading={isDeleting}
      />
      </div>
    </PageContainer>
  );
};

/* ── Inline Styles ── */
const iconBtnStyle = {
  width: 36, height: 36, borderRadius: 10,
  border: '1px solid var(--border-color)',
  background: 'var(--lms-card)',
  color: 'var(--text-primary)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer'
};

const actionIconBtnStyle = {
  width: 38, height: 38, borderRadius: 10,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
  color: 'var(--text-muted)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};

const cardStyle = {
  background: 'var(--lms-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
};

const pctBadgeStyle = {
  fontSize: 12,
  fontWeight: 700,
  padding: '3px 10px',
  borderRadius: 99,
  background: 'var(--surface-medium)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)'
};

const btnLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 20px',
  borderRadius: 10,
  background: '#3b82f6',
  color: '#ffffff',
  fontWeight: 600,
  fontSize: 14,
  textDecoration: 'none'
};

const btnOutlineStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 20px',
  borderRadius: 10,
  border: '1px solid rgba(255, 255, 255, 0.3)',
  background: 'transparent',
  color: '#ffffff',
  fontWeight: 600,
  fontSize: 14,
  textDecoration: 'none'
};

const videoPosterButtonStyle = {
  position: 'relative',
  width: '100%',
  height: '100%',
  minHeight: 380,
  padding: 0,
  border: 'none',
  background: '#090d16',
  cursor: 'pointer',
  overflow: 'hidden',
  color: '#ffffff',
};

const videoPosterImageStyle = {
  width: '100%',
  height: '100%',
  minHeight: 380,
  objectFit: 'cover',
  display: 'block',
};

const videoPosterOverlayStyle = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.08) 20%, rgba(0, 0, 0, 0.55) 100%)',
};

const videoPosterPlayButtonStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 72,
  height: 72,
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.94)',
  color: '#111827',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
};

const videoPosterLabelStyle = {
  position: 'absolute',
  left: 20,
  bottom: 18,
  fontSize: 14,
  fontWeight: 700,
  textShadow: '0 1px 3px rgba(0, 0, 0, 0.65)',
};

export default CourseDetailsPage;
