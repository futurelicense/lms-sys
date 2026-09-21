# LMS Frontend

> **Modern React SPA for the Learning Management System**
> React 18 · Vite · React Router · Redux Toolkit · Axios

---

## Overview

The LMS Frontend is a feature-rich single-page application (SPA) built with React that serves as the primary user interface for the Learning Management System. It provides role-specific dashboards and workflows for **Admins**, **Instructors**, and **Students**, along with cross-cutting features like real-time chat, notifications, and certificate management.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   LMS Frontend (5173)                 │
├──────────────────────────────────────────────────────┤
│  App Shell (Role-Based Layouts)                       │
│  ┌────────────┐ ┌──────────────┐ ┌───────────────┐   │
│  │  Admin     │ │  Instructor  │ │   Student     │   │
│  │  Layout    │ │   Layout     │ │    Layout     │   │
│  └────────────┘ └──────────────┘ └───────────────┘   │
├──────────────────────────────────────────────────────┤
│  Feature Modules (Lazy-loaded):                       │
│  Auth · Courses · Assessments · Enrollment · Chat    │
│  Analytics · Gamification · Certificates · Notes     │
│  Calendar · Notifications · Resources · Platform     │
├──────────────────────────────────────────────────────┤
│  Services: API Client (Axios) + WebSocket (Socket.IO)│
│  State: Redux Toolkit + React Context                │
│  Guards: ProtectedRoute · RoleGuard · PermissionGuard│
└──────────────────────────────────────────────────────┘
         │                    │                  │
    REST API (8080)     Chat WS (3001)    Notif WS (3002)
