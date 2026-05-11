export const getFrontendApiUrl = () => {
  const configuredUrl = process.env.REACT_APP_BACKEND_URL?.trim();
  if (!configuredUrl) {
    if (typeof window !== 'undefined') {
      const localHosts = ['localhost', '127.0.0.1', '::1'];
      if (localHosts.includes(window.location.hostname)) {
        return 'http://localhost:8001';
      }
    }

    return '';
  }

  try {
    const parsedUrl = new URL(configuredUrl);
    const isLocalBackend = ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname);
    const isLocalFrontend = ['localhost', '127.0.0.1'].includes(window.location.hostname);

    if (isLocalBackend && !isLocalFrontend) {
      return '';
    }

    return configuredUrl.replace(/\/+$/, '');
  } catch {
    return configuredUrl.replace(/\/+$/, '');
  }
};
