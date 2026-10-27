import crypto from 'crypto';
import { Request, Response } from 'express';
import { validateApiKey } from '../middleware/apiKeyAuth';

interface AuthCodeData {
  userId: string;
  apiKey: string;
  clientId?: string;
  redirectUri?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  resource?: string;
  expiresAt: number;
}

interface DynamicClientData {
  clientId: string;
  clientSecret?: string;
  clientName?: string;
  redirectUris?: string[];
  grantTypes?: string[];
  responseTypes?: string[];
  tokenEndpointAuthMethod?: string;
  createdAt: number;
}

const authCodes = new Map<string, AuthCodeData>();
const dynamicClients = new Map<string, DynamicClientData>();

// Periodic cleanup of expired auth codes
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of authCodes.entries()) {
    if (now > data.expiresAt) {
      authCodes.delete(code);
    }
  }
}, 60 * 1000).unref();

export const getBaseUrl = (req: Request): string => {
  const host = req.get('host') || 'swiftspend-api.vercel.app';
  const proto = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return `${proto}://${host}`;
};

export const verifyCodeVerifier = (
  codeVerifier: string,
  codeChallenge: string,
  method: string = 'S256'
): boolean => {
  if (!codeChallenge) return true; // If no challenge was registered, no check needed
  if (!codeVerifier) return false;

  if (method === 'plain') {
    return codeVerifier === codeChallenge;
  }

  // S256 standard PKCE: BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
  const hash = crypto.createHash('sha256').update(codeVerifier, 'ascii').digest('base64url');
  return hash === codeChallenge;
};

