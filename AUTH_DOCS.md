# SwiftSpend Authentication Documentation

This document covers the implementation, configuration, and maintenance of the authentication system in SwiftSpend.

## 1. Supabase Dashboard Setup

### Email/Password Authentication
1. Go to your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** -> **Providers**.
3. Ensure **Email** is enabled.
4. (Optional) Disable **Confirm Email** for faster local development, but keep it enabled for production.

### Google OAuth Configuration
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services** -> **Credentials**.
4. Click **Create Credentials** -> **OAuth client ID**.
5. Select **Web application**.
6. Add your Supabase Callback URL to **Authorized redirect URIs**. You can find this in Supabase: **Authentication** -> **Providers** -> **Google**.
   - It usually looks like: `https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret** into Supabase.

### Apple OAuth Configuration
1. Go to the [Apple Developer Portal](https://developer.apple.com/).
2. Create an **App ID** and a **Service ID**.
3. Configure the Service ID with the Supabase Callback URL.
4. Create a **Private Key** (.p8 file) and note the **Key ID** and **Team ID**.
5. Enter these details in the Supabase dashboard under **Authentication** -> **Providers** -> **Apple**.

### Redirect URLs
In the Supabase dashboard, go to **Authentication** -> **URL Configuration**.
- **Site URL**: `http://localhost:5173` (for local development)
- **Redirect URLs**: Add `http://localhost:5173/auth/callback`

## 2. Session Flow

### Frontend Initialization
The `AuthProvider` (`apps/web/src/context/AuthProvider.tsx`) is the heart of the auth system.
- On mount, it calls `supabase.auth.getSession()` to check for an existing session.
- It sets up a listener using `supabase.auth.onAuthStateChange` to react to login/logout events across tabs.

### API Requests (JWT Attachment)
An Axios interceptor in `apps/web/src/services/api.ts` automatically attaches the JWT to every request:
```typescript
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});
```

### Backend Validation
The backend middleware (`apps/api/src/middleware/auth.ts`) validates the JWT on every protected route:
1. Extracts the token from the `Authorization` header.
2. Calls `supabaseAdmin.auth.getUser(token)` to verify the token's validity with Supabase.
3. If valid, attaches the user object to `req.user` for use in controllers.

## 3. How to add a new OAuth provider

1. **Supabase Setup**: Enable the provider in the Supabase Dashboard and follow their specific configuration steps (similar to Google/Apple).
2. **Frontend Type**: Add the provider name to the `AuthProvider` type in `apps/web/src/types/auth.ts`.
3. **UI Component**: Add a new button in `apps/web/src/components/auth/OAuthButtons.tsx` that calls `handleOAuthLogin('new_provider')`.

## 4. Error Handling Conventions

### Service Layer
Errors from Supabase are caught in the `AuthForm` or `OAuthButtons` components. We use the `getAuthErrorMessage` utility to translate raw Supabase errors into user-friendly messages.

### Mapping New Errors
To add a new error mapping:
1. Open `apps/web/src/utils/authErrors.ts`.
2. Add a new condition to the `getAuthErrorMessage` function based on the error message or code returned by Supabase.

## 5. Testing Auth Locally

### Supabase CLI
If you are using the Supabase CLI for local development:
1. Run `supabase start` to launch the local emulator.
2. The dashboard will be available at `http://localhost:54323`.

### Creating Test Users
You can create a test user via the CLI:
```bash
supabase auth signup --email test@example.com --password password123
```
Or simply use the Sign Up page in the application while the local emulator is running.
