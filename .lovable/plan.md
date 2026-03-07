

## Diagnosis: Assets Upload Broken — Wrong RLS Role

### Root Cause

The storage RLS policies for the `assets` bucket have **`roles: {public}`** on INSERT, UPDATE, and DELETE. In Supabase, the `public` role applies to **unauthenticated** requests only. When an admin is logged in, they use the `authenticated` role — so the INSERT policy **never matches**, and the upload silently fails.

The `with_check` clause requires `auth.uid()` to match an active admin, which is correct logic — but it never executes because the policy doesn't apply to the `authenticated` role.

### Fix

**1. SQL Migration — Fix RLS policies on `storage.objects`**

Drop the 3 broken policies and recreate them with `TO authenticated`:

```sql
DROP POLICY "Admins can upload to assets" ON storage.objects;
DROP POLICY "Admins can update assets" ON storage.objects;
DROP POLICY "Admins can delete assets" ON storage.objects;

CREATE POLICY "Admins can upload to assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'assets'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins can update assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'assets'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins can delete assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'assets'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);
```

**2. UX Improvement in `AssetUploader.tsx`** (minor)

Optionally auto-trigger upload after file selection to remove the confusing two-step flow (select → then click "Uploader"). This way clicking the drop zone directly uploads.

### Files to modify
- **New SQL migration** — Fix the 3 RLS policies from `public` to `authenticated`
- **`src/components/admin/AssetUploader.tsx`** — Optional: auto-upload on file selection

