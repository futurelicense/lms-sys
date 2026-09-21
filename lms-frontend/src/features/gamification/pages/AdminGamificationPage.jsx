import React, { useState } from 'react';
import {
  Award,
  Shield,
  Target,
  Zap,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import {
  useAdminBadges,
  useCreateBadge,
  useUpdateBadge,
  useDeleteBadge,
  useAdminLevels,
  useCreateLevel,
  useUpdateLevel,
  useDeleteLevel,
  useAdminMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useAdminPointRules,
  useUpdatePointRule,
} from '../hooks/useGamification';
import { EVENT_TYPE_LABELS } from '../constants/gamificationConstants';

export const AdminGamificationPage = () => {
  const [activeTab, setActiveTab] = useState('POINT_RULES');

  // Modals state
  const [editingRule, setEditingRule] = useState(null);
  const [rulePoints, setRulePoints] = useState('');

  const [badgeModal, setBadgeModal] = useState({ isOpen: false, badge: null });
  const [badgeForm, setBadgeForm] = useState({
    name: '',
    description: '',
    icon: 'trophy',
    category: 'GENERAL',
    criteriaType: 'LESSONS_COMPLETED',
    criteriaValue: 1,
    active: true,
  });

  const [levelModal, setLevelModal] = useState({ isOpen: false, level: null });
  const [levelForm, setLevelForm] = useState({
    levelNumber: 1,
    title: '',
    minPoints: 0,
    maxPoints: '',
    icon: 'shield',
    color: '#6366f1',
  });

  const [milestoneModal, setMilestoneModal] = useState({ isOpen: false, milestone: null });
  const [milestoneForm, setMilestoneForm] = useState({
    key: '',
    name: '',
    description: '',
    icon: 'target',
    criteriaType: 'LESSONS_COMPLETED',
    criteriaValue: 1,
    sortOrder: 0,
    active: true,
  });

  // Queries & Mutations
  const { data: pointRules = [], isLoading: isRulesLoading } = useAdminPointRules();
  const updateRuleMutation = useUpdatePointRule();

  const { data: badges = [], isLoading: isBadgesLoading } = useAdminBadges();
  const createBadgeMutation = useCreateBadge();
  const updateBadgeMutation = useUpdateBadge();
  const deleteBadgeMutation = useDeleteBadge();

  const { data: levels = [], isLoading: isLevelsLoading } = useAdminLevels();
  const createLevelMutation = useCreateLevel();
  const updateLevelMutation = useUpdateLevel();
  const deleteLevelMutation = useDeleteLevel();

  const { data: milestones = [], isLoading: isMilestonesLoading } = useAdminMilestones();
  const createMilestoneMutation = useCreateMilestone();
  const updateMilestoneMutation = useUpdateMilestone();
  const deleteMilestoneMutation = useDeleteMilestone();

  // Point Rule Handlers
  const handleSaveRule = (id, active) => {
    const points = parseInt(rulePoints, 10);
    if (!isNaN(points) && points >= 0) {
      updateRuleMutation.mutate({ id, data: { points, active } });
    }
    setEditingRule(null);
  };

  // Badge Handlers
  const openBadgeModal = (badge = null) => {
    if (badge) {
      setBadgeForm({
        name: badge.name,
        description: badge.description,
        icon: badge.icon || 'trophy',
        category: badge.category || 'GENERAL',
        criteriaType: badge.criteriaType || 'LESSONS_COMPLETED',
        criteriaValue: badge.criteriaValue || 1,
        active: badge.active ?? true,
      });
      setBadgeModal({ isOpen: true, badge });
    } else {
      setBadgeForm({
        name: '',
        description: '',
        icon: 'trophy',
        category: 'GENERAL',
        criteriaType: 'LESSONS_COMPLETED',
        criteriaValue: 1,
        active: true,
      });
      setBadgeModal({ isOpen: true, badge: null });
    }
  };

  const handleSaveBadge = (e) => {
    e.preventDefault();
    if (badgeModal.badge) {
      updateBadgeMutation.mutate(
        { id: badgeModal.badge.id, data: badgeForm },
        { onSuccess: () => setBadgeModal({ isOpen: false, badge: null }) }
      );
    } else {
      createBadgeMutation.mutate(badgeForm, {
        onSuccess: () => setBadgeModal({ isOpen: false, badge: null }),
      });
    }
  };

  // Level Handlers
  const openLevelModal = (level = null) => {
    if (level) {
      setLevelForm({
        levelNumber: level.levelNumber,
        title: level.title,
        minPoints: level.minPoints,
        maxPoints: level.maxPoints != null ? level.maxPoints : '',
        icon: level.icon || 'shield',
        color: level.color || '#6366f1',
      });
      setLevelModal({ isOpen: true, level });
    } else {
      setLevelForm({
        levelNumber: (levels.length || 0) + 1,
        title: '',
        minPoints: 0,
        maxPoints: '',
        icon: 'shield',
        color: '#6366f1',
      });
      setLevelModal({ isOpen: true, level: null });
    }
  };

  const handleSaveLevel = (e) => {
    e.preventDefault();
    const payload = {
      ...levelForm,
      levelNumber: parseInt(levelForm.levelNumber, 10),
      minPoints: parseInt(levelForm.minPoints, 10),
      maxPoints: levelForm.maxPoints ? parseInt(levelForm.maxPoints, 10) : null,
    };
    if (levelModal.level) {
      updateLevelMutation.mutate(
        { id: levelModal.level.id, data: payload },
        { onSuccess: () => setLevelModal({ isOpen: false, level: null }) }
      );
    } else {
      createLevelMutation.mutate(payload, {
        onSuccess: () => setLevelModal({ isOpen: false, level: null }),
      });
    }
  };

  // Milestone Handlers
  const openMilestoneModal = (milestone = null) => {
    if (milestone) {
      setMilestoneForm({
        key: milestone.key,
        name: milestone.name,
        description: milestone.description,
        icon: milestone.icon || 'target',
        criteriaType: milestone.criteriaType || 'LESSONS_COMPLETED',
        criteriaValue: milestone.criteriaValue || 1,
        sortOrder: milestone.sortOrder || 0,
        active: milestone.active ?? true,
      });
      setMilestoneModal({ isOpen: true, milestone });
    } else {
      setMilestoneForm({
        key: '',
        name: '',
        description: '',
        icon: 'target',
        criteriaType: 'LESSONS_COMPLETED',
        criteriaValue: 1,
        sortOrder: milestones.length,
        active: true,
      });
      setMilestoneModal({ isOpen: true, milestone: null });
    }
  };

  const handleSaveMilestone = (e) => {
    e.preventDefault();
    const payload = {
      ...milestoneForm,
      criteriaValue: parseInt(milestoneForm.criteriaValue, 10),
      sortOrder: parseInt(milestoneForm.sortOrder, 10),
    };
    if (milestoneModal.milestone) {
      updateMilestoneMutation.mutate(
        { id: milestoneModal.milestone.id, data: payload },
        { onSuccess: () => setMilestoneModal({ isOpen: false, milestone: null }) }
      );
    } else {
      createMilestoneMutation.mutate(payload, {
        onSuccess: () => setMilestoneModal({ isOpen: false, milestone: null }),
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Gamification Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure point rewards, learner levels, unlockable badges, and milestones.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-medium dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('POINT_RULES')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === 'POINT_RULES'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Point Rules
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('BADGES')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === 'BADGES'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Award className="h-3.5 w-3.5 text-indigo-500" />
            Badges
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LEVELS')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === 'LEVELS'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            Levels
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MILESTONES')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === 'MILESTONES'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Target className="h-3.5 w-3.5 text-purple-500" />
            Milestones
          </button>
        </div>
      </div>

      {/* Tab 1: Point Rules */}
      {activeTab === 'POINT_RULES' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Configured Point Rewards
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Define how many points students receive when triggering each event type.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <th className="py-3 px-3">Event Type</th>
                  <th className="py-3 px-3">Reward Points</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {isRulesLoading ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-slate-400">
                      Loading rules...
                    </td>
                  </tr>
                ) : (
                  pointRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {EVENT_TYPE_LABELS[rule.eventType] || rule.eventType}
                        <span className="ml-2 font-mono text-[10px] text-slate-400">
                          ({rule.eventType})
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {editingRule === rule.id ? (
                          <input
                            type="number"
                            min="0"
                            value={rulePoints}
                            onChange={(e) => setRulePoints(e.target.value)}
                            className="w-24 rounded-lg border border-indigo-500 px-2 py-1 text-sm font-bold focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            +{rule.points} pts
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            rule.active
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {rule.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right">
                        {editingRule === rule.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveRule(rule.id, rule.active)}
                              className="rounded-md bg-emerald-600 p-1 text-white hover:bg-emerald-700"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRule(null)}
                              className="rounded-md bg-slate-200 p-1 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRule(rule.id);
                              setRulePoints(String(rule.points));
                            }}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Badges */}
      {activeTab === 'BADGES' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Badge Catalog
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create and manage achievements that students can unlock.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openBadgeModal()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              Add Badge
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <th className="py-3 px-3">Badge</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Criteria</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {isBadgesLoading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                      Loading badges...
                    </td>
                  </tr>
                ) : (
                  badges.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{b.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{b.description}</div>
                      </td>
                      <td className="py-3 px-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                        {b.category}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400">
                        {b.criteriaType} ({b.criteriaValue})
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            b.active
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {b.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openBadgeModal(b)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteBadgeMutation.mutate(b.id)}
                            className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Levels */}
      {activeTab === 'LEVELS' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Progression Levels
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define level titles and points brackets for student progression.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openLevelModal()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              Add Level
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <th className="py-3 px-3">Level #</th>
                  <th className="py-3 px-3">Title</th>
                  <th className="py-3 px-3">Min Points</th>
                  <th className="py-3 px-3">Max Points</th>
                  <th className="py-3 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {isLevelsLoading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                      Loading levels...
                    </td>
                  </tr>
                ) : (
                  levels.map((lvl) => (
                    <tr key={lvl.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                        Level {lvl.levelNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-indigo-600 dark:text-indigo-400">
                        {lvl.title}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400">
                        {lvl.minPoints?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400">
                        {lvl.maxPoints != null ? lvl.maxPoints.toLocaleString() : 'Infinity'}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openLevelModal(lvl)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteLevelMutation.mutate(lvl.id)}
                            className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Milestones */}
      {activeTab === 'MILESTONES' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Milestones
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure key learner journey goals and thresholds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openMilestoneModal()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              Add Milestone
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <th className="py-3 px-3">Key</th>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Criteria</th>
                  <th className="py-3 px-3">Order</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {isMilestonesLoading ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-xs text-slate-400">
                      Loading milestones...
                    </td>
                  </tr>
                ) : (
                  milestones.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 px-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {m.key}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{m.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{m.description}</div>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400">
                        {m.criteriaType} ({m.criteriaValue})
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400">
                        {m.sortOrder}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            m.active
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {m.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openMilestoneModal(m)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMilestoneMutation.mutate(m.id)}
                            className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Badge Modal */}
      {badgeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {badgeModal.badge ? 'Edit Badge' : 'Create New Badge'}
            </h3>
            <form onSubmit={handleSaveBadge} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Name</label>
                <input
                  type="text"
                  required
                  value={badgeForm.name}
                  onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  required
                  rows={2}
                  value={badgeForm.description}
                  onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Icon Key</label>
                  <input
                    type="text"
                    value={badgeForm.icon}
                    onChange={(e) => setBadgeForm({ ...badgeForm, icon: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={badgeForm.category}
                    onChange={(e) => setBadgeForm({ ...badgeForm, category: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="GENERAL">GENERAL</option>
                    <option value="LESSON">LESSON</option>
                    <option value="COURSE">COURSE</option>
                    <option value="ASSESSMENT">ASSESSMENT</option>
                    <option value="STREAK">STREAK</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Criteria Type</label>
                  <select
                    value={badgeForm.criteriaType}
                    onChange={(e) => setBadgeForm({ ...badgeForm, criteriaType: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="LESSONS_COMPLETED">LESSONS_COMPLETED</option>
                    <option value="COURSES_COMPLETED">COURSES_COMPLETED</option>
                    <option value="ASSESSMENTS_PASSED">ASSESSMENTS_PASSED</option>
                    <option value="HIGH_SCORE">HIGH_SCORE</option>
                    <option value="STREAK_DAYS">STREAK_DAYS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Target Value</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={badgeForm.criteriaValue}
                    onChange={(e) => setBadgeForm({ ...badgeForm, criteriaValue: parseInt(e.target.value, 10) || 1 })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="badgeActive"
                  checked={badgeForm.active}
                  onChange={(e) => setBadgeForm({ ...badgeForm, active: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <label htmlFor="badgeActive" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Active (awardable to learners)
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setBadgeModal({ isOpen: false, badge: null })}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Save Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Level Modal */}
      {levelModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {levelModal.level ? 'Edit Level' : 'Create New Level'}
            </h3>
            <form onSubmit={handleSaveLevel} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Level Number</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={levelForm.levelNumber}
                    onChange={(e) => setLevelForm({ ...levelForm, levelNumber: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Title</label>
                  <input
                    type="text"
                    required
                    value={levelForm.title}
                    onChange={(e) => setLevelForm({ ...levelForm, title: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Min Points</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={levelForm.minPoints}
                    onChange={(e) => setLevelForm({ ...levelForm, minPoints: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Max Points (blank for max)</label>
                  <input
                    type="number"
                    min="0"
                    value={levelForm.maxPoints}
                    onChange={(e) => setLevelForm({ ...levelForm, maxPoints: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setLevelModal({ isOpen: false, level: null })}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Save Level
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Milestone Modal */}
      {milestoneModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {milestoneModal.milestone ? 'Edit Milestone' : 'Create New Milestone'}
            </h3>
            <form onSubmit={handleSaveMilestone} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Key (Unique)</label>
                  <input
                    type="text"
                    required
                    value={milestoneForm.key}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, key: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Name</label>
                  <input
                    type="text"
                    required
                    value={milestoneForm.name}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  required
                  rows={2}
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Criteria Type</label>
                  <select
                    value={milestoneForm.criteriaType}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, criteriaType: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="LESSONS_COMPLETED">LESSONS_COMPLETED</option>
                    <option value="COURSES_COMPLETED">COURSES_COMPLETED</option>
                    <option value="ASSESSMENTS_PASSED">ASSESSMENTS_PASSED</option>
                    <option value="HIGH_SCORE">HIGH_SCORE</option>
                    <option value="STREAK_DAYS">STREAK_DAYS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Target Value</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={milestoneForm.criteriaValue}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, criteriaValue: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setMilestoneModal({ isOpen: false, milestone: null })}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGamificationPage;
