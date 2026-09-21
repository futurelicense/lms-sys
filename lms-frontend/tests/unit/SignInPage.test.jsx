import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignInPage } from '../../src/components/ui/sign-in';

describe('SignInPage Error Display', () => {
  it('renders structured error object with title and message', () => {
    const error = {
      title: 'Invalid Credentials',
      message: 'Incorrect email or password. Please verify your details.',
      type: 'CREDENTIALS',
    };

    render(<SignInPage error={error} onSignIn={() => {}} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Invalid Credentials')).toBeInTheDocument();
    expect(
      screen.getByText('Incorrect email or password. Please verify your details.'),
    ).toBeInTheDocument();
  });

  it('renders string errorMessage as fallback', () => {
    render(<SignInPage errorMessage="Backend connection failed" onSignIn={() => {}} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Backend connection failed')).toBeInTheDocument();
  });

  it('renders server error category properly', () => {
    const error = {
      title: 'Backend Server Problem',
      message: 'A backend server error occurred while processing your request.',
      type: 'SERVER_ERROR',
    };

    render(<SignInPage error={error} onSignIn={() => {}} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Backend Server Problem')).toBeInTheDocument();
  });

  it('calls onDismissError when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    const error = {
      title: 'Sign In Failed',
      message: 'Some error',
      type: 'UNKNOWN',
    };

    render(<SignInPage error={error} onDismissError={onDismiss} onSignIn={() => {}} />);

    const dismissBtn = screen.getByRole('button', { name: /dismiss error/i });
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render alert when error is null', () => {
    render(<SignInPage error={null} errorMessage={null} onSignIn={() => {}} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
