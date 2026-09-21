import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Plus, Trash2, ChevronDown, ChevronRight, Edit2, FolderPlus, FileText, Layers, Check, X
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import curriculumService from '../services/curriculumService';
import { useToast } from '../../../components/feedback/Toast';
import Button from '../../../components/common/Button';
import LessonEditorModal, { LESSON_TYPE_MAP } from './LessonEditorModal';

export function formatSectionTitle(title, index) {
  if (!title) return `Section ${index}: Untitled Section`;
  const cleanTitle = title.replace(/^section\s*\d*\s*:?\s*/i, '').trim();
  return `Section ${index}: ${cleanTitle || title}`;
}

// Sortable Individual Lesson Row Component
const SortableLessonRow = ({ lesson, idx, moduleId, onEditLesson, onDeleteLesson }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lesson.id });
  const typeConfig = LESSON_TYPE_MAP[lesson.lessonType] || LESSON_TYPE_MAP.VIDEO;
  const IconComp = typeConfig.icon || FileText;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={{ ...style, ...lessonRowStyle }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }} title="Drag to reorder lesson">
          <GripVertical size={14} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', width: 20 }}>
          {idx + 1}.
        </span>
        {lesson.thumbnailUrl ? (
          <img 
            src={lesson.thumbnailUrl} 
            alt={lesson.title} 
            style={{ width: 44, height: 32, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border-color)', flexShrink: 0 }} 
          />
        ) : (
          <div style={lessonIconBox(typeConfig.color)}>
            <IconComp size={16} />
          </div>
        )}
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {lesson.title}
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
            <span style={{ fontSize: 11, color: typeConfig.color, fontWeight: 500 }}>
              {typeConfig.label}
            </span>
            {lesson.durationMinutes > 0 && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                • {lesson.durationMinutes} min
              </span>
            )}
            {lesson.freePreview && (
              <span style={freeBadgeStyle}>Free Preview</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Button variant="ghost" size="sm" onClick={() => onEditLesson(moduleId, lesson)} title="Edit lesson">
          <Edit2 size={13} />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDeleteLesson(moduleId, lesson.id)} title="Delete lesson">
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
};