export const renderAuthorizePage = (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);

  const clientId = (req.query.client_id as string) || '';
  const redirectUri = (req.query.redirect_uri as string) || '';
  const state = (req.query.state as string) || '';
  const responseType = (req.query.response_type as string) || 'code';
  const codeChallenge = (req.query.code_challenge as string) || '';
  const codeChallengeMethod = (req.query.code_challenge_method as string) || 'S256';
  const resource = (req.query.resource as string) || '';

  const clientName = clientId.toLowerCase().includes('chatgpt')
    ? 'ChatGPT'
    : clientId.toLowerCase().includes('gemini')
    ? 'Google Gemini'
    : clientId.toLowerCase().includes('codex')
    ? 'Codex'
    : clientId.toLowerCase().includes('cursor')
    ? 'Cursor'
    : (req.query.app_name as string) || (clientId ? clientId : 'AI Assistant (Gemini / ChatGPT / Codex)');

  const isOAuthFlow = Boolean(redirectUri);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Authorize ${clientName} - SwiftSpend</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f293d;
      --text-main: #f9fafb;
      --text-muted: #9ca3af;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --accent: #10b981;
      --danger: #ef4444;
      --input-bg: #0b1120;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: radial-gradient(circle at 50% 0%, #1e293b 0%, var(--bg) 75%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .container {
      width: 100%;
      max-width: 580px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 36px 32px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
    }
    .header {
      text-align: center;
      margin-bottom: 28px;
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.2);
      padding: 8px 16px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 14px;
      color: #60a5fa;
      margin-bottom: 16px;
    }
    .title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.5;
    }
    .assistant-pill {
      color: #93c5fd;
      font-weight: 600;
    }
    .permissions-box {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 18px 20px;
      margin-bottom: 24px;
    }
    .permissions-title {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 12px;
      font-weight: 700;
    }
    .perm-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      color: #e2e8f0;
      margin-bottom: 10px;
    }
    .perm-item:last-child { margin-bottom: 0; }
    .perm-icon {
      color: var(--accent);
      font-size: 16px;
      line-height: 1;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #e5e7eb;
      margin-bottom: 8px;
    }
    input[type="text"], input[type="password"] {
      width: 100%;
      background: var(--input-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 14px 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      color: #f3f4f6;
      outline: none;
      transition: all 0.2s;
    }
    input[type="text"]:focus, input[type="password"]:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px 20px;
      font-size: 15px;
      font-weight: 700;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      transform: translateY(-1px);
    }
    .btn-outline {
      background: transparent;
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      margin-top: 10px;
    }
    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
    }
    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      background: rgba(11, 17, 32, 0.8);
      padding: 4px;
      border-radius: 12px;
      border: 1px solid var(--card-border);
    }
    .tab {
      flex: 1;
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      border-radius: 8px;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 0.2s;
    }
    .tab.active {
      background: var(--card-bg);
      color: white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    }
    .code-box {
      background: #0b1120;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 12px 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #93c5fd;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      word-break: break-all;
    }
    .copy-btn {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #93c5fd;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      margin-left: 8px;
    }
    .copy-btn:hover { background: rgba(59, 130, 246, 0.3); }
    .alert {
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13px;
      margin-bottom: 18px;
      display: none;
    }
    .alert-error {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }
    .alert-success {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #86efac;
    }
    .footer {
      margin-top: 24px;
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
    }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>

  <div class="container">
    <div class="header">
      <div class="logo-badge">
        <span>⚡ SwiftSpend</span>
        <span>•</span>
        <span>Remote MCP & AI Auth</span>
      </div>
      <h1 class="title">${isOAuthFlow ? `Authorize ${clientName}` : 'AI Authorization Portal'}</h1>
      <p class="subtitle">
        ${
          isOAuthFlow
            ? `Grant <span class="assistant-pill">${clientName}</span> secure access to your SwiftSpend account.`
            : 'Authorize and connect ChatGPT, Google Gemini, Codex, or Cursor to SwiftSpend with one click.'
        }
      </p>
    </div>

    <div class="permissions-box">
      <div class="permissions-title">Requested Capabilities</div>
      <div class="perm-item">
        <span class="perm-icon">✓</span>
        <span>Log new expenses with automatic multi-currency rates</span>
      </div>
      <div class="perm-item">
        <span class="perm-icon">✓</span>
        <span>Retrieve expense history and spending summaries</span>
      </div>
      <div class="perm-item">
        <span class="perm-icon">✓</span>
        <span>View active budget categories</span>
      </div>
    </div>

    <div id="alertBox" class="alert"></div>

    <form id="authForm" method="POST" action="/oauth/authorize">
      <input type="hidden" name="client_id" value="${clientId}" />
      <input type="hidden" name="redirect_uri" value="${redirectUri}" />
      <input type="hidden" name="state" value="${state}" />
      <input type="hidden" name="response_type" value="${responseType}" />
      <input type="hidden" name="code_challenge" value="${codeChallenge}" />
      <input type="hidden" name="code_challenge_method" value="${codeChallengeMethod}" />
      <input type="hidden" name="resource" value="${resource}" />

      <div class="form-group">
        <label for="apiKey">SwiftSpend API Key</label>
        <input 
          type="text" 
          id="apiKey" 
          name="api_key" 
          placeholder="sk_live_..." 
          required 
          autocomplete="off"
          spellcheck="false"
        />
        <p style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
          Created in SwiftSpend <strong>Settings → API Keys</strong>.
        </p>
      </div>

      <button type="submit" id="submitBtn" class="btn btn-primary">
        <span>Authorize & Connect with Button</span>
        <span>→</span>
      </button>

      <button type="button" id="testBtn" class="btn btn-outline">
        🔍 Test Connection Live
      </button>
    </form>

    ${
      !isOAuthFlow
        ? `
      <div style="margin-top: 28px;">
        <div class="tabs">
          <div class="tab active" onclick="switchTab('chatgpt')">ChatGPT</div>
          <div class="tab" onclick="switchTab('gemini')">Gemini</div>
          <div class="tab" onclick="switchTab('codex')">Codex / Cursor</div>
        </div>

        <div id="tab-chatgpt" class="tab-content">
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">1. OpenAPI Action Schema URL:</p>
          <div class="code-box">
            <span>${baseUrl}/api/v1/openapi.json</span>
            <button class="copy-btn" onclick="copyText('${baseUrl}/api/v1/openapi.json')">Copy</button>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">2. OAuth Authorization URL:</p>
          <div class="code-box">
            <span>${baseUrl}/oauth/authorize</span>
            <button class="copy-btn" onclick="copyText('${baseUrl}/oauth/authorize')">Copy</button>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">3. OAuth Token URL:</p>
          <div class="code-box">
            <span>${baseUrl}/oauth/token</span>
            <button class="copy-btn" onclick="copyText('${baseUrl}/oauth/token')">Copy</button>
          </div>
        </div>

        <div id="tab-gemini" class="tab-content" style="display:none;">
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">1. Remote MCP Endpoint (Custom Apps in Gemini):</p>
          <div class="code-box">
            <span>${baseUrl}/mcp</span>
            <button class="copy-btn" onclick="copyText('${baseUrl}/mcp')">Copy</button>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">2. Dynamic Registration Endpoint (RFC 7591):</p>
          <div class="code-box">
            <span>${baseUrl}/oauth/register</span>
            <button class="copy-btn" onclick="copyText('${baseUrl}/oauth/register')">Copy</button>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">3. OAuth Authorization Server Metadata:</p>
          <div class="code-box">
            <span>${baseUrl}/.well-known/oauth-authorization-server</span>
            <button class="copy-btn" onclick="copyText('${baseUrl}/.well-known/oauth-authorization-server')">Copy</button>
          </div>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
            Supports Gemini Web & App OAuth redirect (<code style="color:#93c5fd;">https://gemini.google.com/oauth-redirect</code>) with PKCE (S256).
          </p>
        </div>

        <div id="tab-codex" class="tab-content" style="display:none;">
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">Remote MCP SSE Endpoint:</p>
          <div class="code-box">
            <span id="codexSseUrl">${baseUrl}/mcp/sse</span>
            <button class="copy-btn" onclick="copyCodexUrl()">Copy URL</button>
          </div>
          <p style="font-size: 12px; color: var(--text-muted);">
            Paste directly into Cursor or Codex MCP Settings as SSE transport.
          </p>
        </div>
      </div>
      `
        : ''
    }

    <div class="footer">
      Secured by SwiftSpend • <a href="/docs/mcp" target="_blank">Documentation</a>
    </div>
  </div>

  <script>
    // Pre-fill API key from localStorage if user previously entered it
    const storedKey = localStorage.getItem('swiftspend_api_key');
    const inputKey = document.getElementById('apiKey');
    if (storedKey && inputKey) {
      inputKey.value = storedKey;
      updateCodexUrl(storedKey);
    }

    inputKey.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        localStorage.setItem('swiftspend_api_key', val);
        updateCodexUrl(val);
      }
    });

    function updateCodexUrl(key) {
      const el = document.getElementById('codexSseUrl');
      if (el) {
        el.textContent = '${baseUrl}/mcp/sse?apiKey=' + encodeURIComponent(key);
      }
    }

    function switchTab(name) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      const target = document.getElementById('tab-' + name);
      if (target) target.style.display = 'block';
      event.target.classList.add('active');
    }

    function copyText(txt) {
      navigator.clipboard.writeText(txt).then(() => {
        showAlert('Copied to clipboard!', 'success');
      });
    }

    function copyCodexUrl() {
      const key = inputKey.value.trim();
      const url = '${baseUrl}/mcp/sse' + (key ? '?apiKey=' + encodeURIComponent(key) : '');
      copyText(url);
    }

    function showAlert(msg, type) {
      const box = document.getElementById('alertBox');
      box.textContent = msg;
      box.className = 'alert ' + (type === 'error' ? 'alert-error' : 'alert-success');
      box.style.display = 'block';
      setTimeout(() => { box.style.display = 'none'; }, 4000);
    }

    document.getElementById('testBtn').addEventListener('click', async () => {
      const key = inputKey.value.trim();
      if (!key) {
        showAlert('Please enter an API Key first', 'error');
        return;
      }
      showAlert('Testing connection to Remote MCP...', 'success');
      try {
        const res = await fetch('/mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + key
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {}
          })
        });
        const data = await res.json();
        if (data.result) {
          showAlert('Connected successfully! Server: ' + data.result.serverInfo.name + ' v' + data.result.serverInfo.version, 'success');
        } else {
          showAlert('Failed: ' + (data.error?.message || 'Invalid key'), 'error');
        }
      } catch (err) {
        showAlert('Connection error: ' + err.message, 'error');
      }
    });
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};

