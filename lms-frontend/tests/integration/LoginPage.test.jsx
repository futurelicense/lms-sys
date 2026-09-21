import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../src/features/auth/store/authSlice';
import LoginPage from '../../src/features/auth/pages/LoginPage';
import authService from '../../src/features/auth/services/authService';
import platformService from '../../src/features/platform/services/platformService';
import * as tenantHostname from '../../src/utils/tenantHostname';
import '../../src/services/storage/tokenStorage';
import '../../src/features/platform/services/platformAuthStorage';

vi.mock('../../src/features/auth/services/authService', () => ({
  default: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

vi.mock('../../src/features/platform/services/platformService', () => ({
  default: {
    login: vi.fn(),
  },
}));

vi.mock('../../src/utils/tenantHostname', () => ({
  isPlatformHostname: vi.fn(),
  tenantSlugFromHostname: vi.fn(),
}));

import { ROUTES } from '../../src/constants/routes';

const renderLoginPage = ({ initialEntries = [ROUTES.LOGIN] } = {}) => {
  const store = configureStore({
    reducer: { auth: authReducer },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<div>Forgot Password Screen</div>} />
            <Route path={ROUTES.ADMIN_ANALYTICS} element={<div>Admin Dashboard</div>} />
            <Route path={ROUTES.MY_COURSES} element={<div>Student Home</div>} />
            <Route path={ROUTES.PLATFORM_TENANTS} element={<div>Platform Tenants Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    ),
  };
};

describe('LoginPage Comprehensive Test Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tenantHostname.isPlatformHostname.mockReturnValue(false);
    tenantHostname.tenantSlugFromHostname.mockReturnValue('lms');
  });

  // ─── 1. Form Validation Cases ──────────────────────────────────────────────

  it('TestCase 1: Blocks submission and shows validation error when fields are empty', async () => {
    renderLoginPage();
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Missing Required Fields')).toBeInTheDocument();
    expect(screen.getByText(/please enter both your email address and password/i)).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('TestCase 2: Blocks submission when password is empty', async () => {
    renderLoginPage();
    const emailInput = screen.getByPlaceholderText(/enter your email address/i);
    await userEvent.type(emailInput, 'admin@lms.local');

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Missing Required Fields')).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('TestCase 3: Blocks submission when email is whitespace-only', async () => {
    renderLoginPage();
    const emailInput = screen.getByPlaceholderText(/enter your email address/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    await userEvent.type(emailInput, '   ');
    await userEvent.type(passwordInput, 'SomePassword123!');

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Missing Required Fields')).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  // ─── 2. Workspace / Tenant Cases ───────────────────────────────────────────

  it('TestCase 4: Shows workspace required when tenant slug is missing from hostname', async () => {
    tenantHostname.tenantSlugFromHostname.mockReturnValue(null);
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText(/enter your email address/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.type(passwordInput, 'Password123!');

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Workspace Required')).toBeInTheDocument();
    expect(screen.getByText(/please open your specific workspace url/i)).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('TestCase 5: Displays Workspace Not Found when backend returns 404', async () => {
    authService.login.mockRejectedValue({
      response: {
        status: 404,
        data: { message: 'Tenant not found' },
      },
    });

    renderLoginPage();
    await userEvent.type(screen.getByPlaceholderText(/enter your email address/i), 'user@unknown.com');
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Workspace Not Found')).toBeInTheDocument();
      expect(screen.getByText(/this learning workspace does not exist/i)).toBeInTheDocument();
    });
  });

  it('TestCase 6: Displays Workspace Inactive when backend returns 403 tenant inactive', async () => {
    authService.login.mockRejectedValue({
      response: {
        status: 403,
        data: { message: 'Tenant is not active' },
      },
    });

    renderLoginPage();
    await userEvent.type(screen.getByPlaceholderText(/enter your email address/i), 'admin@lms.local');
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Workspace Inactive')).toBeInTheDocument();
      expect(screen.getByText(/tenant is not active/i)).toBeInTheDocument();
    });
  });

  // ─── 3. Credentials & Account Status Cases ─────────────────────────────────

  it('TestCase 7: Displays Invalid Credentials on 401 response and preserves input', async () => {
    authService.login.mockRejectedValue({
      response: {
        status: 401,
        data: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      },
    });

    renderLoginPage();
    const emailInput = screen.getByPlaceholderText(/enter your email address/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    await userEvent.type(emailInput, 'wrong@lms.local');
    await userEvent.type(passwordInput, 'WrongPass123!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Invalid Credentials')).toBeInTheDocument();
      expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument();
      // Verify inputs are preserved
      expect(emailInput).toHaveValue('wrong@lms.local');
      expect(passwordInput).toHaveValue('WrongPass123!');
    });
  });

  it('TestCase 8: Displays Account Locked or Disabled on 403 ACCOUNT_DISABLED', async () => {
    authService.login.mockRejectedValue({
      response: {
        status: 403,
        data: { code: 'ACCOUNT_DISABLED', message: 'This account is locked. Contact an administrator.' },
      },
    });

    renderLoginPage();
    await userEvent.type(screen.getByPlaceholderText(/enter your email address/i), 'locked@lms.local');
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'SecretPass!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Account Locked or Disabled')).toBeInTheDocument();
      expect(screen.getByText(/this account is locked. contact an administrator./i)).toBeInTheDocument();
    });
  });

  // ─── 4. Server & Network Problem Cases ─────────────────────────────────────

  it('TestCase 9: Displays Backend Server Problem on 500 error', async () => {
    authService.login.mockRejectedValue({
      response: {
        status: 500,
        data: { message: 'Internal server error' },
      },
    });

    renderLoginPage();
    await userEvent.type(screen.getByPlaceholderText(/enter your email address/i), 'admin@lms.local');
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'Admin123!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Backend Server Problem')).toBeInTheDocument();
      expect(screen.getByText(/a backend server error occurred while processing your request/i)).toBeInTheDocument();
    });
  });

  it('TestCase 10: Displays temporary unavailability on 503 service error', async () => {
    authService.login.mockRejectedValue({
      response: {
        status: 503,
        data: {},
      },
    });

    renderLoginPage();
    await userEvent.type(screen.getByPlaceholderText(/enter your email address/i), 'admin@lms.local');
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'Admin123!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Backend Server Problem')).toBeInTheDocument();
      expect(screen.getByText(/temporarily unavailable or restarting/i)).toBeInTheDocument();
    });
  });

  it('TestCase 11: Displays Server Connection Failed on network error (ERR_NETWORK)', async () => {
    authService.login.mockRejectedValue({
      code: 'ERR_NETWORK',
      message: 'Network Error',
    });

    renderLoginPage();
    await userEvent.type(screen.getByPlaceholderText(/enter your email address/i), 'admin@lms.local');
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'Admin123!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Server Connection Failed')).toBeInTheDocument();
      expect(screen.getByText(/unable to connect to the backend server/i)).toBeInTheDocument();
    });
  });

  it('TestCase 12: Displays Too Many Attempts on 429 rate limit response', async () => {
    authService.login.mockRejectedValue({
      response: {
        status: 429,
        data: {},
      },
    });

    renderLoginPage();
    await userEvent.type(screen.getByPlaceholderText(/enter your email address/i), 'admin@lms.local');
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'Admin123!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Too Many Attempts')).toBeInTheDocument();
      expect(screen.getByText(/too many sign-in attempts/i)).toBeInTheDocument();
    });
  });

  // ─── 5. UI Interaction Cases ───────────────────────────────────────────────

  it('TestCase 13: Toggles password visibility when eye icon is clicked', async () => {
    renderLoginPage();
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    await userEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    const hideBtn = screen.getByRole('button', { name: /hide password/i });
    await userEvent.click(hideBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('TestCase 14: Dismisses error banner when X button is clicked', async () => {
    renderLoginPage();
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    const dismissBtn = screen.getByRole('button', { name: /dismiss error/i });
    await userEvent.click(dismissBtn);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('TestCase 15: Auto-dismisses error banner when user edits the email field', async () => {
    renderLoginPage();
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText(/enter your email address/i);
    await userEvent.type(emailInput, 'a');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('TestCase 16: Navigates to reset password screen when Reset password link is clicked', async () => {
    renderLoginPage();
    const resetBtn = screen.getByRole('button', { name: /reset password/i });
    await userEvent.click(resetBtn);

    expect(screen.getByText('Forgot Password Screen')).toBeInTheDocument();
  });

  // ─── 6. Successful Authentication & Navigation Cases ───────────────────────

  it('TestCase 17: Successfully signs in admin user and redirects to /admin/analytics', async () => {
    authService.login.mockResolvedValue({
      tokens: { accessToken: 'mock-access', refreshToken: 'mock-refresh' },
      user: { id: 'admin-1', name: 'Super Admin', email: 'admin@lms.local', roles: ['ADMIN'] },
      mustChangePassword: false,
    });
    authService.getCurrentUser.mockResolvedValue({
      user: { id: 'admin-1', name: 'Super Admin', email: 'admin@lms.local' },
      roles: ['ADMIN'],
      permissions: ['USER_READ'],
    });

    renderLoginPage();
    await userEvent.type(screen.getByPlaceholderText(/enter your email address/i), 'admin@lms.local');
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'Admin123!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('TestCase 18: Successfully signs in student user and redirects to student home', async () => {
    authService.login.mockResolvedValue({
      tokens: { accessToken: 'mock-access', refreshToken: 'mock-refresh' },
      user: { id: 'stud-1', name: 'Student One', email: 'student@lms.local', roles: ['STUDENT'] },
      mustChangePassword: false,
    });
    authService.getCurrentUser.mockResolvedValue({
      user: { id: 'stud-1', name: 'Student One', email: 'student@lms.local' },
      roles: ['STUDENT'],
      permissions: [],
    });

    renderLoginPage();
    await userEvent.type(screen.getByPlaceholderText(/enter your email address/i), 'student@lms.local');
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'Student123!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Student Home')).toBeInTheDocument();
    });
  });

  it('TestCase 19: Platform control plane login on platform hostname delegates to platformService and redirects', async () => {
    tenantHostname.isPlatformHostname.mockReturnValue(true);
    tenantHostname.tenantSlugFromHostname.mockReturnValue(null);
    platformService.login.mockResolvedValue({
      accessToken: 'platform-access-token',
    });

    renderLoginPage();
    await userEvent.type(screen.getByPlaceholderText(/enter your email address/i), 'platform@admin.local');
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'Platform123!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(platformService.login).toHaveBeenCalledWith({
        email: 'platform@admin.local',
        password: 'Platform123!',
        rememberMe: false,
      });
      expect(screen.getByText('Platform Tenants Dashboard')).toBeInTheDocument();
    });
  });
});
