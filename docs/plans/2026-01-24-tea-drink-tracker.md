# Tea Drink Tracker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add drink counter and last consumed date tracking to each tea, incrementable via an "All Done" button when finishing the last steep.

**Architecture:** Extend Tea model with timesConsumed (number) and lastConsumedDate (timestamp). Add PUT /api/teas/:id/lastConsumed endpoint. Show "All Done" button in right-hand panel when last steep timer is active/completed. Display stats on tea cards below type/caffeine.

**Tech Stack:** React 19.2, TypeScript, Zod, Express 5.2, js-yaml

---

## Task 1: Update Shared Type Schema

**Files:**
- Modify: `shared/types.ts:17-29`

**Step 1: Add new fields to TeaSchema**

Edit `shared/types.ts` to add `timesConsumed` and `lastConsumedDate`:

```typescript
export const TeaSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: TeaTypeSchema,
  image: z.string(),
  steepTimes: z.array(z.number()),
  caffeine: z.string(),
  caffeineLevel: CaffeineLevelSchema,
  website: z.string(),
  brewingTemperature: z.string(),
  teaWeight: z.string(),
  rating: z.number().min(1).max(10).nullable().optional(),
  timesConsumed: z.number().int().min(0).default(0),
  lastConsumedDate: z.number().nullable().default(null)
});
```

**Step 2: Update CreateTeaSchema**

Add the same fields to CreateTeaSchema with defaults:

```typescript
export const CreateTeaSchema = z.object({
  name: z.string(),
  type: TeaTypeSchema,
  image: z.string(),
  steepTimes: z.array(z.number()),
  caffeine: z.string().optional().default(''),
  caffeineLevel: CaffeineLevelSchema.optional().default('Low'),
  website: z.string().optional().default(''),
  brewingTemperature: z.string().optional().default(''),
  teaWeight: z.string().optional().default(''),
  rating: z.number().min(1).max(10).nullable().optional(),
  timesConsumed: z.number().int().min(0).optional().default(0),
  lastConsumedDate: z.number().nullable().optional().default(null)
});
```

**Step 3: Verify types compile**

Run: `cd tea-app && npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 4: Commit type changes**

```bash
cd /Users/serena/dev/gf_tea/.worktrees/tea-drink-tracker
git add shared/types.ts
git commit -m "feat: Add timesConsumed and lastConsumedDate to Tea schema

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Add Backend API Endpoint

**Files:**
- Modify: `tea-app/server/index.ts:760` (add new endpoint after PATCH /api/teas/:id)

**Step 1: Write the PUT /api/teas/:id/lastConsumed endpoint**

Add after the PATCH /api/teas/:id endpoint (around line 760):

```typescript
app.put('/api/teas/:id/lastConsumed', (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Tea ID is required' });
      return;
    }

    let teas;
    try {
      teas = readTeas();
    } catch (readError) {
      console.error('Failed to read teas before updating consumption:', readError);
      res.status(500).json({ error: 'Failed to read tea collection', details: readError instanceof Error ? readError.message : 'Unknown error' });
      return;
    }

    const teaIndex = teas.findIndex(t => t.id === id);
    if (teaIndex === -1) {
      console.warn(`Attempted to mark non-existent tea as consumed with ID: ${id}`);
      res.status(404).json({ error: 'Tea not found' });
      return;
    }

    const existingTea = teas[teaIndex];
    const updatedTea: Tea = {
      ...existingTea,
      timesConsumed: (existingTea.timesConsumed || 0) + 1,
      lastConsumedDate: Date.now()
    };

    // Validate the updated tea against schema
    let validatedTea;
    try {
      validatedTea = TeaSchema.parse(updatedTea);
    } catch (validationError) {
      console.error('Updated tea data validation failed:', validationError);
      if (validationError instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid tea data', details: validationError.issues });
      } else {
        res.status(400).json({ error: 'Failed to validate tea data', details: validationError instanceof Error ? validationError.message : 'Unknown validation error' });
      }
      return;
    }

    teas[teaIndex] = validatedTea;

    try {
      writeTeas(teas);
      console.log(`Successfully marked tea as consumed: ${validatedTea.name} (ID: ${id}), times consumed: ${validatedTea.timesConsumed}`);
      res.status(200).json(validatedTea);
    } catch (writeError) {
      console.error('Failed to save tea after marking consumed:', writeError);
      res.status(500).json({ error: 'Failed to save tea', details: writeError instanceof Error ? writeError.message : 'Unknown error' });
    }
  } catch (error) {
    console.error('Unexpected error in PUT /api/teas/:id/lastConsumed:', error);
    res.status(500).json({ error: 'An unexpected error occurred while updating tea consumption', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});
```

**Step 2: Verify server compiles**

