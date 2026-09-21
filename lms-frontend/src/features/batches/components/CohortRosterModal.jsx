import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  X, Users, Search, Download, Calendar, Clock, BookOpen,
  Mail, Phone, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, Filter,
  UserPlus, Check, ChevronDown, Award
} from 'lucide-react';
import { useStudents } from '../../students/hooks/useStudents';
import studentService from '../../students/services/studentService';
import { QUERY_KEYS } from '../../../constants/appConstants';
import { useToast } from '../../../components/feedback/Toast';

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

export const CohortRosterModal = ({ batch, isOpen, onClose }) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState('');
  const [enrollStatus, setEnrollStatus] = useState('ACTIVE');
  const [isSubmittingEnroll, setIsSubmittingEnroll] = useState(false);

  // 1. Fetch Students in THIS batch
  const { data: studentPage, isLoading, refetch: refetchCohortStudents } = useStudents({
    batchId: batch?.id,
    size: 200,
  });

  const students = useMemo(() => {
    return studentPage?.content || [];
  }, [studentPage]);

  // 2. Fetch ALL students for the intake/enroll selector
  const { data: allStudentPage } = useStudents({
    size: 200,
  });

  const availableStudents = useMemo(() => {
    const enrolledIds = new Set(students.map((s) => s.id));
    const all = allStudentPage?.content || [];
    return all.filter((s) => !enrolledIds.has(s.id));
  }, [allStudentPage, students]);

  // Filtered enrolled students for display
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const fullName = (student.fullName || `${student.user?.firstName || ''} ${student.user?.lastName || ''}`).toLowerCase();
      const email = (student.email || student.user?.email || '').toLowerCase();
      const admissionNo = (student.registrationNo || student.admissionNumber || '').toLowerCase();
      const query = search.toLowerCase();

      const matchesSearch = !query || fullName.includes(query) || email.includes(query) || admissionNo.includes(query);

      const enrolment = student.enrolments?.find((e) => e.batchId === batch?.id);
      const studentStatus = enrolment?.status || student.status || 'ACTIVE';
      const matchesStatus = statusFilter === 'ALL' || studentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusFilter, batch?.id]);

  // Handle enrolling a learner into this batch
  const handleEnrollStudent = async () => {
    if (!selectedStudentToEnroll) return;
    setIsSubmittingEnroll(true);
    try {
      const targetStudent = allStudentPage?.content?.find((s) => s.id === selectedStudentToEnroll);
      const existingEnrolments = (targetStudent?.enrolments || []).map((e) => ({
        batchId: e.batchId,
        enrolledOn: e.enrolledOn || new Date().toISOString().slice(0, 10),
        status: e.status || 'ACTIVE',
      }));

      // Add new batch enrolment
      const updatedEnrolments = [
        ...existingEnrolments.filter((e) => e.batchId !== batch.id),
        {
          batchId: batch.id,
          enrolledOn: new Date().toISOString().slice(0, 10),
          status: enrollStatus,
        },
      ];

      await studentService.update(selectedStudentToEnroll, {
        enrolments: updatedEnrolments,
      });

      toast.success(`Enrolled ${targetStudent?.fullName || 'student'} into ${batch.code}`);
      setIsAddMode(false);
      setSelectedStudentToEnroll('');
      refetchCohortStudents();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BATCHES });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to enroll student');
    } finally {
      setIsSubmittingEnroll(false);
    }
  };

  // Handle status update for a student in this batch
  const handleUpdateStatus = async (student, newStatus) => {
    try {
      const existingEnrolments = (student.enrolments || []).map((e) => ({
        batchId: e.batchId,
        enrolledOn: e.enrolledOn || new Date().toISOString().slice(0, 10),
        status: e.batchId === batch.id ? newStatus : (e.status || 'ACTIVE'),
      }));

      await studentService.update(student.id, {
        enrolments: existingEnrolments,
      });

      toast.success(`Updated status to ${newStatus}`);
      refetchCohortStudents();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENTS });
    } catch (err) {
      toast.error('Failed to update enrolment status');
    }
  };

  const exportRosterCsv = () => {
    if (!filteredStudents.length) return;
    const headers = ['Student Name', 'Registration No', 'Email', 'Phone', 'Enrolment Date', 'Status'];
    const rows = filteredStudents.map((s) => {
      const enrolment = s.enrolments?.find((e) => e.batchId === batch?.id);
      return [
        `"${s.fullName || `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim() || 'Learner'}"`,
        `"${s.registrationNo || s.admissionNumber || 'N/A'}"`,
        `"${s.email || s.user?.email || 'N/A'}"`,
        `"${s.phone || s.user?.phoneNumber || 'N/A'}"`,
        `"${enrolment?.enrolledOn || s.createdAt?.slice(0, 10) || 'N/A'}"`,
        `"${enrolment?.status || 'ACTIVE'}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${batch.code || 'cohort'}_student_roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !batch) return null;

  const enrolledCount = batch.enrolledCount ?? students.length;
  const capacity = batch.capacity;
  const fillPercentage = capacity ? Math.min(100, Math.round((enrolledCount / capacity) * 100)) : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 999,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '740px',
          height: '100%',
          backgroundColor: '#161922',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(180deg, #1c1f2b 0%, #161922 100%)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  {batch.code}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor:
                      batch.status === 'IN_PROGRESS' || batch.status === 'ONGOING'
                        ? 'rgba(16, 185, 129, 0.18)'
                        : 'rgba(255, 255, 255, 0.08)',
                    color:
                      batch.status === 'IN_PROGRESS' || batch.status === 'ONGOING'
                        ? '#34d399'
                        : '#94a3b8',
                    border: `1px solid ${
                      batch.status === 'IN_PROGRESS' || batch.status === 'ONGOING'
                        ? 'rgba(16, 185, 129, 0.3)'
                        : 'rgba(255, 255, 255, 0.1)'
                    }`,
                  }}
                >
                  {batch.status}
                </span>
                {batch.deliveryMode && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#cbd5e1',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {batch.deliveryMode}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                {batch.name}
              </h2>
              {batch.courseTitle && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: '#94a3b8', fontSize: '13px' }}>
                  <BookOpen size={14} color="#38bdf8" />
                  <span>Curriculum: <strong style={{ color: '#e2e8f0' }}>{batch.courseTitle}</strong></span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '8px',
                color: '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginTop: 18,
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Enrolled Learners</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                {students.length} {capacity ? `/ ${capacity}` : ''}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Capacity Fill Rate</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8', marginTop: 2 }}>
                {fillPercentage !== null ? `${fillPercentage}%` : 'Flexible'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Completed Learners</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#34d399', marginTop: 2 }}>
                {students.filter((s) => s.enrolments?.find((e) => e.batchId === batch.id)?.status === 'COMPLETED').length}
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Status Filter & Enroll Learner Button */}
        <div
          style={{
            padding: '14px 28px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search candidates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'; }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#161922',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL" style={{ backgroundColor: '#161922', color: '#cbd5e1' }}>All Statuses</option>
              <option value="ACTIVE" style={{ backgroundColor: '#161922', color: '#cbd5e1' }}>Active</option>
              <option value="COMPLETED" style={{ backgroundColor: '#161922', color: '#cbd5e1' }}>Completed</option>
              <option value="SUSPENDED" style={{ backgroundColor: '#161922', color: '#cbd5e1' }}>Suspended</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setIsAddMode(!isAddMode)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 99,
                background: isAddMode ? 'rgba(255, 255, 255, 0.12)' : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: isAddMode ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              <UserPlus size={14} />
              {isAddMode ? 'Cancel' : 'Enroll Learner'}
            </button>

            <button
              onClick={exportRosterCsv}
              disabled={!filteredStudents.length}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 99,
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#e2e8f0',
                fontSize: '12px',
                fontWeight: 600,
                cursor: filteredStudents.length ? 'pointer' : 'not-allowed',
                opacity: filteredStudents.length ? 1 : 0.5,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { if (filteredStudents.length) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; }}
              onMouseLeave={(e) => { if (filteredStudents.length) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'; }}
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Enroll Learner Drawer Form */}
        {isAddMode && (
          <div
            style={{
              padding: '16px 28px',
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              borderBottom: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserPlus size={15} color="#38bdf8" />
              Enroll Existing Student from Institution Database into {batch.code}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={selectedStudentToEnroll}
                onChange={(e) => setSelectedStudentToEnroll(e.target.value)}
                style={{
                  flex: '1 1 240px',
                  padding: '9px 12px',
                  borderRadius: 8,
                  backgroundColor: '#161922',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f8fafc',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                <option value="">-- Select Student to Enroll ({availableStudents.length} available) --</option>
                {availableStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName || `${s.user?.firstName || ''} ${s.user?.lastName || ''}`} ({s.registrationNo || s.email})
                  </option>
                ))}
              </select>

              <select
                value={enrollStatus}
                onChange={(e) => setEnrollStatus(e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  backgroundColor: '#161922',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f8fafc',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>

              <button
                onClick={handleEnrollStudent}
                disabled={!selectedStudentToEnroll || isSubmittingEnroll}
                style={{
                  padding: '9px 18px',
                  borderRadius: 99,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: !selectedStudentToEnroll || isSubmittingEnroll ? 'not-allowed' : 'pointer',
                  opacity: !selectedStudentToEnroll || isSubmittingEnroll ? 0.6 : 1,
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                }}
              >
                {isSubmittingEnroll ? 'Enrolling...' : 'Confirm Enrollment'}
              </button>
            </div>
          </div>
        )}

        {/* Student Roster List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <div style={{ display: 'inline-block', width: 24, height: 24, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />
              <div>Fetching enrolled cohort roster...</div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '50px 20px',
                borderRadius: '12px',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <Users size={36} color="#64748b" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>No Students Found</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: 4 }}>
                {search || statusFilter !== 'ALL'
                  ? 'No enrolled students match the active search or status filter.'
                  : 'No learners have been enrolled into this batch yet.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredStudents.map((student) => {
                const fullName =
                  student.fullName ||
                  `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.trim() ||
                  student.name ||
                  'Learner';

                const enrolment = student.enrolments?.find((e) => e.batchId === batch?.id);
                const status = enrolment?.status || student.status || 'ACTIVE';
                const email = student.email || student.user?.email;
                const phone = student.phone || student.user?.phoneNumber;
                const registrationNo = student.registrationNo || student.admissionNumber;

                return (
                  <div
                    key={student.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <CandidateAvatar name={fullName} size={40} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                            {fullName}
                          </span>
                          {registrationNo && (
                            <span
                              style={{
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                color: '#94a3b8',
                                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                              }}
                            >
                              {registrationNo}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
                          {email && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#94a3b8' }}>
                              <Mail size={12} color="#64748b" />
                              {email}
                            </span>
                          )}
                          {phone && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#64748b' }}>
                              <Phone size={12} color="#64748b" />
                              {phone}
                            </span>
                          )}
                          {enrolment?.enrolledOn && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#64748b' }}>
                              <Calendar size={12} color="#64748b" />
                              Enrolled {enrolment.enrolledOn}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <select
                        value={status}
                        onChange={(e) => handleUpdateStatus(student, e.target.value)}
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor:
                            status === 'ACTIVE'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : status === 'COMPLETED'
                              ? 'rgba(168, 85, 247, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          color:
                            status === 'ACTIVE'
                              ? '#34d399'
                              : status === 'COMPLETED'
                              ? '#c084fc'
                              : '#f87171',
                          border: `1px solid ${
                            status === 'ACTIVE'
                              ? 'rgba(16, 185, 129, 0.3)'
                              : status === 'COMPLETED'
                              ? 'rgba(168, 85, 247, 0.3)'
                              : 'rgba(239, 68, 68, 0.3)'
                          }`,
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="ACTIVE" style={{ backgroundColor: '#161922', color: '#34d399' }}>ACTIVE</option>
                        <option value="COMPLETED" style={{ backgroundColor: '#161922', color: '#c084fc' }}>COMPLETED</option>
                        <option value="SUSPENDED" style={{ backgroundColor: '#161922', color: '#f87171' }}>SUSPENDED</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#13151c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            Showing {filteredStudents.length} of {students.length} enrolled candidates
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: 99,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
          >
            Close Roster
          </button>
        </div>
      </div>
    </div>
  );
};

export default CohortRosterModal;
