

# Fix: Radix UI compose-refs infinite loop on all buttons

## Problem

The Vite alias for `@radix-ui/react-compose-refs` is not being applied to all Radix packages. When Vite pre-bundles packages like `@radix-ui/react-dropdown-menu`, `@radix-ui/react-dialog`, etc., it inlines their dependency on `compose-refs` directly into bundled chunks (e.g., `chunk-6YGIOMX5.js`). The alias never gets a chance to redirect those internal imports to the patch file.

This causes the infinite `setState` loop on any component using Radix refs (dropdowns, dialogs, tooltips, etc.) -- which is why ALL buttons are affected.

## Root Cause

1. `optimizeDeps.exclude` only excludes `@radix-ui/react-compose-refs` itself from pre-bundling
2. Other Radix packages that `import` from it are still pre-bundled, and their internal imports are resolved to the original module during bundling
3. The patch never intercepts those calls

## Solution

Two changes:

### 1. Exclude all Radix UI packages from Vite pre-bundling

In `vite.config.ts`, replace the single exclude with a pattern that covers all `@radix-ui/*` packages. This forces Vite to leave Radix imports as-is at runtime, where the alias can properly redirect them to the patch.

```ts
optimizeDeps: {
  exclude: ['@radix-ui/react-compose-refs'],
  // Add:
  exclude: [/^@radix-ui\//],  // or list all radix packages explicitly
}
```

Since Vite `exclude` doesn't support regex, we'll list the key Radix packages that use compose-refs, or use a `noExternal`-style workaround.

**Simpler approach**: Use `optimizeDeps.exclude` with all installed `@radix-ui/*` packages so none get pre-bundled.

### 2. Update the patch to match the original API

The current patch doesn't return cleanup functions, which differs from the original module's behavior. Update `src/lib/radix-compose-refs-patch.ts` to properly handle React 19's cleanup return pattern while still preventing re-entrancy.

## Files to modify

| File | Action |
|------|--------|
| `vite.config.ts` | Exclude all `@radix-ui/*` packages from `optimizeDeps` |
| `src/lib/radix-compose-refs-patch.ts` | Update to match original API with cleanup support and re-entrancy guard |

## Expected outcome

- All Radix-based components (dropdowns, dialogs, tooltips, popovers) will work without triggering infinite `setState` loops
- The profile dropdown, navigation menus, and all interactive buttons will function correctly

