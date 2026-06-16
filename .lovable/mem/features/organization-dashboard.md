---
name: Organization Dashboard
description: Read-only "Vue d'ensemble" tab in Mes coulisses aggregating tasks, budget, guests, vendors, seating into KPIs and alerts
type: feature
---
First tab of `OrganizationSection`. Aggregates existing tables (no schema change):
- Tasks: done/total + %
- Budget: spent vs planned + over-budget badge
- Guests: confirmed (status=confirmed OR rsvp_response=yes), +1s, total heads
- Vendors: confirmed/total, sum of quote_amount + deposit_amount
- Seating: assigned seats / total capacity

Alerts surfaced: tasks due within 7d (warn if J<0), budget ≥80% or over, vendors still `proposed`, confirmed guests without table when tables exist.

Component: `src/components/organization/OrganizationDashboard.tsx`.
