// Helper functions for OAuth flow
const envConfig = window.envConfig;

function startOAuthFlow() {
  const redirectUri = window.location.origin + window.location.pathname;
  const scope = 'learner:read,learner:write';

  if (!envConfig.almClientId) {
    // OAuth error: Client ID is required
    return;
  }

  const authUrl = new URL(envConfig.almAuthEndpoint);
  authUrl.searchParams.set('client_id', envConfig.almClientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('account', envConfig.almAccount);

  // Redirect to Adobe Learning Manager OAuth
  window.location.href = authUrl.toString();
}

async function exchangeCodeForToken(code, config) {
  try {
    const redirectUri = config.redirect_uri || window.location.origin + window.location.pathname;

    // Create URL with query parameters
    const authUrl = new URL(envConfig.adobeIOAlmEndpoint);
    authUrl.searchParams.set('code', code);
    authUrl.searchParams.set('redirect_uri', redirectUri);

    const response = await fetch(authUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const tokenResponse = await response.json();

    // Store the access token
    sessionStorage.setItem('alm_access_token', tokenResponse.access_token);
    if (tokenResponse.refresh_token) {
      sessionStorage.setItem('alm_refresh_token', tokenResponse.refresh_token);
    }
    if (tokenResponse.user_id) {
      sessionStorage.setItem('alm_user_id', tokenResponse.user_id);
    }
    if (tokenResponse.user_role) {
      sessionStorage.setItem('alm_user_role', tokenResponse.user_role);
    }
    if (tokenResponse.account_id) {
      sessionStorage.setItem('alm_account_id', tokenResponse.account_id);
    }

    // Authentication successful

    // Remove code parameter from URL and reload to clean up
    const url = new URL(window.location);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('PRIME_BASE');
    window.location.href = url.toString();
  } catch (error) {
    // Failed to get access token - handle silently
  }
}

// Initialize OAuth on page load
export function initOAuth() {
  // Check if we have an authorization code in URL
  const urlParams = new URLSearchParams(window.location.search);
  const authCode = urlParams.get('code');
  const error = urlParams.get('error');

  if (error) {
    // OAuth Error occurred - handle silently
    return;
  }

  if (authCode) {
    // We have an auth code, exchange it for access token
    exchangeCodeForToken(authCode, {});
  } else {
    // Check if we already have a valid token
    const existingToken = sessionStorage.getItem('alm_access_token');
    if (!existingToken) {
      // Automatically start OAuth flow
      setTimeout(() => {
        startOAuthFlow();
      }, 1000);
    }
  }
}

export default function decorate(block) {
  // Get configuration from block content
  const config = {};
  const rows = block.querySelectorAll(':scope > div');

  rows.forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase().replace(/\s+/g, '_');
      const value = cells[1].textContent.trim();
      config[key] = value;
    }
  });

  // Clear the block content - no HTML should be rendered
  block.innerHTML = '';
  block.style.display = 'none';

  // Check if we have an authorization code in URL
  const urlParams = new URLSearchParams(window.location.search);
  const authCode = urlParams.get('code');
  const error = urlParams.get('error');

  if (error) {
    // OAuth Error occurred - handle silently
    return;
  }

  if (authCode) {
    // We have an auth code, exchange it for access token
    exchangeCodeForToken(authCode, config);
  } else {
    // Check if we already have a valid token
    const existingToken = sessionStorage.getItem('alm_access_token');
    if (!existingToken) {
      // Automatically start OAuth flow
      setTimeout(() => {
        startOAuthFlow();
      }, 1000);
    }
  }
}