// Sortable Section / Module Component
const SortableModule = ({ module, index, onAddLesson, onEditLesson, onDeleteLesson, onDeleteModule, onUpdateModuleTitle, onReorderLessons }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: module.id });
  const [expanded, setExpanded] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(module.title.replace(/^section\s*\d*\s*:?\s*/i, '').trim() || module.title);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const lessonsCount = module.lessons?.length || 0;

  const handleSaveTitle = () => {
    if (!editedTitle.trim()) return;
    onUpdateModuleTitle(module.id, editedTitle.trim());
    setIsEditingTitle(false);
  };

  const handleLessonDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !module.lessons) return;
    const oldIndex = module.lessons.findIndex((l) => l.id === active.id);
    const newIndex = module.lessons.findIndex((l) => l.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const updated = arrayMove(module.lessons, oldIndex, newIndex);
    onReorderLessons(module.id, updated);
  };

  return (
    <div ref={setNodeRef} style={{ ...style, ...sectionCardStyle }}>
      {/* Module Header */}
      <div style={sectionHeadStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }} title="Drag to reorder section">
            <GripVertical size={18} />
          </div>
          <button onClick={() => setExpanded(!expanded)} style={iconBtnStyle}>
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          
          <div style={{ flex: 1 }}>
            {isEditingTitle ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 400 }}>
                <input
                  autoFocus
                  style={inputInlineStyle}
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                />
                <Button size="xs" variant="primary" onClick={handleSaveTitle}>
                  <Check size={12} />
                </Button>
                <Button size="xs" variant="ghost" onClick={() => setIsEditingTitle(false)}>
                  <X size={12} />
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatSectionTitle(module.title, index + 1)}
                </h3>
                <span style={badgeStyle}>{lessonsCount} {lessonsCount === 1 ? 'item' : 'items'}</span>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  style={{ ...iconBtnStyle, padding: 4 }}
                  title="Edit section title"
                >
                  <Edit2 size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button variant="secondary" size="sm" onClick={() => onAddLesson(module.id)}>
            <Plus size={13} style={{ marginRight: 4 }} /> Add Lesson / File
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDeleteModule(module.id)} title="Delete section">
            <Trash2 size={13} style={{ color: '#ef4444' }} />
          </Button>
        </div>
      </div>

      {/* Module Lessons List */}
      {expanded && (
        <div style={{ padding: '12px 18px', background: 'var(--lms-card)' }}>
          {module.lessons?.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
              <SortableContext items={module.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {module.lessons.map((lesson, idx) => (
                    <SortableLessonRow
                      key={lesson.id}
                      lesson={lesson}
                      idx={idx}
                      moduleId={module.id}
                      onEditLesson={onEditLesson}
                      onDeleteLesson={onDeleteLesson}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p style={{ margin: 0, padding: '16px 0', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
              {'No material or lessons added in this section yet. Click "+ Add Lesson / File" above.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export const CurriculumBuilder = ({ course }) => {
  const [modules, setModules] = useState(course?.modules || []);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  
  const [editingLesson, setEditingLesson] = useState(null); // { moduleId, lesson }

  const toast = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setModules((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      const cleanTitle = newModuleTitle.replace(/^section\s*\d*\s*:?\s*/i, '').trim();
      const res = await curriculumService.addModule(course.id, { title: cleanTitle, sortOrder: modules.length });
      setModules([...modules, { ...res, lessons: [] }]);
      setNewModuleTitle('');
      setIsAddingModule(false);
      toast.success('Section added');
      queryClient.invalidateQueries(['courses', course.id]);
    } catch (e) {
      toast.error(e?.message || 'Failed to add section');
    }
  };

  const handleUpdateModuleTitle = async (moduleId, newTitle) => {
    try {
      const cleanTitle = newTitle.replace(/^section\s*\d*\s*:?\s*/i, '').trim();
      await curriculumService.updateModule(course.id, moduleId, { title: cleanTitle });
      setModules(modules.map(m => m.id === moduleId ? { ...m, title: cleanTitle } : m));
      toast.success('Section title updated');
    } catch (e) {
      toast.error(e?.message || 'Failed to update section title');
    }
  };

  const handleReorderLessons = (moduleId, reorderedLessons) => {
    setModules(modules.map(m => m.id === moduleId ? { ...m, lessons: reorderedLessons } : m));
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Delete this section and all its contents?')) return;
    try {
      await curriculumService.deleteModule(course.id, moduleId);
      setModules(modules.filter(m => m.id !== moduleId));
      toast.success('Section deleted');
    } catch (e) {
      toast.error(e?.message || 'Failed to delete section');
    }
  };

  const handleStartAddLesson = (moduleId) => {
    setEditingLesson({
      moduleId,
      lesson: {
        title: '',
        lessonType: 'VIDEO',
        durationMinutes: 10,
        freePreview: false
      }
    });
  };

  const handleSaveLesson = (savedLesson) => {
    if (!editingLesson?.moduleId || !savedLesson) return;
    setModules(modules.map(m => {
      if (m.id === editingLesson.moduleId) {
        const existingIdx = m.lessons?.findIndex(l => l.id === savedLesson.id);
        let updatedLessons;
        if (existingIdx >= 0) {
          updatedLessons = m.lessons.map(l => l.id === savedLesson.id ? savedLesson : l);
        } else {
          updatedLessons = [...(m.lessons || []), savedLesson];
        }
        return { ...m, lessons: updatedLessons };
      }
      return m;
    }));
    setEditingLesson(null);
  };

  const handleDeleteLesson = async (moduleId, lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await curriculumService.deleteLesson(course.id, moduleId, lessonId);
      setModules(modules.map(m => {
        if (m.id === moduleId) {
          return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) };
        }
        return m;
      }));
      toast.success('Lesson deleted');
    } catch (e) {
      toast.error(e?.message || 'Failed to delete lesson');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Section Header Bar */}
      <div style={curriculumHeaderStyle}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            Course Curriculum & Materials
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Organize course content into multiple sections containing videos, slides (PPT), PDFs, and docs. Drag items to reorder.
          </p>
        </div>
        <Button onClick={() => setIsAddingModule(true)} variant="primary" size="sm">
          <Plus size={14} style={{ marginRight: 6 }} /> Add Section
        </Button>
      </div>

      {/* Inline Form to Add New Section */}
      {isAddingModule && (
        <div style={inlineAddModuleStyle}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
              Section Title *
            </label>
            <input 
              autoFocus
              style={inputStyle}
              value={newModuleTitle} 
              onChange={(e) => setNewModuleTitle(e.target.value)} 
              placeholder="e.g. Introduction to Angular Framework"
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <Button onClick={handleAddModule} variant="primary" size="sm" disabled={!newModuleTitle.trim()}>
              Save Section
            </Button>
            <Button onClick={() => setIsAddingModule(false)} variant="ghost" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Drag & Drop Section List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
          {modules.map((module, idx) => (
            <SortableModule 
              key={module.id} 
              module={module} 
              index={idx}
              onAddLesson={handleStartAddLesson}
              onEditLesson={(moduleId, lesson) => setEditingLesson({ moduleId, lesson })}
              onDeleteLesson={handleDeleteLesson}
              onDeleteModule={handleDeleteModule}
              onUpdateModuleTitle={handleUpdateModuleTitle}
              onReorderLessons={handleReorderLessons}
            />
          ))}

          {modules.length === 0 && !isAddingModule && (
            <div style={emptyCurriculumStyle}>
              <Layers size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                No sections created yet
              </p>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                Organize your course into sections and add PPT, Word, PDF, or video files.
              </p>
              <Button onClick={() => setIsAddingModule(true)} variant="outline" size="sm">
                <FolderPlus size={14} style={{ marginRight: 6 }} /> Create First Section
              </Button>
            </div>
          )}
        </SortableContext>
      </DndContext>

      {/* Add / Edit Lesson Modal */}
      {editingLesson && (
        <LessonEditorModal 
          courseId={course.id} 
          moduleId={editingLesson.moduleId} 
          lesson={editingLesson.lesson} 
          onClose={() => setEditingLesson(null)} 
          onSave={handleSaveLesson} 
        />
      )}
    </div>
  );
};

/* ── Inline Design System Token Styles ── */
const curriculumHeaderStyle = {
  background: 'var(--lms-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 12,
  padding: '18px 22px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 12
};

const sectionCardStyle = {
  background: 'var(--lms-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 12,
  marginBottom: 16,
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
};

const sectionHeadStyle = {
  background: 'var(--surface-medium)',
  padding: '14px 18px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--border-color)'
};

const iconBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: 2,
  display: 'flex',
  alignItems: 'center'
};

const badgeStyle = {
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 12,
  background: 'var(--border-color)',
  color: 'var(--text-secondary)'
};

const lessonRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 14px',
  borderRadius: 8,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
  transition: 'background 0.15s ease'
};

const lessonIconBox = (color) => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  background: 'var(--surface-medium)',
  color: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
});

const freeBadgeStyle = {
  fontSize: 10,
  fontWeight: 600,
  padding: '1px 6px',
  borderRadius: 4,
  background: 'rgba(16, 185, 129, 0.1)',
  color: '#10b981',
  border: '1px solid rgba(16, 185, 129, 0.3)'
};

const inlineAddModuleStyle = {
  background: 'var(--lms-card)',
  border: '1px solid var(--text-primary)',
  borderRadius: 12,
  padding: 18,
  display: 'flex',
  gap: 12,
  alignItems: 'flex-end'
};

const emptyCurriculumStyle = {
  textAlign: 'center',
  padding: '48px 24px',
  background: 'var(--lms-card)',
  border: '2px dashed var(--border-color)',
  borderRadius: 12
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

const inputInlineStyle = {
  padding: '4px 10px',
  borderRadius: 6,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  width: '100%'
};

export default CurriculumBuilder;
