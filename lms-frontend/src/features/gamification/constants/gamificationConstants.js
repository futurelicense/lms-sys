import React from 'react';
import {
  Trophy,
  Award,
  Flame,
  Star,
  Zap,
  Crown,
  Target,
  BookOpen,
  GraduationCap,
  Sparkles,
  Medal,
  CheckCircle2,
  TrendingUp,
  Shield,
  Layers,
} from 'lucide-react';

export const BADGE_ICONS = {
  trophy: Trophy,
  award: Award,
  flame: Flame,
  star: Star,
  zap: Zap,
  crown: Crown,
  target: Target,
  book: BookOpen,
  'book-open': BookOpen,
  graduation: GraduationCap,
  sparkles: Sparkles,
  medal: Medal,
  shield: Shield,
  layers: Layers,
  trending: TrendingUp,
  check: CheckCircle2,
};

export const GamificationIcon = ({ name, className = 'h-5 w-5' }) => {
  const key = name ? name.toLowerCase().trim() : '';
  const Comp = BADGE_ICONS[key] || Award;
  return React.createElement(Comp, { className });
};

export const LEADERBOARD_PERIODS = [
  { value: 'ALL_TIME', label: 'All Time' },
  { value: 'THIS_MONTH', label: 'This Month' },
  { value: 'THIS_WEEK', label: 'This Week' },
];

export const BADGE_CATEGORIES = {
  COURSE: 'Course',
  LESSON: 'Lesson',
  ASSESSMENT: 'Assessment',
  STREAK: 'Streak',
  GENERAL: 'General',
};

export const EVENT_TYPE_LABELS = {
  LESSON_COMPLETION: 'Lesson Completed',
  COURSE_COMPLETION: 'Course Completed',
  ASSESSMENT_COMPLETION: 'Assessment Attempted',
  ASSESSMENT_PASS: 'Assessment Passed',
  HIGH_SCORE: 'High Score (90%+)',
  DAILY_ACTIVITY: 'Daily Learning Activity',
  BADGE_EARNED: 'Badge Earned',
};
