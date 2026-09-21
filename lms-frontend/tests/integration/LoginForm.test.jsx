import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../src/features/auth/store/authSlice';
import LoginForm from '../../src/features/auth/components/LoginForm';
import authService from '../../src/features/auth/services/authService';

vi.mock('../../src/features/auth/services/authService', () => ({
  default: { login: vi.fn() },
}));

vi.mock('../../src/utils/tenantHostname', () => ({
  isPlatformHostname: () => false,
  tenantSlugFromHostname: () => 'lms',
}));

const renderForm = () => {
  const store = configureStore({ reducer: { auth: authReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    </Provider>,
  );
};

describe('LoginForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('blocks submission and shows validation errors for an empty form', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('submits valid credentials to the auth service', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: '1', roles: ['STUDENT'] },
    });

    renderForm();
    await userEvent.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Str0ng!Passw0rd');
    await userEvent.type(screen.getByLabelText(/tenant slug/i), 'lms');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'ada@example.com', password: 'Str0ng!Passw0rd' }),
      );
    });
  });
});
