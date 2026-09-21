/**
 * Resource Service for Campus Toolkits & Study Guides.
 * Integrates with Cloudflare R2 object storage and backend REST persistence,
 * with graceful localStorage fallback for offline development and testing.
 */

import axios from 'axios';
import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

const STORAGE_KEY = 'lms_campus_resources_store';

const SEED_RESOURCES = [
  {
    id: 'a0000001-0000-0000-0000-000000000001',
    title: 'React 19 Hooks & Architecture Patterns',
    description: 'Master compiler optimizations, Server Actions, useActionState, and clean state architecture.',
    category: 'CHEATSHEET',
    fileKey: 'resources/cheatsheets/React_19_Hooks_Architecture.pdf',
    fileName: 'React_19_Hooks_Architecture.pdf',
    fileType: 'PDF',
    fileSize: '1.4 MB',
    fileSizeBytes: 1468006,
    author: 'Platform Administrator',
    authorName: 'Platform Administrator',
    authorRole: 'Admin',
    targetAudience: 'ALL_STUDENTS',
    status: 'PUBLISHED',
    downloadsCount: 142,
    createdAt: '2026-09-01T10:00:00Z',
    content: `# React 19 Hooks & Architecture Patterns
## Modern React Architecture Cheatsheet

### 1. The React Compiler
- Automatic memoization without manual useMemo / useCallback
- Compiler preserves referential identity when dependencies are pure

### 2. Actions & Form State
- \`useActionState(asyncAction, initialState)\` handles async transitions, loading states, and error handling seamlessly.
- \`useOptimistic\` provides instant UI feedback before network resolution.

### 3. Server Components vs Client Components
- Default to Server Components for data fetching and bundle size reduction.
- Add \`'use client'\` only at leaf interactivity boundaries.`,
  },
  {
    id: 'a0000001-0000-0000-0000-000000000002',
    title: 'Java Collections & Big-O Guide',
    description: 'Deep dive into HashMap vs TreeMap, amortized complexity, and high-performance collection algorithms.',
    category: 'ACADEMIC_GUIDE',
    fileKey: 'resources/guides/Java_Collections_Big_O.pdf',
    fileName: 'Java_Collections_Big_O.pdf',
    fileType: 'PDF',
    fileSize: '2.1 MB',
    fileSizeBytes: 2202009,
    author: 'Lead Instructor',
    authorName: 'Lead Instructor',
    authorRole: 'Instructor',
    targetAudience: 'ALL_STUDENTS',
    status: 'PUBLISHED',
    downloadsCount: 98,
    createdAt: '2026-09-03T12:30:00Z',
    content: `# Java Collections & Big-O Reference Guide
## Data Structures & Complexity Overview

### 1. HashMap & HashSet
- Average lookup/insert: O(1)
- Worst-case lookup: O(log N) (with Java 8+ TreeNode red-black trees)
- Capacity & Load Factor: default 16 with 0.75 threshold.

### 2. Concurrent Collections
- Prefer ConcurrentHashMap over Collections.synchronizedMap
- Striped lock implementation minimizes contention on concurrent writes.`,
  },
  {
    id: 'a0000001-0000-0000-0000-000000000003',
    title: 'SQL Performance & Indexing Guide',
    description: 'B-Tree indexes, composite keys, partition pruning, and EXPLAIN ANALYZE tuning techniques.',
    category: 'CHEATSHEET',
    fileKey: 'resources/cheatsheets/SQL_Performance_Indexing.pdf',
    fileName: 'SQL_Performance_Indexing.pdf',
    fileType: 'PDF',
    fileSize: '1.8 MB',
    fileSizeBytes: 1887436,
    author: 'Platform Administrator',
    authorName: 'Platform Administrator',
    authorRole: 'Admin',
    targetAudience: 'ALL_STUDENTS',
    status: 'PUBLISHED',
    downloadsCount: 115,
    createdAt: '2026-09-05T14:15:00Z',
    content: `# SQL Performance & Indexing Guide
## High-Performance Database Query Tuning

### 1. B-Tree Indexes
- Indexes speed up exact matches and prefix searches.
- Avoid function wrapping on indexed columns (e.g. \`WHERE UPPER(email) = ...\` bypasses index without expression index).

### 2. Composite Indexes
- Order matters! Follow the Equality, Range, Sort rule.
- Place columns with high selectivity and exact filters first.`,
  },
  {
    id: 'a0000001-0000-0000-0000-000000000004',
    title: 'Campus Exam & Proctoring Guidelines',
    description: 'Official academic integrity handbook, lockdown browser instructions, and proctoring requirements.',
    category: 'POLICY_EXAM',
    fileKey: 'resources/policies/Campus_Exam_Policy_Handbook.pdf',
    fileName: 'Campus_Exam_Policy_Handbook.pdf',
    fileType: 'PDF',
    fileSize: '850 KB',
    fileSizeBytes: 870400,
    author: 'Dean of Academic Operations',
    authorName: 'Dean of Academic Operations',
    authorRole: 'Admin',
    targetAudience: 'ALL_STUDENTS',
    status: 'PUBLISHED',
    downloadsCount: 310,
    createdAt: '2026-08-28T09:00:00Z',
    content: `# Campus Exam & Proctoring Guidelines
## Official Academic Integrity Handbook

### 1. Proctored Assessment Regulations
- Webcams must remain unobstructed during proctored examinations.
- Full-screen lockdown mode will flag tab switches, multiple displays, and window minimize events.

### 2. Submission Deadlines
- Timed assessments will auto-submit when the countdown expires.
- Contact course instructor immediately via LMS messages in case of power or connectivity disruptions.`,
  },
  {
    id: 'a0000001-0000-0000-0000-000000000005',
    title: 'Git & GitHub Collaboration Workflow',
    description: 'Branching models, atomic commits, pull request review etiquette, and merge conflict resolution.',
    category: 'SOFTWARE_KIT',
    fileKey: 'resources/software/Git_GitHub_Collaboration_Kit.zip',
    fileName: 'Git_GitHub_Collaboration_Kit.zip',
    fileType: 'ZIP',
    fileSize: '3.2 MB',
    fileSizeBytes: 3355443,
    author: 'Senior Faculty Mentor',
    authorName: 'Senior Faculty Mentor',
    authorRole: 'Instructor',
    targetAudience: 'ALL_STUDENTS',
    status: 'PUBLISHED',
    downloadsCount: 84,
    createdAt: '2026-09-08T16:45:00Z',
    content: `# Git Collaboration Toolkit
## Standard Team Workflow

1. Always branch from main: \`git checkout -b feature/module-name\`
2. Keep commits atomic and informative.
3. Rebase onto main prior to PR submission.
4. Require at least one peer approval before merging.`,
  },
];

function getStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_RESOURCES));
      return SEED_RESOURCES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_RESOURCES;
  } catch {
    return SEED_RESOURCES;
  }
}

function saveStored(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to persist resources in localStorage', err);
  }
}

function formatBytes(bytes) {
  if (!bytes) return '1.0 MB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeResource(item) {
  if (!item) return item;
  return {
    ...item,
    author: item.authorName || item.author || 'Academic Faculty',
    authorRole: item.authorRole || 'Admin',
    fileName: item.fileName || `${item.title}.${item.fileType?.toLowerCase() || 'pdf'}`,
    fileType: (item.fileType || 'PDF').toUpperCase(),
    downloadsCount: item.downloadsCount || 0,
  };
}

export const resourceService = {
  /**
   * Request presigned Cloudflare R2 PUT URL from the backend.
   */
  getUploadUrl: async ({ fileName, contentType, category, fileSizeBytes }) => {
    return await http.post(API_ENDPOINTS.resources.uploadUrl, {
      fileName,
      contentType: contentType || 'application/octet-stream',
      category: category || 'CHEATSHEET',
      fileSizeBytes,
    });
  },

  /**
   * Uploads a raw binary File to Cloudflare R2 object store.
   * Prioritizes direct backend multipart upload to bypass browser CORS limitations on R2,
   * with automatic fallback to presigned direct PUT.
   */
  uploadFileToR2: async (file, category, onProgress) => {
    if (!file) throw new Error('File is required for upload');

    // 1. Primary path: Direct multipart upload via backend proxy (immune to browser CORS)
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (category) formData.append('category', category);

      const res = await http.post(API_ENDPOINTS.resources.uploadDirect, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      });

      if (res?.fileKey) {
        return {
          fileKey: res.fileKey,
          uploadUrl: res.uploadUrl,
          publicUrl: res.publicUrl,
          fileName: file.name,
          fileSize: formatBytes(file.size),
          fileSizeBytes: file.size,
          fileType: file.name.split('.').pop()?.toUpperCase() || 'PDF',
        };
      }
    } catch (backendUploadErr) {
      console.warn('Backend direct multipart upload failed, attempting presigned PUT:', backendUploadErr?.message);
    }

    // 2. Fallback path: Presigned direct PUT to Cloudflare R2
    const urlData = await resourceService.getUploadUrl({
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      category: category || 'CHEATSHEET',
      fileSizeBytes: file.size,
    });

    const uploadUrl = urlData?.uploadUrl;
    const fileKey = urlData?.fileKey;

    if (!uploadUrl || !fileKey) {
      throw new Error('Could not obtain Cloudflare R2 upload credentials');
    }

    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return {
      fileKey,
      uploadUrl,
      publicUrl: urlData?.publicUrl,
      fileName: file.name,
      fileSize: formatBytes(file.size),
      fileSizeBytes: file.size,
      fileType: file.name.split('.').pop()?.toUpperCase() || 'PDF',
    };
  },

  /** List all resources with optional filters */
  list: async (filters = {}) => {
    try {
      const params = {};
      if (filters.category && filters.category !== 'ALL') params.category = filters.category;
      if (filters.status && filters.status !== 'ALL') params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const backendItems = await http.get(API_ENDPOINTS.resources.base, { params });
      if (Array.isArray(backendItems)) {
        const normalized = backendItems.map(normalizeResource);
        // Preserve any offline/unsynced locally created items
        const local = getStored();
        const backendIds = new Set(normalized.map((b) => b.id));
        const unsynced = local.filter((l) => !backendIds.has(l.id) && l.id?.startsWith('res-'));
        const combined = [...unsynced, ...normalized].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        saveStored(combined);
        return combined;
      }
    } catch (err) {
      console.warn('Backend resources unavailable, serving from local cache:', err?.message);
    }

    // Fallback to local storage store
    let items = getStored();
    if (filters.category && filters.category !== 'ALL') {
      items = items.filter((r) => r.category === filters.category);
    }
    if (filters.status && filters.status !== 'ALL') {
      items = items.filter((r) => r.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          (r.author || r.authorName)?.toLowerCase().includes(q)
      );
    }
    return items.map(normalizeResource);
  },

  /** Get resource by ID */
  getById: async (id) => {
    try {
      const data = await http.get(API_ENDPOINTS.resources.byId(id));
      if (data) return normalizeResource(data);
    } catch (err) {
      console.warn('Backend getById fallback to local:', err?.message);
    }

    const items = getStored();
    const found = items.find((r) => r.id === id);
    if (!found) throw new Error('Resource not found');
    return normalizeResource(found);
  },

  /** Create a new resource with optional R2 file upload */
  create: async (payload) => {
    let fileKey = payload.fileKey;
    let fileName = payload.fileName || `${payload.title}.${payload.fileType?.toLowerCase() || 'pdf'}`;
    let fileSize = payload.fileSize || '1.2 MB';
    let fileSizeBytes = payload.fileSizeBytes;
    let fileType = payload.fileType || 'PDF';

    // If a physical file was provided, upload to Cloudflare R2 first
    if (payload.file && typeof payload.file === 'object' && payload.file.name) {
      try {
        const uploadResult = await resourceService.uploadFileToR2(payload.file, payload.category, payload.onProgress);
        fileKey = uploadResult.fileKey;
        fileName = uploadResult.fileName;
        fileSize = uploadResult.fileSize;
        fileSizeBytes = uploadResult.fileSizeBytes;
        fileType = uploadResult.fileType;
      } catch (uploadErr) {
        console.warn('Cloudflare R2 upload fallback to local key:', uploadErr?.message);
        const catFolder = (payload.category || 'guides').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        fileKey = `resources/${catFolder}/${Date.now()}_${payload.file.name}`;
        fileName = payload.file.name;
        fileSize = formatBytes(payload.file.size);
        fileSizeBytes = payload.file.size;
        fileType = payload.file.name.split('.').pop()?.toUpperCase() || 'PDF';
      }
    }

    if (!fileKey) {
      const catFolder = (payload.category || 'guides').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      fileKey = `resources/${catFolder}/${Date.now()}_${encodeURIComponent(payload.title.replace(/\s+/g, '_'))}.${fileType.toLowerCase()}`;
    }

    const backendPayload = {
      title: payload.title,
      description: payload.description || '',
      category: payload.category || 'CHEATSHEET',
      fileKey,
      fileName,
      fileType,
      fileSize,
      fileSizeBytes,
      targetAudience: payload.targetAudience || 'ALL_STUDENTS',
      status: payload.status || 'PUBLISHED',
    };

    try {
      const created = await http.post(API_ENDPOINTS.resources.base, backendPayload);
      if (created) {
        const normalized = normalizeResource(created);
        const items = getStored();
        saveStored([normalized, ...items]);
        return normalized;
      }
    } catch (err) {
      console.warn('Backend resource creation failed, creating locally:', err?.message);
    }

    // Local fallback
    const items = getStored();
    const newResource = {
      id: `res-${Date.now()}`,
      ...backendPayload,
      author: payload.author || 'Platform Administrator',
      authorRole: payload.authorRole || 'Admin',
      downloadsCount: 0,
      createdAt: new Date().toISOString(),
      content: payload.content || `# ${payload.title}\n\n${payload.description || ''}`,
    };

    const updated = [newResource, ...items];
    saveStored(updated);
    return normalizeResource(newResource);
  },

  /** Update an existing resource */
  update: async (id, payload) => {
    try {
      const updated = await http.patch(API_ENDPOINTS.resources.byId(id), payload);
      if (updated) {
        const normalized = normalizeResource(updated);
        const items = getStored();
        const idx = items.findIndex((r) => r.id === id);
        if (idx !== -1) {
          items[idx] = normalized;
          saveStored([...items]);
        }
        return normalized;
      }
    } catch (err) {
      console.warn('Backend update failed, updating locally:', err?.message);
    }

    const items = getStored();
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Resource not found');

    const updatedResource = { ...items[idx], ...payload, updatedAt: new Date().toISOString() };
    items[idx] = updatedResource;
    saveStored([...items]);
    return normalizeResource(updatedResource);
  },

  /** Delete a resource from DB and R2 */
  remove: async (id) => {
    try {
      await http.delete(API_ENDPOINTS.resources.byId(id));
    } catch (err) {
      console.warn('Backend delete error, removing locally:', err?.message);
    }

    const items = getStored();
    const filtered = items.filter((r) => r.id !== id);
    saveStored(filtered);
    return { success: true, id };
  },

  /**
   * Trigger real browser download:
   * 1. First attempts authenticated direct stream download from backend (/stream).
   *    This guarantees zero CORS errors, correct Content-Disposition headers, and avoids blank tabs.
   * 2. Falls back to presigned R2 GET URL.
   * 3. Falls back to local generated blob for offline/mock data.
   */
  downloadFile: async (resource) => {
    // 1. Direct authenticated stream download from backend
    if (resource?.id && !resource.id.startsWith('res-')) {
      try {
        const blobData = await http.get(API_ENDPOINTS.resources.stream(resource.id), {
          responseType: 'blob',
        });

        if (blobData) {
          const blob = new Blob([blobData]);
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = resource.fileName || `${resource.title}.${resource.fileType?.toLowerCase() || 'pdf'}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);

          // Increment download count locally
          const items = getStored();
          const idx = items.findIndex((r) => r.id === resource.id);
          if (idx !== -1) {
            items[idx].downloadsCount = (items[idx].downloadsCount || 0) + 1;
            saveStored([...items]);
          }

          // Trigger download record on backend asynchronously
          http.get(API_ENDPOINTS.resources.download(resource.id)).catch(() => {});
          return true;
        }
      } catch (streamErr) {
        console.warn('Backend stream download failed, attempting presigned download URL:', streamErr?.message);
      }
    }

    // 2. Presigned Cloudflare R2 download URL
    try {
      const res = await http.get(API_ENDPOINTS.resources.download(resource.id));
      const downloadUrl = res?.downloadUrl || resource.downloadUrl;

      if (downloadUrl && downloadUrl.startsWith('http')) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = res?.fileName || resource.fileName || `${resource.title}.${resource.fileType?.toLowerCase() || 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        const items = getStored();
        const idx = items.findIndex((r) => r.id === resource.id);
        if (idx !== -1) {
          items[idx].downloadsCount = (items[idx].downloadsCount || 0) + 1;
          saveStored([...items]);
        }
        return true;
      }
    } catch (err) {
      console.warn('Backend download URL request fallback to local Blob:', err?.message);
    }

    // 3. Resilient fallback: Generate local download blob
    try {
      const items = getStored();
      const idx = items.findIndex((r) => r.id === resource.id);
      if (idx !== -1) {
        items[idx].downloadsCount = (items[idx].downloadsCount || 0) + 1;
        saveStored([...items]);
      }

      const content = resource.content || `# ${resource.title}\n\n${resource.description || 'Study Guide & Toolkit Asset.'}`;
      const ext = resource.fileType === 'ZIP' ? 'zip' : resource.fileType === 'MD' ? 'md' : resource.fileType === 'DOCX' ? 'docx' : 'pdf';
      const filename = `${resource.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;

      const blob = new Blob([content], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.error('Download failed entirely', err);
      return false;
    }
  },
};

export default resourceService;
