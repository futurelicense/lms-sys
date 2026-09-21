/**
 * In-memory demo dataset. Mutated by demoRouter so create/edit/delete feel real
 * within a tab session. Reset on full page reload (re-seeded from factory).
 */

const now = () => new Date().toISOString();
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

export const createDemoStore = () => {
  const courses = [
    {
      id: 'course-react',
      title: 'React Ecosystem Mastery',
      code: 'REACT-101',
      description: 'Hooks, composition, and production React patterns.',
      status: 'PUBLISHED',
      level: 'INTERMEDIATE',
      category: 'Frontend',
      durationHours: 24,
      enrollmentCount: 48,
      moduleCount: 6,
      lessonCount: 28,
      thumbnailUrl: null,
      instructorName: 'Demo Instructor',
      instructorId: 'demo-instructor',
      createdAt: daysAgo(40),
      updatedAt: daysAgo(2),
      publishedAt: daysAgo(30),
      modules: [
        {
          id: 'mod-1',
          title: 'Foundations',
          sortOrder: 0,
          lessons: [
            { id: 'les-1', title: 'JSX & Components', sortOrder: 0, durationMinutes: 25, type: 'VIDEO' },
            { id: 'les-2', title: 'Props & State', sortOrder: 1, durationMinutes: 30, type: 'VIDEO' },
          ],
        },
        {
          id: 'mod-2',
          title: 'Hooks in Depth',
          sortOrder: 1,
          lessons: [
            { id: 'les-3', title: 'useEffect Patterns', sortOrder: 0, durationMinutes: 35, type: 'VIDEO' },
            { id: 'les-4', title: 'Custom Hooks Lab', sortOrder: 1, durationMinutes: 40, type: 'LAB' },
          ],
        },
      ],
    },
    {
      id: 'course-java',
      title: 'Java & Algorithms',
      code: 'JAVA-201',
      description: 'Data structures, complexity, and interview-ready Java.',
      status: 'PUBLISHED',
      level: 'ADVANCED',
      category: 'Backend',
      durationHours: 36,
      enrollmentCount: 62,
      moduleCount: 8,
      lessonCount: 40,
      thumbnailUrl: null,
      instructorName: 'Demo Instructor',
      instructorId: 'demo-instructor',
      createdAt: daysAgo(55),
      updatedAt: daysAgo(5),
      publishedAt: daysAgo(45),
      modules: [
        {
          id: 'mod-j1',
          title: 'Collections',
          sortOrder: 0,
          lessons: [
            { id: 'les-j1', title: 'Lists & Maps', sortOrder: 0, durationMinutes: 45, type: 'VIDEO' },
          ],
        },
      ],
    },
    {
      id: 'course-sql',
      title: 'SQL Optimization',
      code: 'SQL-150',
      description: 'Indexing, query plans, and practical tuning.',
      status: 'DRAFT',
      level: 'INTERMEDIATE',
      category: 'Data',
      durationHours: 12,
      enrollmentCount: 0,
      moduleCount: 3,
      lessonCount: 12,
      thumbnailUrl: null,
      instructorName: 'Demo Instructor',
      instructorId: 'demo-instructor',
      createdAt: daysAgo(10),
      updatedAt: daysAgo(1),
      publishedAt: null,
      modules: [],
    },
    {
      id: 'course-fullstack',
      title: 'Full-Stack Architecture',
      code: 'FS-301',
      description: 'APIs, auth, and deployment for modern web apps.',
      status: 'PUBLISHED',
      level: 'ADVANCED',
      category: 'Full-Stack',
      durationHours: 40,
      enrollmentCount: 31,
      moduleCount: 7,
      lessonCount: 32,
      thumbnailUrl: null,
      instructorName: 'Demo Instructor',
      instructorId: 'demo-instructor',
      createdAt: daysAgo(70),
      updatedAt: daysAgo(8),
      publishedAt: daysAgo(60),
      modules: [],
    },
  ];

  const batches = [
    {
      id: 'batch-spring',
      name: 'Spring 2026 Cohort',
      code: 'SPR-26',
      status: 'ACTIVE',
      startDate: daysAgo(60),
      endDate: daysAgo(-90),
      capacity: 40,
      enrolledCount: 28,
      instructorId: 'demo-instructor',
      instructorName: 'Demo Instructor',
      createdAt: daysAgo(90),
    },
    {
      id: 'batch-summer',
      name: 'Summer Accelerator',
      code: 'SUM-26',
      status: 'UPCOMING',
      startDate: daysAgo(-30),
      endDate: daysAgo(-120),
      capacity: 30,
      enrolledCount: 12,
      instructorId: 'demo-instructor',
      instructorName: 'Demo Instructor',
      createdAt: daysAgo(20),
    },
  ];

  const students = [
    {
      id: 'stu-1',
      fullName: 'Ada Lovelace',
      name: 'Ada Lovelace',
      email: 'ada@lms.local',
      phone: '+1-555-0101',
      batchId: 'batch-spring',
      batchName: 'Spring 2026 Cohort',
      enrolmentStatus: 'ACTIVE',
      status: 'ACTIVE',
      createdAt: daysAgo(50),
    },
    {
      id: 'stu-2',
      fullName: 'Alan Turing',
      name: 'Alan Turing',
      email: 'alan@lms.local',
      phone: '+1-555-0102',
      batchId: 'batch-spring',
      batchName: 'Spring 2026 Cohort',
      enrolmentStatus: 'ACTIVE',
      status: 'ACTIVE',
      createdAt: daysAgo(48),
    },
    {
      id: 'stu-3',
      fullName: 'Grace Hopper',
      name: 'Grace Hopper',
      email: 'grace@lms.local',
      phone: '+1-555-0103',
      batchId: 'batch-summer',
      batchName: 'Summer Accelerator',
      enrolmentStatus: 'PENDING',
      status: 'ACTIVE',
      createdAt: daysAgo(12),
    },
  ];

  const instructors = [
    {
      id: 'demo-instructor',
      fullName: 'Demo Instructor',
      name: 'Demo Instructor',
      email: 'demo.instructor@lms.local',
      phone: '+1-555-0200',
      specialization: 'Full-Stack Engineering',
      status: 'ACTIVE',
      courseCount: 4,
      studentCount: 90,
      createdAt: daysAgo(100),
    },
    {
      id: 'ins-2',
      fullName: 'Priya Sharma',
      name: 'Priya Sharma',
      email: 'priya@lms.local',
      phone: '+1-555-0201',
      specialization: 'Data Engineering',
      status: 'ACTIVE',
      courseCount: 2,
      studentCount: 40,
      createdAt: daysAgo(80),
    },
  ];

  const users = [
    {
      id: 'demo-admin',
      name: 'Demo Admin',
      email: 'demo.admin@lms.local',
      phone: '+1-555-0001',
      active: true,
      locked: false,
      activated: true,
      roles: ['ADMIN'],
      createdAt: daysAgo(120),
    },
    {
      id: 'demo-instructor',
      name: 'Demo Instructor',
      email: 'demo.instructor@lms.local',
      phone: '+1-555-0200',
      active: true,
      locked: false,
      activated: true,
      roles: ['INSTRUCTOR'],
      createdAt: daysAgo(100),
    },
    {
      id: 'demo-student',
      name: 'Demo Student',
      email: 'demo.student@lms.local',
      phone: '+1-555-0300',
      active: true,
      locked: false,
      activated: true,
      roles: ['STUDENT'],
      createdAt: daysAgo(40),
    },
    {
      id: 'stu-1',
      name: 'Ada Lovelace',
      email: 'ada@lms.local',
      phone: '+1-555-0101',
      active: true,
      locked: false,
      activated: true,
      roles: ['STUDENT'],
      createdAt: daysAgo(50),
    },
  ];

  const roles = [
    {
      id: 'role-admin',
      name: 'ADMIN',
      description: 'Tenant administrator',
      permissions: ['USER_VIEW', 'COURSE_VIEW', 'COURSE_CREATE', 'ASSESSMENT_VIEW'],
      userCount: 1,
    },
    {
      id: 'role-instructor',
      name: 'INSTRUCTOR',
      description: 'Teaching staff',
      permissions: ['COURSE_VIEW', 'COURSE_CREATE', 'ASSESSMENT_VIEW', 'BATCH_VIEW'],
      userCount: 2,
    },
    {
      id: 'role-student',
      name: 'STUDENT',
      description: 'Learner',
      permissions: [],
      userCount: 3,
    },
  ];

  const permissions = [
    { id: 'p1', name: 'USER_VIEW', description: 'View users', category: 'Users' },
    { id: 'p2', name: 'COURSE_VIEW', description: 'View courses', category: 'Courses' },
    { id: 'p3', name: 'COURSE_CREATE', description: 'Create courses', category: 'Courses' },
    { id: 'p4', name: 'ASSESSMENT_VIEW', description: 'View assessments', category: 'Assessments' },
    { id: 'p5', name: 'BATCH_VIEW', description: 'View batches', category: 'Batches' },
  ];

  const invitations = [
    {
      id: 'inv-1',
      email: 'new.learner@lms.local',
      role: 'STUDENT',
      status: 'PENDING',
      createdAt: daysAgo(3),
      expiresAt: daysAgo(-4),
    },
    {
      id: 'inv-2',
      email: 'guest.teacher@lms.local',
      role: 'INSTRUCTOR',
      status: 'ACCEPTED',
      createdAt: daysAgo(20),
      expiresAt: daysAgo(10),
    },
  ];

  const enrollments = [
    {
      id: 'enr-1',
      studentId: 'stu-1',
      studentName: 'Ada Lovelace',
      courseId: 'course-react',
      courseTitle: 'React Ecosystem Mastery',
      batchId: 'batch-spring',
      status: 'ACTIVE',
      progressPercent: 62,
      enrolledAt: daysAgo(40),
    },
    {
      id: 'enr-2',
      studentId: 'stu-2',
      studentName: 'Alan Turing',
      courseId: 'course-java',
      courseTitle: 'Java & Algorithms',
      batchId: 'batch-spring',
      status: 'ACTIVE',
      progressPercent: 38,
      enrolledAt: daysAgo(38),
    },
    {
      id: 'enr-3',
      studentId: 'demo-student',
      studentName: 'Demo Student',
      courseId: 'course-react',
      courseTitle: 'React Ecosystem Mastery',
      batchId: 'batch-spring',
      status: 'ACTIVE',
      progressPercent: 45,
      enrolledAt: daysAgo(25),
    },
    {
      id: 'enr-4',
      studentId: 'demo-student',
      studentName: 'Demo Student',
      courseId: 'course-java',
      courseTitle: 'Java & Algorithms',
      batchId: 'batch-spring',
      status: 'ACTIVE',
      progressPercent: 20,
      enrolledAt: daysAgo(20),
    },
  ];

  const assessments = [
    {
      id: 'asm-1',
      title: 'React Hooks Challenge',
      status: 'PUBLISHED',
      type: 'MIXED',
      durationMinutes: 90,
      questionCount: 12,
      courseId: 'course-react',
      courseTitle: 'React Ecosystem Mastery',
      startsAt: daysAgo(5),
      endsAt: daysAgo(-10),
      createdAt: daysAgo(15),
      maxScore: 100,
      passingScore: 70,
    },
    {
      id: 'asm-2',
      title: 'Java Collections Exam',
      status: 'PUBLISHED',
      type: 'CODING',
      durationMinutes: 120,
      questionCount: 8,
      courseId: 'course-java',
      courseTitle: 'Java & Algorithms',
      startsAt: daysAgo(2),
      endsAt: daysAgo(-14),
      createdAt: daysAgo(12),
      maxScore: 100,
      passingScore: 65,
    },
    {
      id: 'asm-3',
      title: 'SQL Tuning Quiz',
      status: 'DRAFT',
      type: 'MCQ',
      durationMinutes: 45,
      questionCount: 20,
      courseId: 'course-sql',
      courseTitle: 'SQL Optimization',
      startsAt: null,
      endsAt: null,
      createdAt: daysAgo(4),
      maxScore: 100,
      passingScore: 70,
    },
  ];

  const certificates = [
    {
      id: 'cert-1',
      serialNumber: 'LMS-DEMO-2026-001',
      courseTitle: 'React Ecosystem Mastery',
      courseId: 'course-react',
      studentName: 'Demo Student',
      issuedAt: daysAgo(7),
      status: 'ISSUED',
    },
  ];

  const notifications = [
    {
      id: 'ntf-1',
      title: 'Assessment window open',
      body: 'React Hooks Challenge is available until next week.',
      read: false,
      createdAt: daysAgo(0),
      type: 'ASSESSMENT',
    },
    {
      id: 'ntf-2',
      title: 'New course published',
      body: 'Full-Stack Architecture is now available to learners.',
      read: false,
      createdAt: daysAgo(1),
      type: 'COURSE',
    },
    {
      id: 'ntf-3',
      title: 'Welcome to the demo workspace',
      body: 'You are browsing offline demo data — no backend required.',
      read: true,
      createdAt: daysAgo(2),
      type: 'SYSTEM',
    },
  ];

  const resources = [
    {
      id: 'res-1',
      title: 'React Cheatsheet',
      category: 'Guides',
      fileName: 'react-cheatsheet.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 245000,
      createdAt: daysAgo(14),
    },
    {
      id: 'res-2',
      title: 'Java Interview Pack',
      category: 'Practice',
      fileName: 'java-interview.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 512000,
      createdAt: daysAgo(21),
    },
  ];

  const notes = [
    {
      id: 'note-1',
      courseId: 'course-react',
      lessonId: 'les-1',
      content: 'Remember: components should be pure when possible.',
      createdAt: daysAgo(3),
      updatedAt: daysAgo(1),
    },
  ];

  const bookmarks = [
    {
      id: 'bm-1',
      courseId: 'course-react',
      lessonId: 'les-3',
      title: 'useEffect Patterns',
      createdAt: daysAgo(2),
    },
  ];

  const calendarEvents = [
    {
      id: 'cal-1',
      title: 'React Hooks Challenge',
      type: 'ASSESSMENT',
      startsAt: daysAgo(-2),
      endsAt: daysAgo(-10),
    },
    {
      id: 'cal-2',
      title: 'Office hours with Demo Instructor',
      type: 'EVENT',
      startsAt: daysAgo(-1),
      endsAt: daysAgo(-1),
    },
  ];

  const auditLogs = [
    {
      id: 'aud-1',
      action: 'COURSE_PUBLISH',
      entityType: 'COURSE',
      entityId: 'course-react',
      userEmail: 'demo.admin@lms.local',
      timestamp: daysAgo(30),
      details: 'Published React Ecosystem Mastery',
    },
    {
      id: 'aud-2',
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: 'demo-admin',
      userEmail: 'demo.admin@lms.local',
      timestamp: daysAgo(0),
      details: 'Demo session started',
    },
  ];

  const chatChannels = [
    {
      id: 'ch-1',
      type: 'GROUP',
      name: 'Spring 2026 General',
      description: 'Cohort announcements and Q&A',
      memberCount: 12,
      unreadCount: 2,
      lastMessage: {
        id: 'msg-3',
        content: 'Office hours tomorrow at 3pm.',
        senderName: 'Demo Instructor',
        createdAt: daysAgo(0),
      },
      updatedAt: daysAgo(0),
    },
    {
      id: 'ch-2',
      type: 'DIRECT',
      name: 'Ada Lovelace',
      memberCount: 2,
      unreadCount: 0,
      lastMessage: {
        id: 'msg-1',
        content: 'Thanks for the feedback on the lab!',
        senderName: 'Ada Lovelace',
        createdAt: daysAgo(1),
      },
      updatedAt: daysAgo(1),
    },
  ];

  const chatMessages = {
    'ch-1': [
      {
        id: 'msg-2',
        channelId: 'ch-1',
        content: 'Welcome to the Spring cohort channel.',
        senderId: 'demo-instructor',
        senderName: 'Demo Instructor',
        createdAt: daysAgo(5),
      },
      {
        id: 'msg-3',
        channelId: 'ch-1',
        content: 'Office hours tomorrow at 3pm.',
        senderId: 'demo-instructor',
        senderName: 'Demo Instructor',
        createdAt: daysAgo(0),
      },
    ],
    'ch-2': [
      {
        id: 'msg-1',
        channelId: 'ch-2',
        content: 'Thanks for the feedback on the lab!',
        senderId: 'stu-1',
        senderName: 'Ada Lovelace',
        createdAt: daysAgo(1),
      },
    ],
  };

  const gamification = {
    summary: {
      points: 1840,
      level: 5,
      levelName: 'Pathfinder',
      nextLevelPoints: 2000,
      rank: 4,
      badgesEarned: 6,
    },
    badges: [
      { id: 'b1', title: 'First Lesson', earned: true, earnedAt: daysAgo(20) },
      { id: 'b2', title: 'Week Streak', earned: true, earnedAt: daysAgo(5) },
      { id: 'b3', title: 'Assessment Ace', earned: false },
    ],
    milestones: [
      { id: 'm1', title: 'Complete 3 courses', progress: 1, target: 3 },
      { id: 'm2', title: 'Earn 5 badges', progress: 6, target: 5, completed: true },
    ],
    streak: { current: 5, longest: 12, lastActiveDate: daysAgo(0) },
    points: [
      { id: 'pt-1', points: 50, reason: 'Completed lesson', createdAt: daysAgo(1) },
      { id: 'pt-2', points: 100, reason: 'Assessment submitted', createdAt: daysAgo(3) },
    ],
    leaderboard: [
      { rank: 1, name: 'Ada Lovelace', points: 3200 },
      { rank: 2, name: 'Alan Turing', points: 2900 },
      { rank: 3, name: 'Grace Hopper', points: 2100 },
      { rank: 4, name: 'Demo Student', points: 1840 },
    ],
    adminBadges: [
      { id: 'b1', title: 'First Lesson', description: 'Complete your first lesson', points: 50 },
      { id: 'b2', title: 'Week Streak', description: 'Learn 7 days in a row', points: 100 },
    ],
    adminLevels: [
      { id: 'lv-1', name: 'Novice', minPoints: 0 },
      { id: 'lv-5', name: 'Pathfinder', minPoints: 1500 },
    ],
    adminMilestones: [
      { id: 'm1', title: 'Complete 3 courses', target: 3 },
    ],
    adminPointRules: [
      { id: 'pr-1', action: 'LESSON_COMPLETE', points: 50 },
      { id: 'pr-2', action: 'ASSESSMENT_PASS', points: 150 },
    ],
  };

  return {
    courses,
    batches,
    students,
    instructors,
    users,
    roles,
    permissions,
    invitations,
    enrollments,
    assessments,
    certificates,
    notifications,
    resources,
    notes,
    bookmarks,
    calendarEvents,
    auditLogs,
    chatChannels,
    chatMessages,
    gamification,
    seq: 100,
    nextId(prefix) {
      this.seq += 1;
      return `${prefix}-${this.seq}`;
    },
    now,
  };
};