Run: `cd tea-app && npx tsc --noEmit`
Expected: No TypeScript errors

**Step 3: Commit backend endpoint**

```bash
cd /Users/serena/dev/gf_tea/.worktrees/tea-drink-tracker
git add tea-app/server/index.ts
git commit -m "feat: Add PUT /api/teas/:id/lastConsumed endpoint

Increments timesConsumed counter and records lastConsumedDate timestamp.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Add Frontend API Method

**Files:**
- Modify: `tea-app/src/api.ts:38` (add after updateTea)

**Step 1: Add markTeaConsumed API method**

Add after the `updateTea` function:

```typescript
export const markTeaConsumed = async (id: string): Promise<Tea> => {
  const url = `${API_URL}/teas/${id}/lastConsumed`;
  const response = await axios.put(url);
  return TeaSchema.parse(response.data);
};
```

**Step 2: Verify frontend compiles**

Run: `cd tea-app && npm run build`
Expected: Build succeeds

**Step 3: Commit API method**

```bash
cd /Users/serena/dev/gf_tea/.worktrees/tea-drink-tracker
git add tea-app/src/api.ts
git commit -m "feat: Add markTeaConsumed API method

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Add Date Formatting Utility

**Files:**
- Create: `tea-app/src/utils/dateFormat.ts`

**Step 1: Write date formatting helper**

Create new file `tea-app/src/utils/dateFormat.ts`:

```typescript
/**
 * Formats a timestamp for display on tea cards.
 * Returns "Today" if same day, otherwise "MMM DD, YYYY" format.
 */
export const formatLastConsumedDate = (timestamp: number | null): string => {
  if (timestamp === null) {
    return 'Never';
  }

  const date = new Date(timestamp);
  const today = new Date();

  // Check if same day
  const isSameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isSameDay) {
    return 'Today';
  }

  // Format as "Jan 20, 2026"
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};
```

**Step 2: Verify it compiles**

Run: `cd tea-app && npm run build`
Expected: Build succeeds

**Step 3: Commit utility**

```bash
cd /Users/serena/dev/gf_tea/.worktrees/tea-drink-tracker
git add tea-app/src/utils/dateFormat.ts
git commit -m "feat: Add date formatting utility for last consumed display

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Update TimerContext to Track Active Steep Index

**Files:**
- Modify: `tea-app/src/TimerContext.tsx:3-8,138-141`

**Step 1: Extend TimerContextType interface**

Update the interface to include `activeSteepIndex`:

```typescript
interface TimerContextType {
  timeLeft: number | null;
  activeTeaName: string | null;
  activeSteepIndex: number | null; // NEW
  startTimer: (seconds: number, teaName: string, steepIndex: number) => void; // Updated signature
  stopTimer: () => void;
}
```

**Step 2: Add activeSteepIndex state**

In TimerProvider component, add state:

```typescript
export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [activeTeaName, setActiveTeaName] = useState<string | null>(null);
  const [activeSteepIndex, setActiveSteepIndex] = useState<number | null>(null); // NEW
```

**Step 3: Update startTimer to accept steepIndex**

Update the `startTimer` callback:

```typescript
const startTimer = useCallback((seconds: number, teaName: string, steepIndex: number) => {
  playNotificationSound('chime');
  setTimeLeft(seconds);
  setActiveTeaName(teaName);
  setActiveSteepIndex(steepIndex); // NEW
}, []);
```

**Step 4: Clear activeSteepIndex in stopTimer and on completion**

Update stopTimer:

```typescript
const stopTimer = useCallback(() => {
  setTimeLeft(null);
  setActiveTeaName(null);
  setActiveSteepIndex(null); // NEW
}, []);
```

Update the useEffect where timer completes (around line 122):

```typescript
if (timeLeft === 0) {
  playNotificationSound('end');
  setActiveTeaName(null);
  setTimeLeft(null);
  setActiveSteepIndex(null); // NEW
  return;
}
```

**Step 5: Update provider value**

Update the context provider value:

```typescript
return (
  <TimerContext.Provider value={{ timeLeft, activeTeaName, activeSteepIndex, startTimer, stopTimer }}>
    {children}
  </TimerContext.Provider>
);
```

**Step 6: Verify it compiles**

Run: `cd tea-app && npm run build`
Expected: Build succeeds

**Step 7: Commit TimerContext changes**

```bash
cd /Users/serena/dev/gf_tea/.worktrees/tea-drink-tracker
git add tea-app/src/TimerContext.tsx
git commit -m "feat: Track active steep index in TimerContext

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Update App.tsx to Pass Steep Index and Tea ID

**Files:**
- Modify: `tea-app/src/App.tsx:392-401,513-514`

**Step 1: Update handleSteepTimeClick signature and calls**

