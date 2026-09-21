import { useState } from 'react';
import { Copy, Check, Shield, Calendar, Key, Search, Sparkles, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '../../../components/common/Card';

export const AccountDetailsTab = ({ user }) => {
  const [copiedId, setCopiedId] = useState(false);
  const [permissionQuery, setPermissionQuery] = useState('');

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const userRoles = user?.roles || [];
  const userPermissions = user?.permissions || [];

  const filteredPermissions = userPermissions.filter((p) =>
    p.toLowerCase().includes(permissionQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Overview Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        {/* User ID Card with Copy */}
        <motion.div
          whileHover={{ y: -2 }}
          style={{
            padding: 20,
            borderRadius: 14,
            background: 'var(--surface-medium, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              System User ID
            </span>
            <Key size={16} style={{ color: 'var(--primary, #6366f1)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
              {user.id || 'N/A'}
            </span>
            {user.id && (
              <button
                type="button"
                onClick={() => copyToClipboard(user.id)}
                title="Copy User ID"
                style={{
                  background: copiedId ? 'rgba(34, 197, 94, 0.15)' : 'var(--surface-dark, #0f172a)',
                  color: copiedId ? '#22c55e' : 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
              >
                {copiedId ? <Check size={14} /> : <Copy size={14} />}
                {copiedId ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
        </motion.div>

        {/* Roles Card */}
        <motion.div
          whileHover={{ y: -2 }}
          style={{
            padding: 20,
            borderRadius: 14,
            background: 'var(--surface-medium, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Assigned Roles
            </span>
            <Shield size={16} style={{ color: '#a855f7' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {userRoles.length === 0 ? (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No assigned roles</span>
            ) : (
              userRoles.map((role) => (
                <span
                  key={typeof role === 'string' ? role : role.name}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    color: '#c084fc',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <UserCheck size={13} />
                  {typeof role === 'string' ? role : role.name}
                </span>
              ))
            )}
          </div>
        </motion.div>

        {/* Member Since Card */}
        <motion.div
          whileHover={{ y: -2 }}
          style={{
            padding: 20,
            borderRadius: 14,
            background: 'var(--surface-medium, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Member Since
            </span>
            <Calendar size={16} style={{ color: '#10b981' }} />
          </div>
          <p style={{ margin: '10px 0 0', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
            {user.createdAt
              ? new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Active Platform Member'}
          </p>
        </motion.div>
      </div>

      {/* Searchable Permissions Explorer */}
      {userPermissions.length > 0 && (
        <Card
          title={`Granted Permissions (${userPermissions.length})`}
          subtitle="Real-time list of security authorities granted to your user session."
        >
          <div style={{ marginBottom: 16, position: 'relative', maxWidth: 360 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search permissions (e.g., COURSE_READ)..."
              value={permissionQuery}
              onChange={(e) => setPermissionQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 8,
                background: 'var(--surface-dark, #0f172a)',
                border: '1px solid var(--border-color, #334155)',
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
            {filteredPermissions.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No matching permissions found.</p>
            ) : (
              filteredPermissions.map((perm) => (
                <span
                  key={perm}
                  style={{
                    fontSize: 11,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: 'var(--surface-dark, #0f172a)',
                    border: '1px solid var(--border-color, #334155)',
                    color: 'var(--text-secondary, #cbd5e1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Sparkles size={11} style={{ color: 'var(--primary, #6366f1)' }} />
                  {perm}
                </span>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AccountDetailsTab;
