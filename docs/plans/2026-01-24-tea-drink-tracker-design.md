# Tea Drink Tracker Feature Design

## Overview
Add a drink counter and last consumed date tracker to each tea. Users increment the counter by clicking an "All Done" button when they finish the last steep of a tea session.

## Data Model & Architecture

### Tea Type Extension
```typescript
Tea {
  id: string;
  name: string;
  type: string;
  image: string;
  steepTimes: number[];
  timesConsumed: number;        // Counter (default: 0)
  lastConsumedDate: number | null;  // Unix timestamp (ms) or null
}
```

### Data Flow
1. User starts a steep timer by clicking a steep time button
2. When the timer for `steepTimes[steepTimes.length - 1]` is running, "All Done" button is visible in the right-hand panel
3. User clicks "All Done" → Frontend sends `PUT /api/teas/:id/lastConsumed` to backend
4. Backend increments `timesConsumed` and sets `lastConsumedDate` to `Date.now()` (Unix timestamp in milliseconds)
5. Backend updates `teas.yaml` and returns updated Tea object
6. Frontend updates state, counter and date display on card immediately

### Persistence
- New fields stored in `teas.yaml` alongside existing tea data
- No database changes needed

## Frontend Components & UI

### Tea Card Updates
- Below the type and caffeine level, add a new stats row: `"Drunk [timesConsumed] times | Last: [formatted date]"`
- For undrunk teas: `"Drunk 0 times | Last: Never"`
- Style as smaller gray text to keep visual hierarchy clean

### Right-Hand Panel Updates
- Add an "All Done" button below the steep times list
- Button is visible when: the last steep timer (`steepTimes[steepTimes.length - 1]`) is running OR has just completed
- Button is hidden when: any other steep is running, no timer is active, or when the user exits the right-hand panel
- Clicking "All Done" triggers API call to `PUT /api/teas/:id/lastConsumed`

### State Management
- When "All Done" is clicked, the frontend receives the updated Tea object from the API
- Update the tea in the React state/context so the card immediately reflects the new counter and date
- Keep the timer state as-is; user can stop the timer independently if desired

### Date Formatting
- Format `lastConsumedDate` timestamp as "Jan 20, 2026" or "Today" if same day as current date
- Use a helper function for consistent formatting across the app

### Error Handling
- If "All Done" API call fails, show a toast/alert to user and keep the button visible
- Allow user to retry

## Backend API & Zod Schema

### Zod Schema Updates (`src/types.ts`)
- Extend the `TeaSchema` to include:
  - `timesConsumed: z.number().int().min(0).default(0)`
  - `lastConsumedDate: z.number().nullable().default(null)`
- Update any form validation schemas if needed to handle these optional fields

### Backend API Endpoint (`server/index.ts`)
- Add new endpoint: `PUT /api/teas/:id/lastConsumed`
- Handler logic:
  1. Validate the tea ID exists
  2. Load the tea from `teas.yaml`
  3. Increment `timesConsumed` by 1
  4. Set `lastConsumedDate` to `Date.now()`
  5. Write updated tea back to `teas.yaml`
  6. Return the updated Tea object (validated against TeaSchema)
  7. Return 404 if tea not found, 400 if validation fails

### Existing Endpoints
- `GET /api/teas` - will now return teas with new fields populated
- `POST /api/teas` - will set `timesConsumed: 0` and `lastConsumedDate: null` by default for new teas
- `DELETE /api/teas/:id` - no changes needed

## Data Migration & Testing

### Data Migration
- Existing teas in `teas.yaml` without the new fields will be automatically initialized with:
  - `timesConsumed: 0`
  - `lastConsumedDate: null`
- This happens when the GET `/api/teas` endpoint loads teas and validates them against the updated Zod schema (or during first boot)

### Frontend Testing
- Test that "All Done" button appears only when last steep timer is running/completed
- Test that button hides when user exits the right-hand panel
- Test that clicking "All Done" successfully calls the API and updates the card display immediately
- Test that stats row displays correctly for drunk (0+ times) and undrunk teas
- Test date formatting for "Today" vs. past dates

### Backend Testing
- Test `PUT /api/teas/:id/lastConsumed` increments counter and sets timestamp
- Test endpoint returns 404 for non-existent tea IDs
- Test that multiple calls continue incrementing correctly
- Verify `teas.yaml` is updated correctly after each call

### Implementation Notes
- The frontend needs to track which tea and which steep index are currently active (already done via `TimerContext`)
- Date formatting helper can use `Date.toLocaleDateString()` with locale support
- **Debounce the "All Done" button**: Disable the button immediately after click and re-enable it after the API response completes. This prevents accidental double submissions while the request is in flight.