export const handleOAuthAuthorize = async (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);
  const apiKey = (req.body?.api_key || req.query?.api_key || req.body?.apiKey || req.query?.apiKey || '') as string;
  const redirectUri = (req.body?.redirect_uri || req.query?.redirect_uri || '') as string;
  const state = (req.body?.state || req.query?.state || '') as string;
  const clientId = (req.body?.client_id || req.query?.client_id || '') as string;
  const codeChallenge = (req.body?.code_challenge || req.query?.code_challenge || '') as string;
  const codeChallengeMethod = (req.body?.code_challenge_method || req.query?.code_challenge_method || 'S256') as string;
  const resource = (req.body?.resource || req.query?.resource || '') as string;

  if (!apiKey) {
    return res.status(400).send('API Key is required to authorize');
  }

  const auth = await validateApiKey(apiKey);
  if (!auth) {
    return res.status(401).send('Invalid or revoked API key');
  }

  // Generate 10-minute one-time authorization code
  const code = `code_${crypto.randomBytes(20).toString('hex')}`;
  authCodes.set(code, {
    userId: auth.userId,
    apiKey,
    clientId,
    redirectUri,
    codeChallenge,
    codeChallengeMethod,
    resource,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  if (redirectUri) {
    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.set('code', code);
    // RFC 9207 Issuer Identification for mix-up attack mitigation (mandatory in modern MCP/Gemini)
    redirectUrl.searchParams.set('iss', baseUrl);
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }
    return res.redirect(redirectUrl.toString());
  }

  return res.json({
    success: true,
    message: 'Authorized successfully',
    code,
    state,
    iss: baseUrl,
  });
};