Update the `handleSteepTimeClick` function to accept teaId:

```typescript
const handleSteepTimeClick = (timeIdx: number, teaId: string, time: number, teaName: string) => {
  startTimer(time, teaName, timeIdx); // Pass timeIdx as third argument
  setUsedSteepTimes(prev => {
    const newMap = new Map(prev);
    const usedSet = newMap.get(teaId) || new Set<number>();
    usedSet.add(timeIdx);
    newMap.set(teaId, usedSet);
    return newMap;
  });
};
```

**Step 2: Update SidePanel onSteepTimeClick call**

Update the SidePanel instantiation (around line 513):

```typescript
onSteepTimeClick={(idx, time, teaName) => {
  handleSteepTimeClick(idx, selectedTeaId, time, teaName);
}}
```

**Step 3: Verify it compiles**

Run: `cd tea-app && npm run build`
Expected: Build succeeds

**Step 4: Commit App.tsx changes**

```bash
cd /Users/serena/dev/gf_tea/.worktrees/tea-drink-tracker
git add tea-app/src/App.tsx
git commit -m "feat: Pass steep index to timer when starting

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Add "All Done" Button to SidePanel

**Files:**
- Modify: `tea-app/src/App.tsx:32-46,145-163`

**Step 1: Import markTeaConsumed API method**

Update imports at top of file:

```typescript
import { getTeas, createTea, deleteTea, importTeaFromUrl, updateTea, markTeaConsumed } from './api'
```

**Step 2: Update SidePanel props**

Update SidePanel component signature:

```typescript
const SidePanel = ({
  tea,
  onClose,
  usedSteepTimes,
  onSteepTimeClick,
  onResetUsed,
  onTeaUpdated
}: {
  tea: Tea;
  onClose: () => void;
  usedSteepTimes: Set<number>;
  onSteepTimeClick: (idx: number, time: number, teaName: string) => void;
  onResetUsed: () => void;
  onTeaUpdated: () => void;
})
```

**Step 3: Add state and logic for "All Done" button**

Inside SidePanel component, after existing state:

```typescript
const [isUpdatingRating, setIsUpdatingRating] = useState(false);
const [isMarkingConsumed, setIsMarkingConsumed] = useState(false); // NEW

const { activeSteepIndex, timeLeft } = useTimer(); // NEW

const handleMarkConsumed = async () => { // NEW
  setIsMarkingConsumed(true);
  try {
    await markTeaConsumed(tea.id);
    showSuccess('Tea marked as consumed!');
    onTeaUpdated();
  } catch (error) {
    console.error('Failed to mark tea as consumed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    showError(`Failed to mark as consumed: ${errorMessage}`);
  } finally {
    setIsMarkingConsumed(false);
  }
};

// Determine if "All Done" button should be visible
const isLastSteep = activeSteepIndex !== null && activeSteepIndex === tea.steepTimes.length - 1;
const showAllDoneButton = isLastSteep;
```

**Step 4: Add "All Done" button in JSX**

Add the button after the steep times section reset button (around line 163):

```typescript
        {usedSteepTimes.size > 0 && (
          <button className="btn-reset-used" onClick={onResetUsed}>
            Reset
          </button>
        )}
        {showAllDoneButton && (
          <button
            className="btn-all-done"
            onClick={handleMarkConsumed}
            disabled={isMarkingConsumed}
          >
            {isMarkingConsumed ? 'Saving...' : 'All Done'}
          </button>
        )}
      </div>
    </div>
  </div>
);
```

**Step 5: Verify it compiles**

Run: `cd tea-app && npm run build`
Expected: Build succeeds

**Step 6: Commit "All Done" button**

```bash
cd /Users/serena/dev/gf_tea/.worktrees/tea-drink-tracker
git add tea-app/src/App.tsx
git commit -m "feat: Add 'All Done' button to SidePanel for last steep

Shows button when last steep timer is active, calls markTeaConsumed API.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Display Stats on Tea Cards

**Files:**
- Modify: `tea-app/src/components/TeaCard.tsx` (find and update)

**Step 1: Find TeaCard component location**

Run: `find tea-app/src -name "*.tsx" -type f | xargs grep -l "export.*TeaCard"`
Expected: Find the file path (likely `tea-app/src/components/TeaCard.tsx` or similar)

**Step 2: Import date formatter**

Add import at top of TeaCard file:

```typescript
import { formatLastConsumedDate } from '../utils/dateFormat';
```

**Step 3: Add stats display below type and caffeine**

Find where type and caffeine are displayed, and add after them:

```typescript
<div className="tea-stats">
  <span className="stat-text">
    Drunk {tea.timesConsumed || 0} times | Last: {formatLastConsumedDate(tea.lastConsumedDate || null)}
  </span>
</div>
```

