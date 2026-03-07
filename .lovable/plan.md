

## Plan: Login Button Loading Timeout (8s Safety Net)

### What
Add a safety timeout mechanism: if `isLoading` stays `true` for more than 8 seconds after any login action, automatically reset it to `false` and show an error toast suggesting the user retry.

### How

**Both `src/pages/Auth.tsx` and `src/pages/BusinessAuth.tsx`:**

1. Add a `useRef` for the timeout timer and a `useEffect` that watches `isLoading`:

```typescript
const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  if (isLoading) {
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Délai dépassé',
        description: 'La connexion prend trop de temps. Veuillez réessayer.',
        variant: 'destructive',
      });
    }, 8000);
  } else {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }
  return () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  };
}, [isLoading]);
```

This is a simple, self-contained solution: no other code changes needed. When loading completes normally (via `finally` blocks), the timeout is cleared. If it doesn't complete within 8s, the UI recovers automatically.

**Also apply to `src/pages/AdminAuth.tsx`** for consistency (same pattern).

### Files to modify
- `src/pages/Auth.tsx` — Add timeout useEffect + useRef
- `src/pages/BusinessAuth.tsx` — Same
- `src/pages/AdminAuth.tsx` — Same