export const handleOAuthToken = async (req: Request, res: Response) => {
  const code = (req.body?.code || req.query?.code) as string;
  const codeVerifier = (req.body?.code_verifier || req.query?.code_verifier || '') as string;
  const grantType = req.body?.grant_type || req.query?.grant_type || 'authorization_code';

  if (grantType === 'authorization_code') {
    if (!code) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'Missing code' });
    }

    const authData = authCodes.get(code);
    if (!authData || Date.now() > authData.expiresAt) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Code is invalid or expired' });
    }

    // Verify PKCE if a code_challenge was provided during authorize
    if (authData.codeChallenge) {
      if (!codeVerifier) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Missing code_verifier for PKCE challenge',
        });
      }

      const isValid = verifyCodeVerifier(
        codeVerifier,
        authData.codeChallenge,
        authData.codeChallengeMethod || 'S256'
      );

      if (!isValid) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'PKCE verification failed',
        });
      }
    }

    // Delete used code (single use)
    authCodes.delete(code);

    return res.json({
      access_token: authData.apiKey,
      token_type: 'Bearer',
      expires_in: 31536000, // 1 year
      scope: 'expenses:write expenses:read',
    });
  }

  // Fallback for client_credentials grant type if client provides API key as client_secret
  if (grantType === 'client_credentials') {
    const clientSecret = req.body?.client_secret || req.query?.client_secret;
    if (clientSecret && (await validateApiKey(clientSecret))) {
      return res.json({
        access_token: clientSecret,
        token_type: 'Bearer',
        expires_in: 31536000,
        scope: 'expenses:write expenses:read',
      });
    }
  }

  return res.status(400).json({ error: 'unsupported_grant_type' });
};

/**
 * RFC 7591 Dynamic Client Registration (DCR) endpoint.
 * Enables Gemini and other MCP OAuth clients to dynamically register a client ID.
 */
export const handleOAuthRegister = (req: Request, res: Response) => {
  const body = req.body || {};
  const clientId = `client_${crypto.randomBytes(12).toString('hex')}`;
  const clientSecret = `sec_${crypto.randomBytes(24).toString('hex')}`;
  const now = Math.floor(Date.now() / 1000);
  const baseUrl = getBaseUrl(req);

  const clientName = body.client_name || 'Gemini Custom MCP Client';
  const redirectUris = Array.isArray(body.redirect_uris) && body.redirect_uris.length > 0
    ? body.redirect_uris
    : ['https://gemini.google.com/oauth-redirect', 'https://vertexaisearch.cloud.google.com/oauth-redirect'];
  const grantTypes = body.grant_types || ['authorization_code', 'client_credentials'];
  const responseTypes = body.response_types || ['code'];
  const tokenEndpointAuthMethod = body.token_endpoint_auth_method || 'client_secret_post';

  const clientRecord: DynamicClientData = {
    clientId,
    clientSecret,
    clientName,
    redirectUris,
    grantTypes,
    responseTypes,
    tokenEndpointAuthMethod,
    createdAt: Date.now(),
  };

  dynamicClients.set(clientId, clientRecord);

  res.status(201).json({
    client_id: clientId,
    client_secret: clientSecret,
    client_id_issued_at: now,
    client_secret_expires_at: 0, // does not expire
    client_name: clientName,
    redirect_uris: redirectUris,
    grant_types: grantTypes,
    response_types: responseTypes,
    token_endpoint_auth_method: tokenEndpointAuthMethod,
    registration_client_uri: `${baseUrl}/oauth/register/${clientId}`,
  });
};

/**
 * RFC 8414 OAuth 2.0 Authorization Server Metadata
 */
export const getOAuthAuthorizationServerMetadata = (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);

  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    scopes_supported: ['expenses:write', 'expenses:read'],
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'client_credentials'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
    code_challenge_methods_supported: ['S256', 'plain'],
    authorization_response_iss_parameter_supported: true,
    service_documentation: `${baseUrl}/docs/mcp`,
  });
};

/**
 * RFC 9728 OAuth 2.0 Protected Resource Metadata
 */
export const getOAuthProtectedResourceMetadata = (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);

  res.json({
    resource: baseUrl,
    authorization_servers: [baseUrl],
    scopes_supported: ['expenses:write', 'expenses:read'],
    bearer_methods_supported: ['header', 'query'],
    service_documentation: `${baseUrl}/docs/mcp`,
  });
};
