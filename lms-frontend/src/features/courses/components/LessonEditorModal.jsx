import { useState, useRef } from 'react';
import axios from 'axios';
import {
  UploadCloud, CheckCircle2, FileText, Video, Presentation, FileCode, Music, HelpCircle, X, Image as ImageIcon
} from 'lucide-react';
import Button from '../../../components/common/Button';
import RichTextEditor from '../../../components/common/RichTextEditor';
import { useToast } from '../../../components/feedback/Toast';
import courseService from '../services/courseService';
import curriculumService from '../services/curriculumService';

export const LESSON_TYPE_MAP = {
  VIDEO: { label: 'Video Lesson', icon: Video, color: '#3b82f6', accept: 'video/*' },
  DOCUMENT: { label: 'PDF Document', icon: FileText, color: '#ef4444', accept: '.pdf,application/pdf' },
  PRESENTATION: { label: 'PPT / Presentation', icon: Presentation, color: '#f59e0b', accept: '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  WORD_DOC: { label: 'Word Document', icon: FileText, color: '#2563eb', accept: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  TEXT: { label: 'Text / Article', icon: FileCode, color: '#10b981', accept: null },
  AUDIO: { label: 'Audio Recording', icon: Music, color: '#8b5cf6', accept: 'audio/*' },
  QUIZ: { label: 'Quiz / Practice', icon: HelpCircle, color: '#ec4899', accept: null },
};

export default function LessonEditorModal({ courseId, moduleId, lesson, onClose, onSave }) {
  const isNew = !lesson?.id;
  const [currentLessonId, setCurrentLessonId] = useState(lesson?.id || null);
  const [title, setTitle] = useState(lesson?.title || '');
  const [lessonType, setLessonType] = useState(lesson?.lessonType || 'VIDEO');
  const [content, setContent] = useState(lesson?.content || '');
  const [durationMinutes, setDurationMinutes] = useState(lesson?.durationMinutes || 10);
  const [freePreview, setFreePreview] = useState(!!lesson?.freePreview);
  const [recordingId, setRecordingId] = useState(lesson?.recordingId || null);
  const [thumbnailUrl, setThumbnailUrl] = useState(lesson?.thumbnailUrl || '');
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(!!lesson?.recordingId);
  const [fileName, setFileName] = useState(lesson?.fileName || '');
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  
  const fileInputRef = useRef(null);
  const thumbInputRef = useRef(null);
  
  const toast = useToast();
  const currentTypeInfo = LESSON_TYPE_MAP[lessonType] || LESSON_TYPE_MAP.VIDEO;

  const validateFile = (file, type) => {
    const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB
    const MAX_DOC_SIZE = 50 * 1024 * 1024;    // 50 MB
    const MAX_THUMB_SIZE = 10 * 1024 * 1024;  // 10 MB

    if (type === 'THUMBNAIL') {
      if (file.size > MAX_THUMB_SIZE) {
        toast.error('Thumbnail image size exceeds 10 MB limit.');
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file (PNG, JPG, WebP) for the thumbnail.');
        return false;
      }
      return true;
    }

    if (type === 'VIDEO') {
      if (file.size > MAX_VIDEO_SIZE) {
        toast.error('Video file size exceeds 500 MB limit.');
        return false;
      }
    } else if (file.size > MAX_DOC_SIZE) {
      toast.error(`Attachment size exceeds 50 MB limit for ${type} files.`);
      return false;
    }

    return true;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file, lessonType)) return;

    setUploading(true);
    setProgress(0);
    setFileName(file.name);

    try {
      let targetId = currentLessonId;

      if (!targetId) {
        const created = await curriculumService.addLesson(courseId, moduleId, {
          title: title.trim() || file.name,
          lessonType,
          sortOrder: 0
        });
        targetId = created.id;
        setCurrentLessonId(targetId);
      }

      // 1. Get presigned upload URL & attempt direct client upload, with seamless fallback to backend upload
      let newRecId;
      try {
        const uploadResData = await courseService.getLessonUploadUrl(courseId, moduleId, targetId, {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream'
        });

        const uploadUrl = uploadResData?.uploadUrl;
        newRecId = uploadResData?.recordingId;

        if (uploadUrl && typeof uploadUrl === 'string' && uploadUrl.startsWith('http') && !uploadUrl.includes('fallback-upload')) {
          await axios.put(uploadUrl, file, {
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
              setProgress(percentCompleted);
            }
          });

          await courseService.completeLessonRecordingUpload(courseId, moduleId, targetId, newRecId);
        } else {
          throw new Error('Presigned R2 URL unavailable, switching to backend direct upload');
        }
      } catch (r2Error) {
        console.warn('Presigned client upload failed or unavailable, falling back to direct server upload:', r2Error?.message || r2Error);
        const uploadRes = await courseService.uploadLessonRecordingDirect(
          courseId,
          moduleId,
          targetId,
          file,
          (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setProgress(percentCompleted);
          }
        );
        const resData = uploadRes?.data || uploadRes;
        newRecId = resData?.recordingId || newRecId;
      }

      setRecordingId(newRecId);
      setUploadSuccess(true);
      toast.success('File uploaded successfully!');

    } catch (error) {
      console.error(error);
      toast.error(error?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleThumbFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file, 'THUMBNAIL')) {
      e.target.value = '';
      return;
    }

    setThumbnailUploading(true);
    try {
      let targetId = currentLessonId;
      const resolvedTitle = title.trim() || file.name.replace(/\.[^/.]+$/, '') || 'Untitled lesson';

      if (!targetId) {
        const created = await curriculumService.addLesson(courseId, moduleId, {
          title: resolvedTitle,
          lessonType,
          sortOrder: 0,
        });
        targetId = created.id;
        setCurrentLessonId(targetId);
        setTitle(resolvedTitle);
      }

      const updatedLesson = await curriculumService.uploadLessonThumbnail(courseId, moduleId, targetId, file);
      setThumbnailUrl(updatedLesson.thumbnailUrl);
      toast.success('Material thumbnail uploaded successfully!');
    } catch (error) {
      toast.error(error?.message || 'Failed to upload thumbnail');
    } finally {
      setThumbnailUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a lesson title');
      return;
    }
    if (thumbnailUrl.trim().startsWith('data:') || thumbnailUrl.length > 1024) {
      toast.error('Use a hosted thumbnail URL or upload an image using the cover image picker.');
      return;
    }

    try {
      let savedLesson;
      const lessonPayload = {
        title,
        lessonType,
        content,
        recordingId,
        durationMinutes,
        freePreview,
        thumbnailUrl,
        fileName
      };

      if (currentLessonId) {
        savedLesson = await curriculumService.updateLesson(courseId, moduleId, currentLessonId, lessonPayload);
      } else {
        savedLesson = await curriculumService.addLesson(courseId, moduleId, {
          ...lessonPayload,
          sortOrder: 0
        });
      }

      toast.success(isNew ? 'Lesson created' : 'Lesson updated');
      onSave(savedLesson);
    } catch (err) {
      toast.error(err?.message || 'Failed to save lesson');
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle}>
        {/* Header */}
        <div style={modalHeaderStyle}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {isNew ? 'Add New Material / Lesson' : 'Edit Lesson / Material'}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Configure content format, details, thumbnail representation, and attachments.
            </p>
          </div>
          <button onClick={onClose} style={closeButtonStyle}>
            <X size={18} />
          </button>
        </div>
        
        {/* Form Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title Input */}
          <div>
            <label style={labelStyle}>Lesson Title *</label>
            <input 
              style={inputStyle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lecture 1: Getting Started with PDF Notes"
            />
          </div>

          {/* Format Type Selector */}
          <div>
            <label style={labelStyle}>Material Format Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginTop: 6 }}>
              {Object.entries(LESSON_TYPE_MAP).map(([key, config]) => {
                const IconComponent = config.icon;
                const isSelected = lessonType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLessonType(key)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: isSelected ? `2px solid ${config.color}` : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--surface-medium)' : 'var(--lms-card)',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: isSelected ? 600 : 400
                    }}
                  >
                    <IconComponent size={16} color={config.color} />
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration & Free Preview Toggle */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Est. Duration (minutes)</label>
              <input 
                type="number"
                min={1}
                style={inputStyle}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, marginTop: 20 }}>
              <input 
                type="checkbox"
                id="freePreviewChk"
                checked={freePreview}
                onChange={(e) => setFreePreview(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--text-primary)', cursor: 'pointer' }}
              />
              <label htmlFor="freePreviewChk" style={{ fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}>
                Allow Free Preview
              </label>
            </div>
          </div>

          {/* Material Thumbnail Representation Uploader */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 16, background: 'var(--bg-primary)' }}>
            <label style={{ ...labelStyle, marginBottom: 8, display: 'block' }}>
              Material Thumbnail Representation (Cover Image)
            </label>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* Preview Box */}
              <div 
                onClick={() => !thumbnailUploading && thumbInputRef.current?.click()}
                style={{
                  width: 90, height: 60, borderRadius: 8,
                  border: '1px dashed var(--border-color)',
                  background: 'var(--lms-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', cursor: thumbnailUploading ? 'wait' : 'pointer', flexShrink: 0
                }}
                title={thumbnailUploading ? 'Uploading thumbnail…' : 'Click to upload thumbnail image'}
              >
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <ImageIcon size={20} />
                    <span style={{ fontSize: 9, display: 'block', marginTop: 2 }}>Upload</span>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input 
                  style={inputStyle}
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="Paste a hosted image URL or click the image box to upload..."
                  disabled={thumbnailUploading}
                />
                <input 
                  type="file" 
                  ref={thumbInputRef} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleThumbFileChange} 
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {thumbnailUploading ? 'Uploading cover image…' : 'Upload a cover image or paste a hosted image URL.'}
                </span>
              </div>
            </div>
          </div>

          {/* File Upload Box for Video, PDF, PPT, Word, Audio */}
          {currentTypeInfo.accept && (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 16, background: 'var(--bg-primary)' }}>
              <label style={{ ...labelStyle, marginBottom: 8, display: 'block' }}>
                Upload File ({currentTypeInfo.label})
              </label>
              
              {uploadSuccess ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981' }}>
                  <CheckCircle2 size={20} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {fileName ? `File uploaded: ${fileName}` : 'File attached successfully.'}
                  </span>
                  <button onClick={() => setUploadSuccess(false)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#10b981', textDecoration: 'underline', cursor: 'pointer', fontSize: 12 }}>
                    Replace
                  </button>
                </div>
              ) : (
                <div 
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: 10,
                    padding: '24px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--lms-card)',
                    cursor: uploading ? 'default' : 'pointer'
                  }}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                >
                  <UploadCloud size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Click to select file ({currentTypeInfo.label})
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    Supports PPT, PDF, DOCX, MP4, MP3 attachments
                  </p>
                  
                  <input 
                    type="file" 
                    style={{ display: 'none' }} 
                    ref={fileInputRef} 
                    accept={currentTypeInfo.accept} 
                    onChange={handleFileChange} 
                  />
                  
                  {uploading && (
                    <div style={{ width: '100%', marginTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                        <span>Uploading file...</span>
                        <span>{progress}%</span>
                      </div>
                      <div style={{ width: '100%', background: 'var(--border-color)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                        <div style={{ background: '#3b82f6', height: '100%', width: `${progress}%`, transition: 'width 0.2s' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Text/Article Content Textarea */}
          {lessonType === 'TEXT' && (
             <div>
               <RichTextEditor
                 label="Article Text Content"
                 placeholder="Enter lesson instructions, notes, or article content (supports Markdown)..."
                 value={content}
                 onChange={(e) => setContent(e.target.value)}
                 rows={10}
               />
             </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
          <Button onClick={onClose} variant="ghost" size="sm">Cancel</Button>
          <Button onClick={handleSave} variant="primary" size="sm" disabled={uploading || thumbnailUploading}>
            {isNew ? 'Create Lesson' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Inline Styles ── */
const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  padding: 16
};

const modalBoxStyle = {
  background: 'var(--lms-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 14,
  padding: 24,
  width: '100%',
  maxWidth: 580,
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  paddingBottom: 16,
  marginBottom: 16,
  borderBottom: '1px solid var(--border-color)'
};

const closeButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: 4
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: 4,
  display: 'block'
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box'
};