/** Singleton store for the browser tab. */
let store = createDemoStore();

export const getDemoStore = () => store;

export const resetDemoStore = () => {
  store = createDemoStore();
  return store;
};

export const paginate = (items, params = {}) => {
  const page = Number(params.page ?? 0);
  const size = Number(params.size ?? 20);
  const search = String(params.search ?? params.q ?? '')
    .trim()
    .toLowerCase();

  let filtered = Array.isArray(items) ? [...items] : [];

  if (search) {
    filtered = filtered.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(search),
    );
  }

  if (params.status && params.status !== 'ALL') {
    filtered = filtered.filter((item) => item.status === params.status);
  }

  if (params.batchId) {
    filtered = filtered.filter((item) => item.batchId === params.batchId);
  }

  if (params.enrolmentStatus) {
    filtered = filtered.filter((item) => item.enrolmentStatus === params.enrolmentStatus);
  }

  if (params.active === true || params.active === 'true') {
    filtered = filtered.filter((item) => item.active === true);
  }
  if (params.active === false || params.active === 'false') {
    filtered = filtered.filter((item) => item.active === false);
  }

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size) || 1);
  const start = page * size;
  const content = filtered.slice(start, start + size);

  return {
    content,
    page,
    size,
    totalElements,
    totalPages,
    number: page,
    first: page === 0,
    last: page >= totalPages - 1,
    empty: content.length === 0,
  };
};
