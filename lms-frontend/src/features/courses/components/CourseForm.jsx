import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpen, Layers, Clock, Sparkles, Image, Tag, Award, CheckCircle2, Globe
} from 'lucide-react';
import Input from '../../../components/common/Input';
import TextArea from '../../../components/common/TextArea';
import RichTextEditor from '../../../components/common/RichTextEditor';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import Alert from '../../../components/feedback/Alert';
import { courseSchema } from '../validation/courseSchemas';
import {
  COURSE_LEVEL_OPTIONS,
  COURSE_STATUS_OPTIONS,
  COURSE_STATUS,
  DEFAULT_CATEGORIES
} from '../constants/courseConstants';

const EMPTY_COURSE = {
  title: '',
  summary: '',
  description: '',
  level: 'BEGINNER',
  status: COURSE_STATUS.DRAFT,
  categoryId: 'web-dev',
  durationMinutes: 60,
  tags: [],
};

export const CourseForm = ({
  defaultValues = EMPTY_COURSE,
  categories = [],
  onSubmit,
  onCancel,
  submitLabel = 'Save Course',
  error = null,
}) => {
  const activeCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const initialValues = {
    ...EMPTY_COURSE,
    ...defaultValues,
    categoryId: defaultValues.categoryId || activeCategories[0]?.id || 'web-dev',
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: initialValues,
  });

  const summaryValue = useWatch({ control, name: 'summary' }) || '';
  const descriptionValue = useWatch({ control, name: 'description' }) || '';

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {error && <Alert tone="error">{error.message}</Alert>}

      {/* ── CARD 1: Basic Course Identity ── */}
      <div style={sectionCardStyle}>
        <div style={sectionHeadStyle}>
          <div style={iconBoxStyle('rgba(59, 130, 246, 0.1)', '#3b82f6')}>
            <BookOpen size={18} />
          </div>
          <div>
            <h3 style={sectionTitleStyle}>Course Identity & Overview</h3>
            <p style={sectionSubStyle}>Define the primary title, summary, and categorization of your course.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <div>
            <Input
              label="Course Title"
              required
              placeholder="e.g. Mastering Modern Angular & TypeScript"
              error={errors.title?.message}
              {...register('title')}
            />
          </div>

          {/* Short Summary */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={labelStyle}>Short Summary</label>
              <span style={{ fontSize: 12, color: summaryValue.length > 280 ? '#ef4444' : 'var(--text-muted)' }}>
                {summaryValue.length} / 280 chars
              </span>
            </div>
            <Input
              placeholder="A brief punchy overview shown on discovery cards..."
              error={errors.summary?.message}
              {...register('summary')}
            />
          </div>

          {/* 3-Column Attributes Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Select
              label="Skill Level"
              required
              options={COURSE_LEVEL_OPTIONS}
              error={errors.level?.message}
              {...register('level')}
            />

            <Select
              label="Category"
              required
              options={activeCategories.map((c) => ({ value: c.id, label: c.name }))}
              error={errors.categoryId?.message}
              {...register('categoryId')}
            />

            <Input
              label="Estimated Duration (minutes)"
              type="number"
              min={1}
              required
              error={errors.durationMinutes?.message}
              {...register('durationMinutes')}
            />
          </div>
        </div>
      </div>

      {/* ── CARD 2: Detailed Syllabus Description ── */}
      <div style={sectionCardStyle}>
        <div style={sectionHeadStyle}>
          <div style={iconBoxStyle('rgba(16, 185, 129, 0.1)', '#10b981')}>
            <Layers size={18} />
          </div>
          <div>
            <h3 style={sectionTitleStyle}>Detailed Description & Syllabus</h3>
            <p style={sectionSubStyle}>Provide a comprehensive outline of what students will learn and achieve.</p>
          </div>
        </div>

        <div>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Full Course Description"
                required
                placeholder="Write a thorough description covering the tools, methodologies, and concepts taught in this course (supports Markdown, code blocks, lists)..."
                error={errors.description?.message}
                value={field.value || ''}
                onChange={field.onChange}
                rows={8}
              />
            )}
          />
        </div>
      </div>

      {/* ── CARD 3: Publishing & Visibility Settings ── */}
      <div style={sectionCardStyle}>
        <div style={sectionHeadStyle}>
          <div style={iconBoxStyle('rgba(139, 92, 246, 0.1)', '#8b5cf6')}>
            <Sparkles size={18} />
          </div>
          <div>
            <h3 style={sectionTitleStyle}>Publishing & Access Settings</h3>
            <p style={sectionSubStyle}>Control the lifecycle status and visibility of your course.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <Select
            label="Course Lifecycle Status"
            options={COURSE_STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status')}
          />
        </div>
      </div>

      {/* ── ACTION FOOTER ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

/* ── Inline Design System Token Styles ── */
const sectionCardStyle = {
  background: 'var(--lms-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 14,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
};

const sectionHeadStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  paddingBottom: 16,
  borderBottom: '1px solid var(--border-color)'
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '-0.3px'
};

const sectionSubStyle = {
  margin: '2px 0 0',
  fontSize: 13,
  color: 'var(--text-muted)'
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-primary)'
};

const iconBoxStyle = (bg, color) => ({
  width: 40,
  height: 40,
  borderRadius: 10,
  background: bg,
  color: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
});

export default CourseForm;