```

## Feature Modules

### Authentication (`features/auth`)
- Login with JWT token management (access + refresh)
- Magic-link invitation acceptance flow
- Forgot password / reset password flow
- Session management (multi-session support)
- Automatic token refresh with Axios interceptors
- Guest/Protected route guards

### User Management (`features/users`)
- User list with search and pagination (Admin)
- Create, edit, view user profiles
- Role assignment and management

### Role & Permission Management (`features/roles`)
- Role list and detail views
- Permission matrix visualization
- Role-based permission assignments

### Invitation Management (`features/invitations`)
- Send magic-link invitations by role
- Track invitation status (pending, accepted, expired)
- Bulk invitation management

### Course Management (`features/courses`)
- **Admin**: Full course list with lifecycle controls, create/edit/duplicate courses
- **Instructor**: Personal course management, curriculum builder
- **Student**: "My Courses" view with enrollment status
- Course detail view with module/lesson curriculum tree
- Lesson thumbnail and video recording upload
- Course lifecycle actions (publish, unpublish, archive, submit for review)

### Learning Experience (`features/learning`)
- Interactive course player with lesson navigation
- Video recording playback
- Progress tracking (per-lesson completion)
- Learning progress persistence

### Assessment Engine (`features/assessments`)
- **Admin/Instructor**: Create, edit, duplicate, publish assessments
- Assessment builder with sections and questions (coding + MCQ)
- Question bank management
- Grading workflow (auto-grade + manual review)
- Rubric manager for consistent grading criteria
- Scheduling (time windows, deadline extensions)
- **Student**: Assessment list, lockdown exam taking page, result analytics
- Submission history across all assessments
- Retest grant management

### Enrollment Management (`features/enrollment`)
- Enrollment list with status tracking
- Enrollment details and progress view
- Batch management and cohort enrollment

### Student Management (`features/students`)
- Student list with batch filtering
- Student profile creation and editing
- Student detail views with enrollment history

### Instructor Management (`features/instructors`)
- Instructor list and profiles
- Add, edit, view instructor details

### Batch/Cohort Management (`features/batches`)
- Batch list for Admin and Instructor views
- Cohort-based student grouping

### Analytics Dashboards (`features/analytics`)
- **Admin**: System-wide KPIs (active learners, course stats, action queue, top/at-risk courses)
- **Instructor**: Teaching metrics (student counts, completion rates)
- **Student**: Personal progress (enrolled/completed courses, hours, streak, weekly chart)

### Certificate Management (`features/certificates`)
- **Student**: Certificate list and detail/download views
- **Instructor**: Certification hub for issuance management
- **Public**: Certificate verification page (no auth required)

### Gamification (`features/gamification`)
- **Student**: Points, badges, milestones, streak tracker, leaderboard
- **Admin**: Gamification configuration panel

### Real-time Chat (`features/chat`)
- Channel-based messaging (direct & group)
- Real-time messaging via Socket.IO
- Message reactions and pinning
- File sharing with Cloudflare R2
- Online presence indicators

### Notifications (`features/notifications`)
- Real-time notification bell with unread count
- Notification list with mark-as-read
- Platform announcements (instructor/admin)
- WebSocket push notifications

### Notes & Bookmarks (`features/notes`)
- Personal notes on courses/lessons
- Bookmark management for quick access

### Calendar (`features/calendar`)
- Student calendar with assessment deadlines and events

### Campus Resources (`features/resources`)
- Resource library management
- File upload/download with Cloudflare R2
- Category-based organization

### Profile & Security (`features/profile`)
- Personal profile editing
- Password change and session management

### Organization & Tenant (`features/tenants`)
- Organization settings and branding
- Tenant configuration management

### Subscription & Billing (`features/subscriptions`)
- Subscription plan management
- Billing information

### Audit Logs (`features/audit`)
- System audit log viewer (Admin)

### Platform Control Plane (`features/platform`)
- Multi-tenant management dashboard
- Tenant creation, configuration, and monitoring
- Platform-wide audit logs
- Platform announcements management

## Route Structure

| Path Prefix    | Role(s)                    | Description                  |
|----------------|----------------------------|------------------------------|
| `/login`       | Guest                      | Authentication pages         |
| `/admin/*`     | ADMIN, SUPER_ADMIN         | Admin workspace              |
| `/instructor/*`| INSTRUCTOR, ADMIN          | Instructor workspace         |
| `/learn/*`     | STUDENT (all roles)        | Student learning experience  |
| `/platform/*`  | Platform Admin             | Multi-tenant control plane   |
| `/chat/*`      | All authenticated          | Real-time messaging          |
| `/verify/:id`  | Public                     | Certificate verification     |

## Prerequisites

- **Node.js 18+** (or 20+ recommended)
- **npm** or **yarn**

## Setup

1. **Navigate to the frontend directory**
   ```bash
   cd LMS-FrontEnd/lms-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   Create a `.env` file with API endpoints:
   ```env
   VITE_API_URL=http://localhost:8080/api/v1
   VITE_CHAT_URL=http://localhost:3001
   VITE_NOTIFICATION_URL=http://localhost:3002
   VITE_CERT_URL=http://localhost:8081
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173`

## Project Structure

```
src/
├── app/                    # App entry (routes, store, providers)
│   ├── App.jsx
│   ├── routes.jsx          # All route definitions
│   ├── store.js            # Redux store configuration
│   └── providers/          # Context providers
├── assets/                 # Static assets
├── components/             # Shared UI components
│   ├── common/             # Spinner, EmptyState, ErrorBoundary
│   └── ui/                 # AdminModal, etc.
├── config/                 # API configuration
├── constants/              # Routes, roles, permissions
├── context/                # React context providers
├── features/               # Feature modules (24 feature areas)
│   ├── analytics/          # Dashboard analytics
│   ├── assessments/        # Assessment engine
│   ├── auth/               # Authentication
│   ├── batches/            # Cohort management
│   ├── calendar/           # Student calendar
│   ├── certificates/       # Certificate management
│   ├── chat/               # Real-time messaging
│   ├── courses/            # Course management
│   ├── enrollment/         # Enrollment tracking
│   ├── gamification/       # Points, badges, leaderboard
│   ├── instructors/        # Instructor profiles
│   ├── invitations/        # Magic-link invitations
│   ├── learning/           # Course consumption
│   ├── notes/              # Notes & bookmarks
│   ├── notifications/      # Notification center
│   ├── platform/           # Multi-tenant control plane
│   ├── profile/            # User profile & security
│   ├── resources/          # Campus resource library
│   ├── roles/              # Role management
│   ├── students/           # Student profiles
│   ├── subscriptions/      # Billing & plans
│   ├── tenants/            # Organization settings
│   └── users/              # User management
├── guards/                 # Route protection
│   ├── ProtectedRoute.jsx
│   ├── GuestRoute.jsx
│   ├── RoleGuard.jsx
│   └── PermissionGuard.jsx
├── hooks/                  # Custom hooks
├── layouts/                # Page layouts
│   ├── AppShell.jsx        # Main app shell with sidebar
│   ├── AdminLayout.jsx
│   ├── InstructorLayout.jsx
│   ├── StudentLayout.jsx
│   └── AuthLayout.jsx
├── services/               # API service layer
├── styles/                 # Global styles
├── types/                  # Type definitions
└── utils/                  # Utility functions
```

## Key Design Patterns

- **Feature-based architecture**: Each feature is a self-contained module with pages, components, hooks, services, and state
- **Lazy loading**: All feature pages are code-split with `React.lazy()` for optimal bundle sizes
- **Role-based layouts**: Automatic layout switching based on user's primary role
- **Permission guards**: Granular access control matching backend RBAC model
- **API interceptors**: Automatic JWT refresh and tenant header injection
