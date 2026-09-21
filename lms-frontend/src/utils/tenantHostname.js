const normalize = (value) => value?.trim().toLowerCase().replace(/\.$/, '') ?? '';

const configuredBaseDomain = () => normalize(import.meta.env.VITE_TENANT_BASE_DOMAIN);

/**
 * Resolves a tenant from its workspace hostname. Local development uses
 * <tenant>.localhost and deployment uses <tenant>.<VITE_TENANT_BASE_DOMAIN>.
 */
export const tenantSlugFromHostname = (hostname = window.location.hostname) => {
  const host = normalize(hostname);
  const baseDomain = configuredBaseDomain();
  const suffix = baseDomain ? `.${baseDomain}` : '.localhost';

  if (!host.endsWith(suffix)) return null;
  const slug = host.slice(0, -suffix.length);
  return slug && !slug.includes('.') && slug !== 'platform' ? slug : null;
};

/** The platform control plane is intentionally isolated from tenant workspaces. */
export const isPlatformHostname = (hostname = window.location.hostname) => {
  const host = normalize(hostname);
  const baseDomain = configuredBaseDomain() || 'localhost';
  return host === `platform.${baseDomain}` || window.location.pathname.startsWith('/platform');
};
