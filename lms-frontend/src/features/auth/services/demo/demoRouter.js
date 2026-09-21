import { getDemoStore, paginate, resetDemoStore } from './demoStore';
import { readDemoSession } from '../demoSession';

const parseBody = (config) => {
  if (config.data == null || config.data === '') return {};
  if (typeof config.data === 'string') {
    try {
      return JSON.parse(config.data);
    } catch {
      return {};
    }
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    return Object.fromEntries(config.data.entries());
  }
  return config.data;
};

const pathOf = (config) => {
  let url = config.url || '';
  if (url.startsWith('http')) {
    try {
      url = new URL(url).pathname + new URL(config.url).search;
    } catch {
      // keep as-is
    }
  }
  const [pathname, query = ''] = url.split('?');
  let path = pathname
    .replace(/^\/api\/v1\/notifications\/?/, '/')
    .replace(/^\/api\/v1\/chat\/?/, '/')
    .replace(/^\/api\/v1/, '')
    .replace(/\/+$/, '') || '/';

  // Notification client uses baseURL ending in /notifications and relative '/'
  if (config.baseURL?.includes('/notifications') && (path === '/' || path === '')) {
    path = '/notifications';
  }
  if (config.baseURL?.includes('/chat') && path.startsWith('/')) {
    // chat paths already relative like /channels
  }

  const params = { ...(config.params || {}) };
  if (query) {
    new URLSearchParams(query).forEach((value, key) => {
      if (params[key] === undefined) params[key] = value;
    });
  }

  return { path, method: (config.method || 'get').toLowerCase(), params, body: parseBody(config) };
};

const findById = (list, id) => list.find((item) => String(item.id) === String(id));

const notFound = (label = 'Resource') => {
  const error = new Error(`${label} not found`);
  error.status = 404;
  throw error;
};

