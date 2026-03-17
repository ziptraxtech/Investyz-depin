export const getFrontendApiUrl = () => {
  const configuredUrl = process.env.REACT_APP_BACKEND_URL?.trim();
  if (!configuredUrl) {
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
