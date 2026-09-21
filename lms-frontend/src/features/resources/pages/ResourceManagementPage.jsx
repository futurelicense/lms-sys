import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FolderDown,
  Plus,
  Search,
  Download,
  Trash2,
  Edit2,
  FileText,
  FileArchive,
  BookOpen,
  CheckCircle2,
  Shield,
  UploadCloud,
  X,
  Layers,
  Sparkles,
  Users,
  Eye,
} from 'lucide-react';
import { useResources, useCreateResource, useUpdateResource, useDeleteResource } from '../hooks/useResources';
import resourceService from '../services/resourceService';
import useAuth from '../../auth/hooks/useAuth';
import Avatar from '../../../components/common/Avatar';
import { useToast } from '../../../components/feedback/Toast';

const CATEGORY_MAP = {
  ALL: { label: 'All Resources', color: '#38bdf8' },
  CHEATSHEET: { label: 'Cheatsheet', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
  ACADEMIC_GUIDE: { label: 'Academic Guide', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' },
  POLICY_EXAM: { label: 'Exam & Policy', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' },
  SOFTWARE_KIT: { label: 'Software Kit', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)' },
};

export const ResourceManagementPage = () => {
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();

  const isAdminRoute = location.pathname.startsWith('/admin');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  // Form states for Upload/Edit Modal
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'CHEATSHEET',
    targetAudience: 'ALL_STUDENTS',
    fileType: 'PDF',
    fileSize: '1.2 MB',
    content: '',
  });
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: resources = [], isLoading, refetch } = useResources({
    search,
    category: selectedCategory,
  });

  const createMutation = useCreateResource();
  const updateMutation = useUpdateResource();
  const deleteMutation = useDeleteResource();

  // Metrics
  const metrics = useMemo(() => {
    const total = resources.length;
    const cheatsheets = resources.filter((r) => r.category === 'CHEATSHEET').length;
    const policies = resources.filter((r) => r.category === 'POLICY_EXAM').length;
    const totalDownloads = resources.reduce((acc, curr) => acc + (curr.downloadsCount || 0), 0);
    return { total, cheatsheets, policies, totalDownloads };
  }, [resources]);

  const handleOpenCreate = () => {
    setEditingResource(null);
    setFormData({
      title: '',
      description: '',
      category: 'CHEATSHEET',
      targetAudience: 'ALL_STUDENTS',
      fileType: 'PDF',
      fileSize: '1.2 MB',
      content: '',
    });
    setUploadedFileName('');
    setSelectedFile(null);
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res) => {
    setEditingResource(res);
    setFormData({
      title: res.title,
      description: res.description,
      category: res.category,
      targetAudience: res.targetAudience || 'ALL_STUDENTS',
      fileType: res.fileType || 'PDF',
      fileSize: res.fileSize || '1.0 MB',
      content: res.content || '',
    });
    setUploadedFileName(`${res.title}.${res.fileType?.toLowerCase() || 'pdf'}`);
    setSelectedFile(null);
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toUpperCase();
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setSelectedFile(file);
    setUploadedFileName(file.name);
    setFormData((prev) => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
      fileType: ext === 'ZIP' ? 'ZIP' : ext === 'MD' ? 'MD' : 'PDF',
      fileSize: `${sizeMb} MB`,
    }));

    // Read content preview if text/md
    if (file.type.includes('text') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({ ...prev, content: event.target.result }));
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a title for the resource.');
      return;
    }

    try {
      if (editingResource) {
        await updateMutation.mutateAsync({
          id: editingResource.id,
          payload: { ...formData, file: selectedFile },
        });
        toast.success('Resource updated successfully!');
      } else {
        await createMutation.mutateAsync({
          ...formData,
          file: selectedFile,
          onProgress: (p) => setUploadProgress(p),
          author: user?.fullName || (isAdminRoute ? 'Platform Administrator' : 'Course Instructor'),
          authorRole: isAdminRoute ? 'Admin' : 'Instructor',
        });
        toast.success('Resource published to Campus Toolkit & R2!');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error('Failed to save resource.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource? Students will no longer be able to download it.')) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Resource deleted.');
      refetch();
    } catch (err) {
      toast.error('Failed to delete resource.');
    }
  };

  const handleDownload = (res) => {
    resourceService.downloadFile(res);
    toast.success(`Downloaded ${res.title}`);
    refetch();
  };

  return (
    <div
      style={{
        fontFamily: 'Inter, sans-serif',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        paddingBottom: 48,
      }}
    >
      {/* ── Page Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '3px 10px',
                borderRadius: 99,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
              }}
            >
              {isAdminRoute ? 'Administrative Control' : 'Instructor Portal'}
            </span>
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.5px',
            }}
          >
            {isAdminRoute ? 'Campus Toolkit & Resources' : 'Study Toolkits & Reference Guides'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
            {isAdminRoute
              ? 'Upload, publish, and govern institution-wide reference guides, exam policies, and student cheatsheets.'
              : 'Publish and manage supplementary learning kits, cheatsheets, and offline resources for your learners.'}
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={handleOpenCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Plus size={16} /> Upload New Guide
        </button>
      </div>

      {/* ── KPI Stats Ribbon ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <div
          style={{
            background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}
          >
            <FolderDown size={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 700 }}>TOTAL RESOURCES</p>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>{metrics.total}</h3>
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
            }}
          >
            <BookOpen size={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 700 }}>STUDENT CHEATSHEETS</p>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>{metrics.cheatsheets}</h3>
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
            }}
          >
            <Shield size={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 700 }}>EXAM & CAMPUS POLICIES</p>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>{metrics.policies}</h3>
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(168, 85, 247, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc',
            }}
          >
            <Download size={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 700 }}>TOTAL STUDENT DOWNLOADS</p>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>{metrics.totalDownloads}</h3>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          padding: '12px 18px',
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: selectedCategory === key ? '#2563eb' : 'transparent',
                color: selectedCategory === key ? '#fff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, color: '#64748b' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guides & toolkits..."
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              padding: '7px 12px 7px 34px',
              fontSize: 12,
              color: '#fff',
              outline: 'none',
              width: 220,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: 8,
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: 2,
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Resource Cards Grid ── */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 220,
                background: '#161922',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.06)',
                animation: 'pulse 1.4s infinite',
              }}
            />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '70px 20px',
            background: '#161922',
            borderRadius: 16,
            border: '1px dashed rgba(255, 255, 255, 0.12)',
          }}
        >
          <FolderDown size={40} style={{ color: '#64748b', margin: '0 auto 14px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#fff' }}>No resources found</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#94a3b8' }}>
            Upload reference guides or cheatsheets to make them available for students.
          </p>
          <button
            onClick={handleOpenCreate}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Upload Resource
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 20,
          }}
        >
          {resources.map((res) => {
            const cat = CATEGORY_MAP[res.category] || CATEGORY_MAP.CHEATSHEET;
            return (
              <div
                key={res.id}
                style={{
                  background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <div>
                  {/* Top Bar: Category & File Format */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span
                      style={{
                        padding: '3px 9px',
                        borderRadius: 99,
                        fontSize: 10,
                        fontWeight: 700,
                        background: cat.bg,
                        color: cat.color,
                        border: `1px solid ${cat.border}`,
                      }}
                    >
                      {cat.label}
                    </span>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#94a3b8',
                        background: 'rgba(255, 255, 255, 0.06)',
                        padding: '2px 8px',
                        borderRadius: 6,
                      }}
                    >
                      {res.fileType} • {res.fileSize}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                    {res.title}
                  </h3>
                  <p
                    style={{
                      margin: '0 0 16px',
                      fontSize: 13,
                      color: '#94a3b8',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {res.description}
                  </p>
                </div>

                {/* Footer Section */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={res.author || 'Admin'} size="xs" />
                      <div>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#fff' }}>{res.author}</p>
                        <p style={{ margin: 0, fontSize: 10, color: '#64748b' }}>{res.authorRole || 'Author'}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Download size={12} /> {res.downloadsCount || 0} downloads
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleDownload(res)}
                      title="Test download"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Download size={13} /> Download
                    </button>

                    <button
                      onClick={() => handleOpenEdit(res)}
                      title="Edit metadata"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      onClick={() => handleDelete(res.id)}
                      title="Delete resource"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Upload / Edit Modal ── */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              background: '#161922',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 20,
              width: '100%',
              maxWidth: 540,
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>
                  {editingResource ? 'Edit Resource' : 'Upload Resource to Campus Toolkit'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
                  Files uploaded here become immediately available for student downloads.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. React 19 Architecture Patterns"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 13,
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Category & Audience */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#1e2230',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      fontSize: 13,
                      color: '#fff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="CHEATSHEET">Cheatsheet</option>
                    <option value="ACADEMIC_GUIDE">Academic Guide</option>
                    <option value="POLICY_EXAM">Exam & Policy</option>
                    <option value="SOFTWARE_KIT">Software Kit</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                    Target Audience
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#1e2230',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      fontSize: 13,
                      color: '#fff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="ALL_STUDENTS">Campus-Wide (All Students)</option>
                    <option value="ENROLLED_ONLY">Enrolled Students Only</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                  Description / Topic Summary *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide a concise summary of what topics or tools this guide covers..."
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 13,
                    color: '#fff',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* File Attachment Picker */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                  Upload Document or Toolkit File (.pdf, .zip, .docx, .md)
                </label>
                <div
                  style={{
                    border: '2px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: 12,
                    padding: '20px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf,.zip,.docx,.doc,.md,.txt"
                    onChange={handleFileChange}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%',
                    }}
                  />
                  <UploadCloud size={28} style={{ color: '#38bdf8', margin: '0 auto 8px' }} />
                  <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    {uploadedFileName ? uploadedFileName : 'Click or drag a file to upload'}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                    {uploadedFileName
                      ? `Detected ${formData.fileType} (${formData.fileSize})`
                      : 'PDF, ZIP, DOCX, or Markdown up to 50 MB'}
                  </p>
                </div>
              </div>

              {/* Upload Progress Indicator */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ marginTop: 4, padding: '10px 14px', background: 'rgba(37, 99, 235, 0.08)', borderRadius: 10, border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#38bdf8', marginBottom: 6 }}>
                    <span>Uploading directly to Cloudflare R2...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${uploadProgress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #38bdf8 0%, #2563eb 100%)',
                        transition: 'width 0.2s ease',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Footer CTA */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 12,
                  marginTop: 10,
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: 16,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={{
                    padding: '9px 22px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                  }}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Publishing...'
                    : editingResource
                    ? 'Save Changes'
                    : 'Publish Guide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceManagementPage;
