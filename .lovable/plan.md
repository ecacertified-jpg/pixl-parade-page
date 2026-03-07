

## Diagnosis: Post-Login Freeze

### Root Cause

After a successful `signInWithPassword`, the code at line 939-946 of `Auth.tsx` does:

```typescript
if (authData.user) {
  trackLogin('email');
  toast({ ... });
  await processAdminAutoAssign(authData.user.id);  // ← calls edge function
  await handleSmartRedirect(authData.user, navigate); // ← queries business_accounts
}
```

**Two problems cause the freeze:**

1. **`processAdminAutoAssign` calls an edge function** (`admin-auto-assign`) even when there's no `admin_ref`. While the function does an early `return` when no ref exists, the `supabase.functions.invoke` call still fires over the network, adding latency. On slow connections (typical in Côte d'Ivoire), this can hang.

2. **Race condition with the `useEffect` redirect** (line 233-256): When `signInWithPassword` succeeds, Supabase's `onAuthStateChange` fires and sets `user` in context. This triggers the `useEffect` which ALSO calls `handleSmartRedirect`. So two competing redirects run simultaneously — one from the form handler, one from the useEffect. If the form handler's `await` is still pending when the useEffect fires, the component may unmount mid-await, leaving the UI frozen.

3. **`handleSmartRedirect` queries `business_accounts`** table. The RLS policy `"Authenticated users can view active businesses"` uses `is_active = true` without `TO authenticated`, meaning it applies to `public` role too. Combined with another policy `"Public can view active businesses"` also `TO public`, these overlapping policies could cause slow query resolution.

### Fix Plan

**1. Prevent double-redirect race condition in Auth.tsx**
- In `handleEmailSignIn` (and the phone OTP handler), do NOT call `handleSmartRedirect` — instead, let the `useEffect` at line 233 handle all redirections. After `signInWithPassword` succeeds, just show the toast and set loading to false. The `onAuthStateChange` will set `user`, triggering the redirect useEffect.
- Alternatively (simpler): add a `ref` flag like `isRedirecting` to prevent the useEffect from running when the form handler is already handling the redirect.

**2. Make `processAdminAutoAssign` non-blocking**
- Don't `await` it in the login flow. Call it fire-and-forget since it's not critical to the redirect. Change `await processAdminAutoAssign(...)` to `processAdminAutoAssign(...).catch(console.error)`.

**3. Add timeout to `handleSmartRedirect`**
- Wrap the `getRedirectPath` call in a timeout (e.g., 3 seconds). If it takes too long, fallback to `/dashboard`.

**4. Add error boundary / loading timeout in the login button**
- If `isLoading` stays true for more than 8 seconds, auto-reset it and show a toast suggesting to retry.

### Files to modify:
- `src/pages/Auth.tsx` — Fix race condition, make processAdminAutoAssign non-blocking
- `src/pages/BusinessAuth.tsx` — Same fixes for consistency
- `src/utils/authRedirect.ts` — Add timeout to `getRedirectPath`

