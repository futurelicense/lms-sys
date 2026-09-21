import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck, ArrowLeft, KeyRound, Edit, Trash2,
  Calendar, CheckCircle, Search, Filter, ShieldAlert,
  Users, Check, X, Copy, ChevronRight
} from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import Spinner from '../../../components/common/Spinner';
import Alert from '../../../components/feedback/Alert';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import { AdminModal, AdminConfirmModal } from '../../../components/ui/AdminModal';
import { useToast } from '../../../components/feedback/Toast';
import roleService from '../services/roleService';
import { ROUTES } from '../../../constants/routes';
import { PERMISSIONS } from '../../../constants/permissions';
import usePermission from '../../../hooks/usePermission';

const SYSTEM_ROLES = ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'STUDENT'];

export const RoleDetailsPage = () => {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { hasPermission } = usePermission();
  const canManageRoles = hasPermission(PERMISSIONS.ROLES_MANAGE);

  const [permSearch, setPermSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['role', roleId],
    queryFn: () => roleService.getById(roleId),
    enabled: Boolean(roleId),
  });

  const role = rawData?.data?.data ?? rawData?.data ?? rawData;
  const isSystemRole = role && SYSTEM_ROLES.includes(role.name?.toUpperCase());

  // Group permissions by category based on prefix or authority
  const permissions = role?.permissions || [];
  
  const categorizedPerms = permissions.reduce((acc, p) => {
    let cat = 'Other';
    const auth = (p.authority || p.name || '').toUpperCase();
    if (auth.startsWith('USER_') || auth.startsWith('ROLE') || auth.startsWith('PERMISSION') || auth.startsWith('INVITATION')) {
      cat = 'People & Access';
    } else if (auth.startsWith('COURSE_') || auth.startsWith('BATCH_') || auth.startsWith('STUDENT_') || auth.startsWith('INSTRUCTOR_') || auth.startsWith('ENROLLMENT')) {
      cat = 'Learning & Courses';
    } else if (auth.startsWith('ASSESSMENT_')) {
      cat = 'Assessments & Grading';
    } else if (auth.startsWith('AUDIT_') || auth.startsWith('ANALYTICS') || auth.startsWith('TENANT') || auth.startsWith('SUBSCRIPTION')) {
      cat = 'System & Operations';
    }
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const categories = ['ALL', ...Object.keys(categorizedPerms)];

  const filteredPerms = permissions.filter((p) => {
    const text = `${p.name || ''} ${p.authority || ''} ${p.description || ''}`.toLowerCase();
    const matchSearch = text.includes(permSearch.toLowerCase());
    if (!matchSearch) return false;
    if (selectedCategory === 'ALL') return true;

    const auth = (p.authority || p.name || '').toUpperCase();
    if (selectedCategory === 'People & Access') {
      return auth.startsWith('USER_') || auth.startsWith('ROLE') || auth.startsWith('PERMISSION') || auth.startsWith('INVITATION');
    }
    if (selectedCategory === 'Learning & Courses') {
      return auth.startsWith('COURSE_') || auth.startsWith('BATCH_') || auth.startsWith('STUDENT_') || auth.startsWith('INSTRUCTOR_') || auth.startsWith('ENROLLMENT');
    }
    if (selectedCategory === 'Assessments & Grading') {
      return auth.startsWith('ASSESSMENT_');
    }
    if (selectedCategory === 'System & Operations') {
      return auth.startsWith('AUDIT_') || auth.startsWith('ANALYTICS') || auth.startsWith('TENANT') || auth.startsWith('SUBSCRIPTION');
    }
    return true;
  });

  const handleDelete = async () => {
    if (isSystemRole) {
      toast.error('System roles cannot be deleted.');
      return;
    }
    setIsDeleting(true);
    try {
      await roleService.delete(roleId);
      toast.success('Role deleted successfully.');
      navigate(ROUTES.ROLES);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete role.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (isLoading) return <Spinner fullPage />;
  if (error) return (
    <PageContainer title="Role Details">
      <Alert tone="error">{error?.response?.data?.message || 'Failed to load role details.'}</Alert>
      <Button variant="secondary" onClick={() => navigate(ROUTES.ROLES)} style={{ marginTop: 16 }}>
        Back to Roles
      </Button>
    </PageContainer>
  );

  return (
    <PageContainer
      title="Role Details"
      subtitle="View detailed permissions and settings for this security role."
      actions={
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Button
            variant="secondary"
            onClick={() => navigate(ROUTES.ROLES)}
            iconLeft={<ArrowLeft size={15} />}
          >
            All Roles
          </Button>
          {!isSystemRole && canManageRoles && (
            <Button
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
              iconLeft={<Trash2 size={15} />}
            >
              Delete Role
            </Button>
          )}
        </div>
      }
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link to={ROUTES.ROLES} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Roles & Permissions
          </Link>
          <ChevronRight size={13} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{role?.name}</span>
        </div>

        {/* Role Overview Card */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 20,
          boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: isSystemRole ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
              color: isSystemRole ? '#6366f1' : '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {role?.name}
                </h1>
                <Badge tone={isSystemRole ? 'primary' : 'success'}>
                  {isSystemRole ? 'System Default' : 'Custom Role'}
                </Badge>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-muted)', maxWidth: 650 }}>
                {role?.description || 'No description provided for this role.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{
              background: 'var(--surface-medium)',
              padding: '10px 18px',
              borderRadius: 10,
              border: '1px solid var(--border-color)',
              minWidth: 120,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                Permissions
              </span>
              <p style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800, color: '#6366f1' }}>
                {permissions.length}
              </p>
            </div>

            <div style={{
              background: 'var(--surface-medium)',
              padding: '10px 18px',
              borderRadius: 10,
              border: '1px solid var(--border-color)',
              minWidth: 120,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                Access Level
              </span>
              <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                {isSystemRole ? 'Built-in' : 'Configurable'}
              </p>
            </div>
          </div>
        </div>

        {/* Permissions Section */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 20,
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <KeyRound size={18} style={{ color: '#6366f1' }} />
                Granted Permissions ({permissions.length})
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                Authorities granted to users assigned with this role.
              </p>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: 280 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search permissions…"
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-medium)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? '#6366f1' : 'var(--border-color)',
                  background: selectedCategory === cat ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: selectedCategory === cat ? '#6366f1' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat} {cat !== 'ALL' && categorizedPerms[cat] ? `(${categorizedPerms[cat].length})` : `(${permissions.length})`}
              </button>
            ))}
          </div>

          {/* Permissions Grid */}
          {filteredPerms.length === 0 ? (
            <div style={{
              padding: '36px 16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
              border: '1px dashed var(--border-color)',
              borderRadius: 12,
            }}>
              No permissions found matching &quot;{permSearch}&quot;
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 12,
            }}>
              {filteredPerms.map((perm) => (
                <div
                  key={perm.id || perm.authority || perm.name}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: 'var(--surface-medium)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {perm.authority || perm.name}
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#10b981',
                      background: 'rgba(16,185,129,0.1)',
                      padding: '2px 8px',
                      borderRadius: 12,
                    }}>
                      <Check size={12} /> Active
                    </span>
                  </div>
                  {perm.description && (
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {perm.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AdminConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${role?.name}"? Users currently assigned this role will lose its permissions.`}
        confirmText="Delete Role"
        confirmTone="danger"
        isLoading={isDeleting}
      />
    </PageContainer>
  );
};

export default RoleDetailsPage;