**Step 4: Verify it compiles**

Run: `cd tea-app && npm run build`
Expected: Build succeeds

**Step 5: Commit tea card stats display**

```bash
cd /Users/serena/dev/gf_tea/.worktrees/tea-drink-tracker
git add tea-app/src/components/TeaCard.tsx
git commit -m "feat: Display drink stats on tea cards

Shows times consumed and last consumed date below type/caffeine.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Add CSS Styling

**Files:**
- Modify: `tea-app/src/App.css` (add at end)

**Step 1: Add styles for "All Done" button and stats**

Add to end of App.css:

```css
/* All Done Button */
.btn-all-done {
  margin-top: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.2s;
}

.btn-all-done:hover:not(:disabled) {
  background-color: #059669;
}

.btn-all-done:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Tea Stats Display */
.tea-stats {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.stat-text {
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
}
```

**Step 2: Verify styles load**

Run: `cd tea-app && npm run build`
Expected: Build succeeds

**Step 3: Commit CSS**

```bash
cd /Users/serena/dev/gf_tea/.worktrees/tea-drink-tracker
git add tea-app/src/App.css
git commit -m "style: Add styling for All Done button and tea stats

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Manual Testing

**Files:**
- Test: All components end-to-end

**Step 1: Start the development servers**

Run: `cd tea-app && ./.scripts/startup.sh`
Expected: Frontend on http://localhost:5173, backend on http://localhost:3001

**Step 2: Test basic flow**

1. Open http://localhost:5173 in browser
2. Select a tea with multiple steep times
3. Click the last steep time (e.g., if steep times are [30, 60, 90], click 90s)
4. Verify "All Done" button appears in right panel
5. Let timer run or wait for completion
6. Click "All Done" button
7. Verify success toast appears
8. Verify tea card now shows "Drunk 1 times | Last: Today"
9. Close and reopen the panel
10. Click "All Done" again
11. Verify counter increments to 2

**Step 3: Test edge cases**

1. Click a non-last steep time (e.g., 30s)
2. Verify "All Done" button does NOT appear
3. Close the right panel while last steep timer is running
4. Verify "All Done" button disappears
5. Create a new tea and verify it shows "Drunk 0 times | Last: Never"

**Step 4: Test date formatting**

1. Manually edit `tea-app/server/teas.yaml`
2. Set a tea's `lastConsumedDate` to a past timestamp (e.g., `1704067200000` for Jan 1, 2024)
3. Refresh the page
4. Verify the date displays as "Jan 1, 2024" instead of "Today"

**Step 5: Shutdown servers**

Run: `cd tea-app && ./.scripts/shutdown.sh`
Expected: Clean shutdown

**Step 6: Document testing results**

Create a commit with testing notes:

```bash
cd /Users/serena/dev/gf_tea/.worktrees/tea-drink-tracker
git add -A
git commit -m "test: Manual end-to-end testing completed

All features working as expected:
- All Done button appears only for last steep
- Counter increments correctly
- Date formatting shows Today vs past dates
- Stats display on tea cards

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Update Documentation

**Files:**
- Modify: `docs/plans/2026-01-24-tea-drink-tracker-design.md`

**Step 1: Add implementation notes**

Add section at end of design doc:

```markdown
## Implementation Complete

- All features implemented and tested
- Counter increments on "All Done" click
- Date formatting works for "Today" and past dates
- Stats display on tea cards below type/caffeine level
- Button only visible when last steep timer is active/completed
```

**Step 2: Commit documentation update**

```bash
cd /Users/serena/dev/gf_tea/.worktrees/tea-drink-tracker
git add docs/plans/2026-01-24-tea-drink-tracker-design.md
git commit -m "docs: Mark tea drink tracker design as implemented

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Completion Checklist

- [ ] Task 1: Schema updated with timesConsumed and lastConsumedDate
- [ ] Task 2: Backend PUT endpoint created
- [ ] Task 3: Frontend API method added
- [ ] Task 4: Date formatting utility created
- [ ] Task 5: TimerContext tracks steep index
- [ ] Task 6: App.tsx passes steep index to timer
- [ ] Task 7: "All Done" button added to SidePanel
- [ ] Task 8: Stats displayed on tea cards
- [ ] Task 9: CSS styling applied
- [ ] Task 10: Manual testing completed
- [ ] Task 11: Documentation updated

**Next Steps After Implementation:**
1. Use superpowers:verification-before-completion to run tests and verify everything works
2. Use superpowers:finishing-a-development-branch to merge or create PR

---

## Implementation Complete

- All features implemented and tested
- Counter increments on "All Done" click
- Date formatting works for "Today" and past dates
- Stats display on tea cards below type/caffeine level
- Button only visible when last steep timer is active/completed
