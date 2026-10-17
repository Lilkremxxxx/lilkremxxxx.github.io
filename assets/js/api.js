// API base + fetch helper shared by the public site and admin.
// Local work only: ?api=http://localhost:8787 (remembered for the tab). Ignored on the real site so a
// crafted link can never point the admin login at someone else's server.

const PRODUCTION_API = 'https://blog-api.verbaa.pp.ua';
const IS_LOCAL_PAGE = ['localhost', '127.0.0.1'].includes(window.location.hostname);

function resolveApiBase() {
  if (!IS_LOCAL_PAGE) return PRODUCTION_API;
  try {
    const fromQuery = new URLSearchParams(window.location.search).get('api');
    if (fromQuery) sessionStorage.setItem('api_base', fromQuery);
    return (fromQuery || sessionStorage.getItem('api_base') || PRODUCTION_API).replace(/\/$/, '');
  } catch (_error) {
    return PRODUCTION_API;
  }
}

export const API_BASE = resolveApiBase();

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch(path, { method = 'GET', body, token, signal, timeoutMs = 12000 } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  signal?.addEventListener('abort', () => controller.abort());

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal
    });
  } catch (error) {
    throw new ApiError(0, error.name === 'AbortError' ? 'The server took too long to respond' : 'Cannot reach the server');
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) return null;
  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    // Non-JSON body; fall through to the status-based message.
  }
  if (!response.ok) throw new ApiError(response.status, payload?.error || `Request failed (HTTP ${response.status})`);
  return payload;
}
