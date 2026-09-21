import { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Lock, Building2, ServerOff, WifiOff, ShieldAlert, X } from 'lucide-react';

const GlassInputWrapper = ({ children }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }) => (
  <div
    className={`animate-testimonial ${delay} flex w-64 items-start gap-3 rounded-3xl border border-white/10 bg-card/40 p-5 backdrop-blur-xl dark:bg-zinc-800/40`}
  >
    <img src={testimonial.avatarSrc} className="h-10 w-10 rounded-2xl object-cover" alt="" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-muted-foreground">{testimonial.handle}</p>
      <p className="mt-1 text-foreground/80">{testimonial.text}</p>
    </div>
  </div>
);

const renderErrorIcon = (type) => {
  const iconClasses = 'h-5 w-5 shrink-0';
  switch (type) {
    case 'CREDENTIALS':
      return <AlertCircle className={`${iconClasses} text-red-500 dark:text-red-400`} />;
    case 'ACCOUNT_LOCKED':
      return <Lock className={`${iconClasses} text-amber-500 dark:text-amber-400`} />;
    case 'TENANT_NOT_FOUND':
    case 'TENANT_INACTIVE':
      return <Building2 className={`${iconClasses} text-orange-500 dark:text-orange-400`} />;
    case 'SERVER_ERROR':
      return <ServerOff className={`${iconClasses} text-red-500 dark:text-red-400`} />;
    case 'NETWORK_ERROR':
      return <WifiOff className={`${iconClasses} text-rose-500 dark:text-rose-400`} />;
    case 'RATE_LIMIT':
      return <ShieldAlert className={`${iconClasses} text-amber-500 dark:text-amber-400`} />;
    default:
      return <AlertCircle className={`${iconClasses} text-red-500 dark:text-red-400`} />;
  }
};

export const SignInPage = ({
  title = <span className="font-light tracking-tighter text-foreground">Welcome</span>,
  description = 'Access your account and continue your journey with us',
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onResetPassword,
  error,
  errorMessage,
  onDismissError,
  isSubmitting = false,
  showTenantSlug = false,
  tenantSlugHint = 'Select the tenant workspace you want to access.',
  demoLogin = null,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const errorDetails =
    error && typeof error === 'object'
      ? {
          title: error.title || 'Sign In Failed',
          message: error.message || errorMessage || 'An error occurred during sign in.',
          type: error.type || 'UNKNOWN',
        }
      : (typeof error === 'string' && error) || errorMessage
        ? {
            title: 'Sign In Failed',
            message: typeof error === 'string' ? error : errorMessage,
            type: 'UNKNOWN',
          }
        : null;

  return (
    <div className="flex min-h-[100dvh] w-full flex-col font-sans md:fixed md:inset-0 md:h-[100dvh] md:min-h-0 md:flex-row md:overflow-hidden">
      <section className="flex flex-1 items-center justify-center p-8 md:overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl font-semibold leading-tight md:text-5xl">
              {title}
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>
            <form className="space-y-5" onSubmit={onSignIn} noValidate>
              {errorDetails && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="animate-element flex items-start gap-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 backdrop-blur-md dark:border-red-500/25 dark:bg-red-950/40 text-left transition-all duration-200"
                >
                  <div className="mt-0.5">{renderErrorIcon(errorDetails.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                      {errorDetails.title}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-red-700 dark:text-red-300/90 leading-relaxed break-words">
                      {errorDetails.message}
                    </p>
                  </div>
                  {onDismissError && (
                    <button
                      type="button"
                      onClick={onDismissError}
                      className="rounded-lg p-1 text-red-600 hover:bg-red-500/20 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-500/20 dark:hover:text-red-200 transition-colors"
                      aria-label="Dismiss error"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
              <div className="animate-element animate-delay-300">
                <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                  Email Address
                </label>
                <GlassInputWrapper>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="Enter your email address"
                    onChange={() => onDismissError?.()}
                    className="w-full rounded-2xl bg-transparent p-4 text-sm focus:outline-none"
                  />
                </GlassInputWrapper>
              </div>
              <div className="animate-element animate-delay-400">
                <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                  Password
                </label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      placeholder="Enter your password"
                      onChange={() => onDismissError?.()}
                      className="w-full rounded-2xl bg-transparent p-4 pr-12 text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>
              {showTenantSlug && (
                <div className="animate-element animate-delay-500">
                  <label htmlFor="tenantSlug" className="text-sm font-medium text-muted-foreground">
                    Tenant slug <span className="font-normal">(optional)</span>
                  </label>
                  <GlassInputWrapper>
                    <input
                      id="tenantSlug"
                      name="tenantSlug"
                      type="text"
                      autoComplete="organization"
                      placeholder="for example: acme-learning"
                      className="w-full rounded-2xl bg-transparent p-4 text-sm focus:outline-none"
                    />
                  </GlassInputWrapper>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{tenantSlugHint}</p>
                </div>
              )}
              <div className="animate-element animate-delay-600 flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-3">
                  <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                  <span className="text-foreground/90">Keep me signed in</span>
                </label>
                <button
                  type="button"
                  onClick={onResetPassword}
                  className="text-violet-500 transition-colors hover:underline"
                >
                  Reset password
                </button>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="animate-element animate-delay-700 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            {demoLogin?.options?.length > 0 && (
              <div className="animate-element animate-delay-800 space-y-3 border-t border-border pt-6">
                <div>
                  <p className="text-sm font-medium text-foreground">Demo access</p>
                  {demoLogin.hint && (
                    <p className="mt-1 text-xs text-muted-foreground">{demoLogin.hint}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {demoLogin.options.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => demoLogin.onSelect?.(key)}
                      className="rounded-xl border border-border bg-foreground/5 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-violet-400/70 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      {heroImageSrc && (
        <section className="relative hidden flex-1 p-4 md:block">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          />
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 flex w-full -translate-x-1/2 justify-center gap-4 px-8">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && (
                <div className="hidden xl:flex">
                  <TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" />
                </div>
              )}
              {testimonials[2] && (
                <div className="hidden 2xl:flex">
                  <TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default SignInPage;
