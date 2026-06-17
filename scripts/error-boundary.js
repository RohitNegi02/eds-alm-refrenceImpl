/**
 * Error Boundary Utility for EDS Blocks
 * Provides consistent error handling and user feedback across all blocks
 */

class BlockError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = 'BlockError';
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Check if access token exists and is valid
 * @returns {boolean} True if token exists
 */
function hasValidToken() {
  const token = sessionStorage.getItem('alm_access_token');
  return token && token.trim() !== '';
}

/**
 * Redirect user to login/OAuth flow
 * Clears session storage and triggers OAuth
 */
function redirectToLogin() {
  // Clear all ALM session data
  sessionStorage.removeItem('alm_access_token');
  sessionStorage.removeItem('alm_refresh_token');
  sessionStorage.removeItem('alm_user_id');
  sessionStorage.removeItem('alm_user_role');
  sessionStorage.removeItem('alm_account_id');
  
  // Store current URL to return after login
  sessionStorage.setItem('alm_return_url', window.location.href);
  
  // Trigger OAuth flow
  const envConfig = window.envConfig;
  if (envConfig && envConfig.almAuthEndpoint && envConfig.almClientId) {
    const redirectUri = window.location.origin + window.location.pathname;
    const scope = 'learner:read,learner:write';
    
    const authUrl = new URL(envConfig.almAuthEndpoint);
    authUrl.searchParams.set('client_id', envConfig.almClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('account', envConfig.almAccount);
    
    // Redirect to login
    window.location.href = authUrl.toString();
  } else {
    // Fallback: just reload the page (OAuth will trigger)
    window.location.reload();
  }
}

/**
 * Creates an error boundary wrapper for block rendering
 * @param {HTMLElement} block - The block element to wrap
 * @param {Object} options - Configuration options
 * @param {string} options.blockName - Name of the block for error reporting
 * @param {string} options.fallbackMessage - Custom message to display on error
 * @param {boolean} options.showRetry - Whether to show retry button (default: true)
 * @param {Function} options.onError - Custom error handler callback
 * @returns {Object} Error boundary interface
 */
export function createErrorBoundary(block, options = {}) {
  const {
    blockName = 'Block',
    fallbackMessage = 'An error occurred while loading this content',
    showRetry = true,
    onError = null
  } = options;

  /**
   * Renders error state in the block
   */
  function renderError(error, userMessage = fallbackMessage) {
    // Call custom error handler if provided
    if (onError && typeof onError === 'function') {
      try {
        onError(error);
      } catch (handlerError) {
        // Error handler failed silently
      }
    }

    const errorId = `error-${Date.now()}`;
    
    block.innerHTML = `
      <div class="error-boundary" role="alert" aria-live="assertive">
        <div class="error-boundary-content">
          <div class="error-icon" aria-hidden="true">⚠️</div>
          <h3 class="error-title">Oops! Something went wrong</h3>
          <p class="error-message">${userMessage}</p>
          ${error.code ? `<p class="error-code">Error Code: ${error.code}</p>` : ''}
          ${showRetry ? `
            <button class="error-retry-btn" onclick="location.reload()">
              Reload Page
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // Add inline styles if not already present
    if (!document.querySelector('#error-boundary-styles')) {
      const style = document.createElement('style');
      style.id = 'error-boundary-styles';
      style.textContent = `
        .error-boundary {
          padding: 40px 20px;
          text-align: center;
          background: #fff;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .error-boundary-content {
          max-width: 500px;
          margin: 0 auto;
        }
        
        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .error-title {
          font-size: 24px;
          font-weight: 600;
          color: #d32f2f;
          margin: 0 0 12px 0;
        }
        
        .error-message {
          font-size: 16px;
          color: #666;
          margin: 0 0 16px 0;
          line-height: 1.5;
        }
        
        .error-code {
          font-size: 12px;
          color: #999;
          font-family: monospace;
          margin: 8px 0;
        }
        
        .error-retry-btn {
          background: #1976d2;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .error-retry-btn:hover {
          background: #1565c0;
        }
        
        .error-retry-btn:active {
          background: #0d47a1;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Renders loading state
   */
  function renderLoading(message = 'Loading...') {
    block.innerHTML = `
      <div class="loading-state" role="status" aria-live="polite">
        <div class="loading-spinner" aria-hidden="true"></div>
        <p class="loading-message">${message}</p>
      </div>
    `;

    // Add loading styles if not already present
    if (!document.querySelector('#loading-state-styles')) {
      const style = document.createElement('style');
      style.id = 'loading-state-styles';
      style.textContent = `
        .loading-state {
          text-align: center;
          padding: 40px 20px;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto 16px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #1976d2;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-message {
          color: #666;
          font-size: 16px;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Wraps an async function with error handling
   * @param {Function} renderFn - The async function to execute
   * @param {string} loadingMessage - Optional loading message
   */
  async function render(renderFn, loadingMessage = 'Loading...') {
    try {
      // Check if user has valid token before rendering
      if (!hasValidToken()) {
        redirectToLogin();
        return;
      }
      
      // Show loading state
      renderLoading(loadingMessage);
      
      // Execute the render function
      await renderFn();
      
    } catch (error) {
      // Determine error type and user-friendly message
      let userMessage = fallbackMessage;
      let errorCode = 'UNKNOWN_ERROR';
      let shouldRedirectToLogin = false;
      
      if (error instanceof BlockError) {
        userMessage = error.message;
        errorCode = error.code;
        // Check if it's an auth error
        if (errorCode === 'AUTH_ERROR') {
          shouldRedirectToLogin = true;
        }
      } else if (error.name === 'TypeError') {
        userMessage = 'A technical error occurred. Please try again later.';
        errorCode = 'TYPE_ERROR';
      } else if (error.message.includes('fetch')) {
        userMessage = 'Unable to connect to the server. Please check your connection and try again.';
        errorCode = 'NETWORK_ERROR';
      } else if (error.message.includes('401') || error.message.includes('403') || 
                 error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        userMessage = 'Your session has expired. Redirecting to login...';
        errorCode = 'AUTH_ERROR';
        shouldRedirectToLogin = true;
      } else if (error.message.includes('404')) {
        userMessage = 'The requested content could not be found.';
        errorCode = 'NOT_FOUND';
      }
      
      // If it's an auth error, redirect to login after short delay
      if (shouldRedirectToLogin) {
        // Show brief message before redirect
        block.innerHTML = `
          <div class="auth-redirect" role="alert" aria-live="assertive">
            <div class="auth-redirect-content">
              <div class="auth-icon" aria-hidden="true">🔒</div>
              <h3 class="auth-title">Session Expired</h3>
              <p class="auth-message">Your session has expired. Redirecting to login...</p>
              <div class="auth-spinner"></div>
            </div>
          </div>
        `;
        
        // Add styles for redirect message
        if (!document.querySelector('#auth-redirect-styles')) {
          const style = document.createElement('style');
          style.id = 'auth-redirect-styles';
          style.textContent = `
            .auth-redirect {
              padding: 40px 20px;
              text-align: center;
              background: #fff;
              border-radius: 8px;
              margin: 20px 0;
            }
            
            .auth-redirect-content {
              max-width: 400px;
              margin: 0 auto;
            }
            
            .auth-icon {
              font-size: 48px;
              margin-bottom: 16px;
            }
            
            .auth-title {
              font-size: 24px;
              font-weight: 600;
              color: #1976d2;
              margin: 0 0 12px 0;
            }
            
            .auth-message {
              font-size: 16px;
              color: #666;
              margin: 0 0 24px 0;
            }
            
            .auth-spinner {
              width: 32px;
              height: 32px;
              margin: 0 auto;
              border: 3px solid #f3f3f3;
              border-top: 3px solid #1976d2;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
          `;
          document.head.appendChild(style);
        }
        
        // Redirect after 2 seconds
        setTimeout(() => {
          redirectToLogin();
        }, 2000);
        
        return;
      }
      
      // Wrap error if not already a BlockError
      const wrappedError = error instanceof BlockError 
        ? error 
        : new BlockError(userMessage, errorCode, error);
      
      // Render error state
      renderError(wrappedError, userMessage);
    }
  }

  /**
   * Wraps a synchronous function with error handling
   * @param {Function} fn - The function to execute
   */
  function renderSync(fn) {
    try {
      fn();
    } catch (error) {
      const wrappedError = error instanceof BlockError 
        ? error 
        : new BlockError(fallbackMessage, 'SYNC_ERROR', error);
      renderError(wrappedError);
    }
  }

  return {
    render,
    renderSync,
    renderError,
    renderLoading,
    BlockError
  };
}

/**
 * Creates a BlockError with specific error code
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Error} originalError - Original error object
 */
export function createBlockError(message, code, originalError = null) {
  return new BlockError(message, code, originalError);
}

/**
 * Default export
 */
export default {
  createErrorBoundary,
  createBlockError,
  BlockError
};
