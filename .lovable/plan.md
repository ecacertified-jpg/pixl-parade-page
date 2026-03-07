

## Plan: Harmonize Admin Platform Settings Layout (Mobile + Desktop)

### Problem
The Settings page has 11 tabs in a single `TabsList` with only `flex-wrap`. On mobile, this creates a messy, hard-to-navigate wall of small tab buttons. The content cards also lack consistent spacing and responsive grids.

### Solution

**1. Replace horizontal tabs with a responsive layout:**
- **Desktop**: Keep horizontal `TabsList` but use a scrollable container with `overflow-x-auto` and consistent sizing
- **Mobile**: Switch to a vertical sidebar-style navigation using a `Select` dropdown or a vertical `TabsList` that's easier to tap

Approach: Use a `Select` component on mobile (`< md`) to pick the settings section, and keep the horizontal `TabsList` on desktop (`>= md`). This is the cleanest pattern for 11+ tabs.

**2. Improve tab content cards:**
- Add consistent `gap` and `p` spacing
- Use `grid grid-cols-1 md:grid-cols-2` for form fields where appropriate (e.g., Finance has 2 inputs that can sit side-by-side on desktop)

**3. Implementation details:**
- Import `useIsMobile` hook
- Import `Select` component from shadcn/ui
- On mobile: render a `Select` with all tab labels, controlling the active tab via state
- On desktop: render the existing `TabsList` with `overflow-x-auto` and `scrollbar-hide` styling
- Keep all `TabsContent` blocks unchanged

### File to modify
- `src/pages/Admin/Settings.tsx` -- Add mobile select, improve responsive layout

