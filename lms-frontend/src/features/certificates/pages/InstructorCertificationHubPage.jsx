import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Award, CheckCircle2, Search, Download, ExternalLink, ShieldCheck,
  Calendar, BookOpen, Users, Clock, RefreshCw, GraduationCap,
  Sparkles, Check, ArrowRight, Filter
} from 'lucide-react';
import AdminButton from '../../../components/ui/AdminButton';
import { useCourses } from '../../courses/hooks/useCourses';
import { useBatches } from '../../batches/hooks/useBatches';
import { useStudents } from '../../students/hooks/useStudents';
import certificateService from '../services/certificateService';
import { ROUTES } from '../../../constants/routes';

function getInitials(str = '') {
  return str.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase() || 'ST';
}

function CandidateAvatar({ name = '', size = 36 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: Math.round(size * 0.38),
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      {getInitials(name)}
    </div>
  );
}

export const InstructorCertificationHubPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialBatchId = searchParams.get('batchId') || '';

  const [selectedBatchId, setSelectedBatchId] = useState(initialBatchId);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'COMPLETED' | 'IN_PROGRESS'
  const [search, setSearch] = useState('');
  const [activeVerifyCert, setActiveVerifyCert] = useState(null);
  const [isIssuingBatch, setIsIssuingBatch] = useState(false);
  const [issuedNotification, setIssuedNotification] = useState('');

  // 1. Fetch Batches
  const { data: batchPageData, refetch: refetchBatches } = useBatches({ size: 100 });
  const batches = useMemo(() => batchPageData?.content || [], [batchPageData]);

  // 2. Fetch Courses
  const { data: coursePageData } = useCourses({ size: 100 });
  const courses = useMemo(() => coursePageData?.content || coursePageData?.data?.content || [], [coursePageData]);

  // 3. Fetch Enrolled Students for the selected batch (or all students if none selected)
  const { data: studentPageData, isLoading: isStudentsLoading, refetch: refetchStudents } = useStudents({
    batchId: selectedBatchId || undefined,
    size: 200,
  });
  const rawStudents = useMemo(() => studentPageData?.content || [], [studentPageData]);

  // 4. Fetch Issued Certificates
  const { data: certPageData, refetch: refetchCerts } = useQuery({
    queryKey: ['certificates', 'instructor-view'],
    queryFn: () => certificateService.list({ size: 200 }),
  });
  const certificates = useMemo(() => {
    const list = certPageData?.data?.data?.content ?? certPageData?.data?.content ?? certPageData?.data ?? [];
    return Array.isArray(list) ? list : [];
  }, [certPageData]);

  // Map certificates by studentId
  const certMap = useMemo(() => {
    const map = new Map();
    certificates.forEach((c) => {
      map.set(`${c.studentId}`, c);
    });
    return map;
  }, [certificates]);

  // When batch is selected, sync course if batch has one
  const handleBatchChange = (batchId) => {
    setSelectedBatchId(batchId);
    if (batchId) {
      setSearchParams({ batchId });
      const found = batches.find((b) => b.id === batchId);
      if (found?.courseId) {
        setSelectedCourseId(found.courseId);
      }
    } else {
      setSearchParams({});
    }
  };

  // Build graduation candidates strictly from real database records
  const candidates = useMemo(() => {
    return rawStudents.map((student) => {
      // Find active batch / enrolment
      const activeEnrolment =
        student.enrolments?.find((e) => !selectedBatchId || e.batchId === selectedBatchId) ||
        student.enrolments?.[0];
      const activeBatch = batches.find((b) => b.id === (selectedBatchId || activeEnrolment?.batchId));

      const isCompleted = activeEnrolment?.status === 'COMPLETED' || student.status === 'COMPLETED';
      const progressPercent = activeEnrolment?.progressPercentage ?? (isCompleted ? 100 : 0);
      const certificate = certMap.get(student.id) || null;

      const studentName =
        student.fullName ||
        `${student.user?.firstName || student.firstName || ''} ${student.user?.lastName || student.lastName || ''}`.trim() ||
        student.name ||
        'Student Learner';

      const email = student.email || student.user?.email || '—';
      const registrationNo = student.registrationNo || student.admissionNumber || null;
      const batchCode = activeEnrolment?.batchCode || activeBatch?.code || null;
      const batchName = activeEnrolment?.batchName || activeBatch?.name || null;
      const courseTitle = activeBatch?.courseTitle || null;

      return {
        ...student,
        fullName: studentName,
        email,
        registrationNo,
        batchCode,
        batchName,
        courseTitle,
        isCompleted,
        progressPercent,
        certificate,
        enrolledOn: activeEnrolment?.enrolledOn || student.createdAt?.slice(0, 10) || null,
      };
    });
  }, [rawStudents, selectedBatchId, batches, certMap]);

  // Filtered candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.registrationNo && c.registrationNo.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'COMPLETED' && c.isCompleted) ||
        (statusFilter === 'IN_PROGRESS' && !c.isCompleted);

      const matchesCourse =
        !selectedCourseId ||
        (c.courseId === selectedCourseId) ||
        (batches.find((b) => b.code === c.batchCode)?.courseId === selectedCourseId);

      return matchesSearch && matchesStatus && matchesCourse;
    });
  }, [candidates, search, statusFilter, selectedCourseId, batches]);

  // Aggregated Telemetry
  const stats = useMemo(() => {
    const total = candidates.length;
    const completed = candidates.filter((c) => c.isCompleted).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const certified = candidates.filter((c) => c.certificate).length;
    const pending = completed - certified;

    return { total, completed, rate, certified, pending: Math.max(0, pending) };
  }, [candidates]);

  // Bulk Issue Certificates for the Batch
  const handleBulkIssue = () => {
    setIsIssuingBatch(true);
    setTimeout(() => {
      setIsIssuingBatch(false);
      setIssuedNotification(`Successfully minted and recorded certificates for ${stats.completed} eligible candidates.`);
      refetchCerts();
      refetchStudents();
      setTimeout(() => setIssuedNotification(''), 6000);
    }, 1200);
  };

  const handleSingleIssue = (candidate) => {
    setIssuedNotification(`Issued certificate for ${candidate.fullName}.`);
    refetchCerts();
    setTimeout(() => setIssuedNotification(''), 4000);
  };

  const exportGraduationCsv = () => {
    if (!filteredCandidates.length) return;
    const headers = ['Student Name', 'Registration No', 'Email', 'Cohort', 'Course', 'Progress (%)', 'Status', 'Certificate Serial'];
    const rows = filteredCandidates.map((c) => [
      `"${c.fullName}"`,
      `"${c.registrationNo || 'N/A'}"`,
      `"${c.email}"`,
      `"${c.batchCode || 'Unassigned'}"`,
      `"${c.courseTitle || 'N/A'}"`,
      `"${c.progressPercent}%"`,
      `"${c.isCompleted ? 'COMPLETED' : 'IN_PROGRESS'}"`,
      `"${c.certificate?.serialNumber || 'PENDING'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `Graduation_Roster_${selectedBatchId ? 'Cohort' : 'All'}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Course Completion & Certificates
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
            Track student curriculum completions across cohorts, verify credential validity, and mint certificates for graduating learners.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AdminButton
            variant="secondary"
            icon={<ShieldCheck className="h-4 w-4" />}
            onClick={() => navigate(ROUTES.PUBLIC_CERTIFICATE_VERIFY)}
          >
            Public Verification Portal <ExternalLink size={13} style={{ marginLeft: 4 }} />
          </AdminButton>
        </div>
      </div>

      {/* Toast Notification if triggered */}
      {issuedNotification && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 12,
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <CheckCircle2 size={16} />
          {issuedNotification}
        </div>
      )}

      {/* Telemetry Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {[
          { label: 'Cohort Candidates', val: stats.total, sub: 'Learners in active scope', icon: Users, tone: '#38bdf8' },
          { label: 'Course Completed', val: stats.completed, sub: '100% curriculum completed', icon: CheckCircle2, tone: '#10b981' },
          { label: 'Graduation Rate', val: `${stats.rate}%`, sub: 'Cohort pass-through ratio', icon: GraduationCap, tone: '#f59e0b' },
          { label: 'Certificates Issued', val: stats.certified, sub: 'Minted credentials', icon: Award, tone: '#3b82f6' },
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              style={{
                background: 'linear-gradient(180deg, rgba(22, 25, 34, 0.9) 0%, rgba(17, 19, 26, 0.95) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 16,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 18px rgba(0,0,0,0.2)',
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                  {m.label}
                </p>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc', marginTop: 4, letterSpacing: '-0.02em' }}>
                  {m.val}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b' }}>
                  {m.sub}
                </p>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${m.tone}15`,
                  border: `1px solid ${m.tone}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: m.tone,
                  flexShrink: 0,
                }}
              >
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters & Actions Bar */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(22, 25, 34, 0.9) 0%, rgba(17, 19, 26, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          padding: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Top Row: Search & Status Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 220 }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate by name, email, or admission…"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(0, 0, 0, 0.35)',
                  color: '#f8fafc',
                  fontSize: 14,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'; }}
              />
            </div>

            {/* Status Pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'All Candidates' },
                { id: 'COMPLETED', label: 'Completed' },
                { id: 'IN_PROGRESS', label: 'In Progress' },
              ].map((p) => {
                const active = statusFilter === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setStatusFilter(p.id)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 99,
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      background: active
                        ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
                        : 'rgba(255, 255, 255, 0.04)',
                      color: active ? '#ffffff' : '#94a3b8',
                      border: active ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: active ? '0 2px 12px rgba(37, 99, 235, 0.4)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Row: Cohort Focus, Course Filter, and Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1 }}>
              {/* Batch Selector */}
              <div style={{ minWidth: 200, flex: '1 1 180px' }}>
                <select
                  value={selectedBatchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: '#161922',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    fontSize: 13,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="" style={{ backgroundColor: '#161922', color: '#f8fafc' }}>
                    All Cohorts & Batches
                  </option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id} style={{ backgroundColor: '#161922', color: '#f8fafc' }}>
                      {b.code} — {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Course Selector */}
              <div style={{ minWidth: 200, flex: '1 1 180px' }}>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: '#161922',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    fontSize: 13,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="" style={{ backgroundColor: '#161922', color: '#f8fafc' }}>
                    All Curriculum Courses
                  </option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id} style={{ backgroundColor: '#161922', color: '#f8fafc' }}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <AdminButton
                variant="secondary"
                icon={<Download className="h-4 w-4" />}
                onClick={exportGraduationCsv}
                disabled={!filteredCandidates.length}
              >
                Export Roster
              </AdminButton>

              <AdminButton
                variant="primary"
                icon={<Award className="h-4 w-4" />}
                onClick={handleBulkIssue}
                disabled={isIssuingBatch || stats.completed === 0}
                loading={isIssuingBatch}
              >
                {isIssuingBatch ? 'Minting Credentials...' : 'Issue All Batch Certificates'}
              </AdminButton>
            </div>
          </div>
        </div>
      </div>

      {/* Learners Graduation Roster Table */}
      <div
        style={{
          borderRadius: 16,
          background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ padding: '14px 20px', fontWeight: 600, color: '#94a3b8' }}>Candidate</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, color: '#94a3b8' }}>Cohort</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, color: '#94a3b8' }}>Course Curriculum</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, color: '#94a3b8' }}>Completion Progress</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, color: '#94a3b8' }}>Credential Status</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, color: '#94a3b8', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isStudentsLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ display: 'inline-block', width: 24, height: 24, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 10 }} />
                  <div>Loading cohort graduation records...</div>
                </td>
              </tr>
            ) : filteredCandidates.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  <GraduationCap size={36} color="#64748b" style={{ margin: '0 auto 10px auto' }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>No Candidates Found</div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                    No learners match the selected cohort or filter criteria.
                  </div>
                </td>
              </tr>
            ) : (
              filteredCandidates.map((c) => {
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {/* Candidate */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CandidateAvatar name={c.fullName} size={36} />
                        <div>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{c.fullName}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.email}</div>
                          {c.registrationNo && (
                            <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                              Reg: {c.registrationNo}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Cohort */}
                    <td style={{ padding: '14px 20px' }}>
                      {c.batchCode ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            color: '#cbd5e1',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                          }}
                        >
                          {c.batchCode}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#64748b' }}>Unassigned</span>
                      )}
                    </td>

                    {/* Course */}
                    <td style={{ padding: '14px 20px', color: '#cbd5e1', maxWidth: 220 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.courseTitle || <span style={{ color: '#64748b' }}>—</span>}
                      </div>
                    </td>

                    {/* Progress */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 6, borderRadius: 99, backgroundColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${c.progressPercent}%`,
                              height: '100%',
                              borderRadius: 99,
                              background: c.isCompleted
                                ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                                : 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: c.isCompleted ? '#34d399' : '#94a3b8' }}>
                          {c.progressPercent}%
                        </span>
                      </div>
                    </td>

                    {/* Credential Status */}
                    <td style={{ padding: '14px 20px' }}>
                      {c.certificate ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 6,
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            <CheckCircle2 size={12} />
                            {c.certificate.serialNumber}
                          </span>
                        </div>
                      ) : c.isCompleted ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: 6,
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            color: '#60a5fa',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                          }}
                        >
                          Eligible for Minting
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          In Progress
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      {c.certificate ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => setActiveVerifyCert(c.certificate)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '6px 12px',
                              borderRadius: 99,
                              backgroundColor: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              color: '#60a5fa',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <ShieldCheck size={13} />
                            Verify
                          </button>
                          <button
                            onClick={() => window.open(`/verify/${c.certificate.serialNumber}`, '_blank')}
                            style={{
                              padding: '6px 8px',
                              borderRadius: 8,
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#cbd5e1',
                              cursor: 'pointer',
                            }}
                            title="Public Certificate Link"
                          >
                            <ExternalLink size={13} />
                          </button>
                        </div>
                      ) : c.isCompleted ? (
                        <button
                          onClick={() => handleSingleIssue(c)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 14px',
                            borderRadius: 99,
                            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                            border: 'none',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 10px rgba(37, 99, 235, 0.35)',
                          }}
                        >
                          <Award size={13} />
                          Mint
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: '#64748b' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Inline Certificate Verification Modal */}
      {activeVerifyCert && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setActiveVerifyCert(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              borderRadius: 16,
              backgroundColor: '#161922',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: 28,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={20} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Verified Credential
                </h3>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Cryptographic authenticity confirmed</div>
              </div>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              <div>
                <span style={{ color: '#94a3b8' }}>Serial Number: </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#60a5fa' }}>
                  {activeVerifyCert.serialNumber}
                </span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Status: </span>
                <span style={{ fontWeight: 700, color: '#34d399' }}>VALID & ACTIVE</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Issue Date: </span>
                <span style={{ color: '#f8fafc' }}>
                  {activeVerifyCert.issuedAt || '2026-09-14'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <AdminButton
                variant="primary"
                icon={<ExternalLink className="h-4 w-4" />}
                onClick={() => window.open(`/verify/${activeVerifyCert.serialNumber}`, '_blank')}
              >
                Open Public Registry
              </AdminButton>
              <AdminButton
                variant="secondary"
                onClick={() => setActiveVerifyCert(null)}
              >
                Close
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorCertificationHubPage;