/** Main LMS + shared handlers */
export const handleDemoRequest = (config) => {
  const store = getDemoStore();
  const { path, method, params, body } = pathOf(config);

  // ── Auth ──────────────────────────────────────────────────────────────
  if (path === '/auth/me' && method === 'get') {
    const demo = readDemoSession();
    const user = demo?.user ?? store.users[0];
    return {
      user: { id: user.id, name: user.name ?? user.fullName, email: user.email },
      roles: user.roles ?? [],
      permissions: user.permissions ?? [],
    };
  }
  if (path === '/auth/logout' || path === '/auth/logout-all') return null;
  if (path === '/auth/sessions' && method === 'get') {
    return {
      content: [
        {
          id: 'sess-demo',
          device: 'Demo Browser',
          ipAddress: '127.0.0.1',
          lastActiveAt: store.now(),
          current: true,
        },
      ],
    };
  }

  // ── Analytics ─────────────────────────────────────────────────────────
  if (path === '/analytics/admin' && method === 'get') {
    return {
      activeLearners: store.students.filter((s) => s.enrolmentStatus === 'ACTIVE').length,
      totalCourses: store.courses.length,
      publishedCourses: store.courses.filter((c) => c.status === 'PUBLISHED').length,
      totalEnrollments: store.enrollments.length,
      totalMembers: store.users.length,
      instructorCount: store.instructors.length,
      assessmentCount: store.assessments.length,
      publishedAssessments: store.assessments.filter((a) => a.status === 'PUBLISHED').length,
      pendingInvitations: store.invitations.filter((i) => i.status === 'PENDING').length,
      completionRate: 68,
      actionQueue: [
        { id: 'aq-1', type: 'invitations', label: 'Pending invitations', count: 1 },
        { id: 'aq-2', type: 'courses', label: 'Draft courses', count: store.courses.filter((c) => c.status === 'DRAFT').length },
        { id: 'aq-3', type: 'assessments', label: 'Draft assessments', count: store.assessments.filter((a) => a.status === 'DRAFT').length },
      ],
      topCourses: store.courses
        .filter((c) => c.status === 'PUBLISHED')
        .slice(0, 3)
        .map((c) => ({ id: c.id, title: c.title, enrollments: c.enrollmentCount, completionRate: 72 })),
      atRiskCourses: [
        { id: 'course-java', title: 'Java & Algorithms', completionRate: 28, atRiskLearners: 8 },
      ],
    };
  }

  if (path === '/analytics/instructor' && method === 'get') {
    return {
      activeStudents: 40,
      coursesTeaching: store.courses.length,
      averageCompletion: 64,
      upcomingAssessments: 2,
      recentActivity: [
        { id: 1, text: 'Ada Lovelace completed React Foundations', at: store.now() },
        { id: 2, text: 'Alan Turing started Java Collections Exam', at: store.now() },
      ],
    };
  }

  if (path === '/analytics/progress' && method === 'get') {
    return {
      inProgressCount: 2,
      completedCount: 1,
      certificateCount: store.certificates.length,
      hoursLearned: 18,
      streak: 5,
      enrollmentTrend: [
        { name: 'Mon', hours: 1.5 },
        { name: 'Tue', hours: 2.0 },
        { name: 'Wed', hours: 0.8 },
        { name: 'Thu', hours: 3.2 },
        { name: 'Fri', hours: 2.4 },
        { name: 'Sat', hours: 1.0 },
        { name: 'Sun', hours: 2.1 },
      ],
    };
  }

  // ── Collections with CRUD ─────────────────────────────────────────────
  const collectionRoutes = [
    ['/users', 'users'],
    ['/roles', 'roles'],
    ['/permissions', 'permissions'],
    ['/invitations', 'invitations'],
    ['/batches', 'batches'],
    ['/instructors', 'instructors'],
    ['/students', 'students'],
    ['/courses', 'courses'],
    ['/enrollments', 'enrollments'],
    ['/admin/enrollments', 'enrollments'],
    ['/instructor/enrollments', 'enrollments'],
    ['/certificates', 'certificates'],
    ['/resources', 'resources'],
    ['/admin/audit-logs', 'auditLogs'],
    ['/admin/assessments', 'assessments'],
    ['/student/assessments', 'assessments'],
  ];

  for (const [base, key] of collectionRoutes) {
    if (path === base && method === 'get') return paginate(store[key], params);
    if (path === base && method === 'post') {
      const item = { id: store.nextId(key.slice(0, 3)), createdAt: store.now(), updatedAt: store.now(), ...body };
      if (key === 'courses' && !item.status) item.status = 'DRAFT';
      if (key === 'courses' && !item.title) item.title = 'Untitled course';
      store[key].unshift(item);
      return item;
    }

    const match = path.match(new RegExp(`^${base}/([^/]+)(?:/(.*))?$`));
    if (!match) continue;
    const id = match[1];
    const action = match[2] || '';

    // Nested / special actions
    if (base === '/courses' && id === 'mine' && method === 'get') {
      return paginate(
        store.courses.filter((c) => c.status === 'PUBLISHED'),
        params,
      );
    }

    if (base === '/instructors' && id === 'reference-data') {
      return {
        specializations: ['Full-Stack Engineering', 'Data Engineering', 'Cloud'],
        statuses: ['ACTIVE', 'INACTIVE'],
      };
    }
    if (base === '/students' && id === 'reference-data') {
      return {
        batches: store.batches.map((b) => ({ id: b.id, name: b.name })),
        enrolmentStatuses: ['ACTIVE', 'PENDING', 'COMPLETED', 'WITHDRAWN'],
      };
    }
    if ((base === '/instructors' || base === '/students') && id === 'photo' && action.startsWith('upload-url')) {
      return { uploadUrl: 'https://demo.local/upload', photoKey: `demo/photos/${store.nextId('photo')}.jpg` };
    }
    if (base === '/resources' && id === 'upload-url') {
      return { uploadUrl: 'https://demo.local/upload', key: `demo/resources/${store.nextId('res')}` };
    }
    if (base === '/resources' && id === 'upload' && method === 'post') {
      const item = {
        id: store.nextId('res'),
        title: body.title || body.file?.name || 'Uploaded resource',
        createdAt: store.now(),
      };
      store.resources.unshift(item);
      return item;
    }

    // Course lifecycle
    if (base === '/courses' && action && method === 'post') {
      const course = findById(store.courses, id);
      if (!course) notFound('Course');
      if (action === 'publish') course.status = 'PUBLISHED';
      if (action === 'unpublish') course.status = 'DRAFT';
      if (action === 'archive') course.status = 'ARCHIVED';
      if (action === 'submit') course.status = 'IN_REVIEW';
      if (action === 'approve') course.status = 'PUBLISHED';
      if (action === 'reject') course.status = 'DRAFT';
      if (action === 'duplicate') {
        const copy = {
          ...course,
          id: store.nextId('course'),
          title: `${course.title} (Copy)`,
          status: 'DRAFT',
          createdAt: store.now(),
        };
        store.courses.unshift(copy);
        return copy;
      }
      if (action === 'recordings') return [];
      if (action === 'thumbnail') return { ...course, thumbnailUrl: 'demo://thumbnail' };
      course.updatedAt = store.now();
      return course;
    }

    // Assessment lifecycle
    if (base === '/admin/assessments' && action && ['publish', 'unpublish', 'close', 'archive', 'duplicate', 'extend', 'schedule'].includes(action.split('/')[0])) {
      const asm = findById(store.assessments, id);
      if (!asm) notFound('Assessment');
      const verb = action.split('/')[0];
      if (verb === 'publish') asm.status = 'PUBLISHED';
      if (verb === 'unpublish') asm.status = 'DRAFT';
      if (verb === 'close') asm.status = 'CLOSED';
      if (verb === 'archive') asm.status = 'ARCHIVED';
      if (verb === 'duplicate') {
        const copy = { ...asm, id: store.nextId('asm'), title: `${asm.title} (Copy)`, status: 'DRAFT' };
        store.assessments.unshift(copy);
        return copy;
      }
      return asm;
    }

    if (base === '/admin/assessments' && (action === 'analytics' || action === 'result-analytics')) {
      return {
        attemptCount: 24,
        averageScore: 78,
        passRate: 71,
        scoreDistribution: [
          { bucket: '0-49', count: 2 },
          { bucket: '50-69', count: 5 },
          { bucket: '70-84', count: 10 },
          { bucket: '85-100', count: 7 },
        ],
      };
    }

    if (base === '/admin/assessments' && action === 'questions' && method === 'get') {
      return {
        content: [
          {
            id: 'q-1',
            prompt: 'What does useMemo do?',
            type: 'MCQ',
            options: ['Caches a value', 'Fetches data', 'Creates context'],
            correctIndex: 0,
          },
        ],
      };
    }

    if (base === '/student/assessments' && action === 'start' && method === 'post') {
      return {
        attemptId: store.nextId('att'),
        assessmentId: id,
        startedAt: store.now(),
        endsAt: new Date(Date.now() + 90 * 60000).toISOString(),
        questions: [
          { id: 'q-1', prompt: 'Demo question 1', type: 'MCQ', options: ['A', 'B', 'C'] },
          { id: 'q-2', prompt: 'Write a function that returns 42', type: 'CODING', language: 'javascript' },
        ],
      };
    }

    if (base === '/student/assessments' && action === 'attempts' && method === 'get') {
      return {
        content: [
          { id: 'att-1', score: 82, status: 'GRADED', submittedAt: store.now() },
        ],
      };
    }

    if (path.match(/^\/student\/assessments\/attempts\/[^/]+\/submit$/) && method === 'post') {
      return { id: path.split('/')[4], status: 'SUBMITTED', score: 80 };
    }

    if (path.match(/^\/student\/assessments\/attempts\/[^/]+$/) && method === 'get') {
      return {
        id: path.split('/')[4],
        status: 'GRADED',
        score: 82,
        maxScore: 100,
        feedback: 'Solid work — review edge cases.',
      };
    }

    if ((base === '/admin/enrollments' || base === '/instructor/enrollments') && action === 'status' && method === 'post') {
      const enr = findById(store.enrollments, id);
      if (!enr) notFound('Enrollment');
      Object.assign(enr, body);
      return enr;
    }

    if (base === '/certificates' && action === undefined && method === 'get' && id.startsWith('verify')) {
      // handled below
    }

    if (base === '/certificates' && id === 'verify') {
      // /certificates/verify/:serial
    }

    // Generic by-id
    if (!action) {
      if (method === 'get') {
        const item = findById(store[key], id);
        if (!item) notFound(key);
        return item;
      }
      if (method === 'patch' || method === 'put') {
        const item = findById(store[key], id);
        if (!item) notFound(key);
        Object.assign(item, body, { updatedAt: store.now() });
        return item;
      }
      if (method === 'delete') {
        const idx = store[key].findIndex((item) => String(item.id) === String(id));
        if (idx === -1) notFound(key);
        store[key].splice(idx, 1);
        return null;
      }
    }

    // User status actions
    if (base === '/users' && ['activate', 'deactivate', 'lock', 'unlock'].includes(action) && method === 'post') {
      const user = findById(store.users, id);
      if (!user) notFound('User');
      if (action === 'activate') user.active = true;
      if (action === 'deactivate') user.active = false;
      if (action === 'lock') user.locked = true;
      if (action === 'unlock') user.locked = false;
      return user;
    }
    if (base === '/users' && action === 'status-history') {
      return { content: [{ status: 'ACTIVE', at: store.now(), by: 'demo.admin@lms.local' }] };
    }
    if (base === '/users' && action === 'roles' && method === 'get') {
      return { roles: findById(store.users, id)?.roles ?? [] };
    }

    if (base === '/invitations' && action === 'resend' && method === 'post') {
      const inv = findById(store.invitations, id);
      if (!inv) notFound('Invitation');
      inv.status = 'PENDING';
      return inv;
    }

    if (base === '/certificates' && action === 'download') {
      return { downloadUrl: 'https://demo.local/certificate.pdf', fileName: 'certificate.pdf' };
    }

    if (base === '/resources' && (action === 'download' || action === 'stream')) {
      return { url: 'https://demo.local/file.pdf', fileName: 'demo.pdf' };
    }
  }

  // Certificate verify
  const verifyMatch = path.match(/^\/certificates\/verify\/(.+)$/);
  if (verifyMatch && method === 'get') {
    const cert = store.certificates.find((c) => c.serialNumber === decodeURIComponent(verifyMatch[1]));
    return cert
      ? { valid: true, ...cert }
      : { valid: false, message: 'Certificate not found' };
  }

  // Curriculum
  const curriculumMatch = path.match(/^\/courses\/([^/]+)\/curriculum(?:\/modules(?:\/([^/]+)(?:\/lessons(?:\/([^/]+))?)?)?)?/);
  if (curriculumMatch) {
    const course = findById(store.courses, curriculumMatch[1]);
    if (!course) notFound('Course');
    if (method === 'get') return { modules: course.modules ?? [] };
    if (method === 'post' && !curriculumMatch[2]) {
      const mod = { id: store.nextId('mod'), title: body.title || 'New module', sortOrder: (course.modules?.length ?? 0), lessons: [] };
      course.modules = course.modules || [];
      course.modules.push(mod);
      return mod;
    }
    if (curriculumMatch[2] && method === 'post' && path.includes('/lessons') && !curriculumMatch[3]) {
      const mod = course.modules?.find((m) => m.id === curriculumMatch[2]);
      if (!mod) notFound('Module');
      const lesson = { id: store.nextId('les'), title: body.title || 'New lesson', sortOrder: mod.lessons.length, type: 'VIDEO' };
      mod.lessons.push(lesson);
      return lesson;
    }
    if (method === 'patch' || method === 'put') {
      return { ...body, id: curriculumMatch[3] || curriculumMatch[2] };
    }
    if (method === 'delete') return null;
    // upload-url stubs
    if (path.includes('upload-url') || path.includes('/upload') || path.includes('/complete')) {
      return { uploadUrl: 'https://demo.local/upload', recordingId: store.nextId('rec') };
    }
    return course;
  }

  // Learning
  if (path.match(/^\/learning\/courses\/[^/]+\/progress$/) && method === 'get') {
    return { progressPercent: 45, completedLessonIds: ['les-1', 'les-2'] };
  }
  if (path.match(/^\/learning\/courses\/[^/]+\/lessons\/[^/]+$/)) {
    return {
      id: path.split('/').pop(),
      title: 'Demo lesson',
      content: 'This is offline demo lesson content.',
      completed: false,
    };
  }

  // Admin grading / rubrics
  if (path === '/admin/assessments/rubrics' && method === 'get') {
    return {
      content: [
        { id: 'rub-1', name: 'Coding Rubric', criteria: [{ name: 'Correctness', maxPoints: 50 }, { name: 'Style', maxPoints: 20 }] },
      ],
    };
  }
  if (path === '/admin/assessments/grading/pending' && method === 'get') {
    return {
      content: [
        {
          id: 'sub-1',
          attemptId: 'att-1',
          studentName: 'Alan Turing',
          assessmentTitle: 'Java Collections Exam',
          submittedAt: store.now(),
        },
      ],
    };
  }
  if (path.match(/^\/admin\/assessments\/grading\/attempts\/[^/]+\/grade$/) && method === 'post') {
    return { status: 'GRADED', score: body.score ?? 85 };
  }

  // Notifications (main API style + dedicated service)
  if ((path === '/notifications' || path === '/') && method === 'get' && (configImpliesNotifications(config) || path === '/notifications')) {
    return { items: store.notifications, content: store.notifications };
  }
  if (path === '/notifications/unread-count' || path === '/unread-count') {
    return { count: store.notifications.filter((n) => !n.read).length };
  }
  if (path.match(/^\/notifications\/[^/]+\/read$/) || path.match(/^\/[^/]+\/read$/)) {
    const id = path.split('/').filter(Boolean)[path.includes('notifications') ? 1 : 0];
    const n = findById(store.notifications, id);
    if (n) n.read = true;
    return n ?? null;
  }
  if (path === '/notifications/read-all' || path === '/read-all') {
    store.notifications.forEach((n) => {
      n.read = true;
    });
    return { success: true };
  }

  // Profile / org / subscription
  if (path === '/profile' && method === 'get') {
    const demo = readDemoSession();
    return demo?.user ?? store.users[0];
  }
  if (path === '/profile' && (method === 'patch' || method === 'put')) return { ...readDemoSession()?.user, ...body };
  if (path === '/profile/change-password' || path === '/users/me/password') return { success: true };
  if (path === '/profile/avatar') return { avatarUrl: 'demo://avatar' };

  if (path === '/organization' && method === 'get') {
    return {
      id: 'org-demo',
      name: 'Demo Academy',
      slug: 'demo',
      branding: { primaryColor: '#3b6fe0', logoUrl: null },
    };
  }
  if (path === '/organization' && (method === 'patch' || method === 'put')) {
    return { id: 'org-demo', ...body };
  }

  if (path === '/subscriptions/current') {
    return { plan: 'Growth', status: 'ACTIVE', seats: 100, renewsAt: daysFromNow(30) };
  }
  if (path === '/subscriptions/plans') {
    return {
      content: [
        { id: 'plan-starter', name: 'Starter', price: 49 },
        { id: 'plan-growth', name: 'Growth', price: 149 },
      ],
    };
  }
  if (path === '/subscriptions/billing') {
    return { content: [{ id: 'bill-1', amount: 149, date: store.now(), status: 'PAID' }] };
  }

  // Gamification
  if (path === '/gamification/me/summary') return store.gamification.summary;
  if (path === '/gamification/me/badges') return store.gamification.badges;
  if (path === '/gamification/me/milestones') return store.gamification.milestones;
  if (path === '/gamification/me/streak') return store.gamification.streak;
  if (path === '/gamification/me/points') return paginate(store.gamification.points, params);
  if (path === '/gamification/leaderboard') return { content: store.gamification.leaderboard };
  if (path === '/admin/gamification/badges') {
    if (method === 'get') return { content: store.gamification.adminBadges };
    if (method === 'post') {
      const badge = { id: store.nextId('badge'), ...body };
      store.gamification.adminBadges.push(badge);
      return badge;
    }
  }
  if (path === '/admin/gamification/levels') {
    if (method === 'get') return { content: store.gamification.adminLevels };
    if (method === 'post') {
      const level = { id: store.nextId('lv'), ...body };
      store.gamification.adminLevels.push(level);
      return level;
    }
  }
  if (path === '/admin/gamification/milestones') {
    if (method === 'get') return { content: store.gamification.adminMilestones };
    if (method === 'post') {
      const m = { id: store.nextId('ms'), ...body };
      store.gamification.adminMilestones.push(m);
      return m;
    }
  }
  if (path === '/admin/gamification/point-rules' && method === 'get') {
    return { content: store.gamification.adminPointRules };
  }
  if (path.match(/^\/admin\/gamification\//) && (method === 'put' || method === 'patch' || method === 'delete')) {
    return method === 'delete' ? null : { id: path.split('/').pop(), ...body };
  }

  // Calendar / notes / bookmarks
  if (path === '/student/calendar' || path === '/student/calendar/deadlines') {
    return { content: store.calendarEvents, events: store.calendarEvents };
  }
  if (path === '/student/notes' || path.startsWith('/student/notes/')) {
    if (method === 'get') return { content: store.notes };
    if (method === 'post') {
      const note = { id: store.nextId('note'), ...body, createdAt: store.now() };
      store.notes.unshift(note);
      return note;
    }
    if (method === 'delete') {
      store.notes = store.notes.filter((n) => n.id !== path.split('/').pop());
      return null;
    }
  }
  if (path === '/student/bookmarks' || path.startsWith('/student/bookmarks')) {
    if (path.includes('/toggle') && method === 'post') {
      return { bookmarked: true, id: store.nextId('bm') };
    }
    if (path.includes('/check')) return { bookmarked: true };
    if (method === 'get') return { content: store.bookmarks };
    if (method === 'delete') return null;
  }

  // Chat REST
  if (path === '/channels' || path === '/chat/channels') {
    if (method === 'get') return store.chatChannels;
    if (method === 'post') {
      const ch = {
        id: store.nextId('ch'),
        type: body.type || 'GROUP',
        name: body.name || 'New channel',
        memberCount: (body.memberIds?.length ?? 0) + 1,
        unreadCount: 0,
        updatedAt: store.now(),
      };
      store.chatChannels.unshift(ch);
      return ch;
    }
  }
  if (path.match(/^\/channels\/[^/]+$/)) {
    const id = path.split('/')[2];
    return findById(store.chatChannels, id) ?? notFound('Channel');
  }
  if (path.match(/^\/channels\/[^/]+\/members$/)) {
    return [
      { userId: 'demo-admin', name: 'Demo Admin', email: 'demo.admin@lms.local' },
      { userId: 'demo-instructor', name: 'Demo Instructor', email: 'demo.instructor@lms.local' },
      { userId: 'stu-1', name: 'Ada Lovelace', email: 'ada@lms.local' },
    ];
  }
  if (path.match(/^\/channels\/[^/]+\/messages/)) {
    const id = path.split('/')[2];
    if (method === 'get') return store.chatMessages[id] ?? [];
    if (method === 'post') {
      const msg = {
        id: store.nextId('msg'),
        channelId: id,
        content: body.content || '',
        senderId: 'demo-admin',
        senderName: 'Demo Admin',
        createdAt: store.now(),
      };
      store.chatMessages[id] = store.chatMessages[id] || [];
      store.chatMessages[id].push(msg);
      return msg;
    }
  }
  if (path === '/users' && config.baseURL?.includes('/chat')) {
    return store.users.map((u) => ({ user_id: u.id, name: u.name, email: u.email }));
  }
  if (path === '/messages/search') return [];

  // Announcements (tenant + platform)
  if (
    path === '/announcements' ||
    path === '/announcements/active' ||
    path === '/platform/announcements' ||
    path === '/platform/announcements/active'
  ) {
    const items = [
      {
        id: 'ann-1',
        title: 'Welcome to the LMS demo',
        body: 'You are browsing fully offline with seeded sample data.',
        active: true,
        createdAt: store.now(),
      },
      {
        id: 'ann-2',
        title: 'Assessment window',
        body: 'React Hooks Challenge is open for practice this week.',
        active: true,
        createdAt: store.now(),
      },
    ];
    if (method === 'get') return path.endsWith('/active') ? items : { content: items };
    if (method === 'post') return { id: store.nextId('ann'), ...body, active: true, createdAt: store.now() };
  }
  if (path.match(/^\/(?:platform\/)?announcements\/[^/]+/) && (method === 'post' || method === 'delete')) {
    return method === 'delete' ? null : { success: true };
  }

  // Catch-all: safe empty responses so screens stay usable
  if (method === 'get') {
    if (params.page !== undefined || params.size !== undefined) return paginate([], params);
    return {};
  }
  if (method === 'delete') return null;
  return { success: true, ...body, id: body.id || store.nextId('demo') };
};

function configImpliesNotifications(config) {
  return String(config.baseURL || '').includes('notification');
}

function daysFromNow(n) {
  return new Date(Date.now() + n * 86400000).toISOString();
}

export { resetDemoStore };
