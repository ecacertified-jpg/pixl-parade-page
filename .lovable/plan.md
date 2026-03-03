
# Fix: "record new has no field fund_id" error on contribution

## Root Cause

The function `handle_fund_completion()` was originally written for the `fund_contributions` table (which has a `fund_id` column). Later, the trigger was correctly moved to the `collective_funds` table, but the function body was never updated. It still references `NEW.fund_id` instead of `NEW.id`.

When a contribution reaches 100% of the target:
1. `fund_contributions` is updated (or inserted)
2. `collective_funds.current_amount` is recalculated by another trigger
3. `trigger_handle_fund_completion` fires on `collective_funds`
4. `handle_fund_completion()` tries `NEW.fund_id` -- CRASH: `collective_funds` has no `fund_id` column

## Fix

**Database migration** -- Recreate `handle_fund_completion()` replacing all `NEW.fund_id` references with `NEW.id`, since the trigger now runs on `collective_funds` where the row's primary key is `id`.

Changes in the function:
- Line 17: `WHERE id = NEW.fund_id` becomes `WHERE id = NEW.id` (or simply use `NEW` directly since we already are on `collective_funds`)
- Remove the initial `SELECT * INTO fund_record FROM collective_funds WHERE id = ...` since `NEW` already IS the `collective_funds` row
- Use `NEW.current_amount >= NEW.target_amount` directly instead of fetching `fund_record`
- Keep the business order creation logic intact using `NEW.id` as the fund ID

## Technical Details

Single SQL migration to `CREATE OR REPLACE FUNCTION handle_fund_completion()` with corrected column references. No schema changes, no new tables, no frontend changes needed.
