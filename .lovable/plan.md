
# Fix mobile display for birthday countdown and contributor names

## Problem

In the `CollectiveFundCard` component, two pieces of information are not visible on mobile:
1. "Anniv. dans X jours" -- squeezed out by the badge + action buttons in the header
2. Contributor names and amounts -- compressed by avatars in the horizontal flex layout

## Changes

**File**: `src/components/CollectiveFundCard.tsx`

### 1. Fix header layout (lines 222-270)

Change the header from a single `flex justify-between` row to a stacked layout on mobile:
- Wrap the title block and action block so they stack on small screens
- Use `flex flex-wrap` or `flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`
- This ensures the birthday text, creation date, and title all have full width on mobile, with the badge and buttons on a second line

### 2. Fix contributor names section (lines 343-369)

- Change the contributors layout from a single horizontal `flex` to a stacked layout on mobile:
  - Avatars row on top
  - Contributor names text below (full width)
- Use `flex flex-col sm:flex-row sm:items-center gap-2`
- Add `min-w-0` on the text container to allow proper text wrapping/truncation

## Summary

- 1 file modified: `src/components/CollectiveFundCard.tsx`
- Layout-only changes, no logic or data changes
