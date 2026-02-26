# Consumption Popup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the "All Done" button with a modal popup that appears when the last steep timer completes.

**Architecture:** Extend TimerContext to track when a consumption modal should appear. Add new state for `showConsumptionModal` and the tea ID. Create a simple modal component that renders when this state is set.

**Tech Stack:** React, TypeScript, CSS (using existing design tokens)

---

### Task 1: Extend TimerContext State

**Files:**
- Modify: `src/TimerContext.tsx`

**Step 1: Add new state and context fields**

In the `TimerContextType` interface (around line 3), add:

```typescript
interface TimerContextType {
  timeLeft: number | null;
  activeTeaName: string | null;
  activeSteepIndex: number | null;
  activeTeaId: string | null;           // NEW
  activeTeaTotalSteeps: number | null;  // NEW
  showConsumptionModal: boolean;        // NEW
  startTimer: (seconds: number, teaName: string, steepIndex: number, teaId: string, totalSteeps: number) => void;  // MODIFIED
  stopTimer: () => void;
  dismissConsumptionModal: () => void;  // NEW
}
```

**Step 2: Add state variables in TimerProvider**

After the existing useState calls (around line 117), add:

```typescript
const [activeTeaId, setActiveTeaId] = useState<string | null>(null);
const [activeTeaTotalSteeps, setActiveTeaTotalSteeps] = useState<number | null>(null);
const [showConsumptionModal, setShowConsumptionModal] = useState(false);
```

**Step 3: Modify the timer completion logic**

In the useEffect (around line 122), change the `timeLeft === 0` block:

```typescript
if (timeLeft === 0) {
  playNotificationSound('end');
  // Check if this was the last steep
  if (activeSteepIndex !== null && activeTeaTotalSteeps !== null &&
      activeSteepIndex === activeTeaTotalSteeps - 1) {
    setShowConsumptionModal(true);
  }
  setTimeLeft(null);
  setActiveTeaName(null);
  setActiveSteepIndex(null);
  // Note: Keep activeTeaId set so modal knows which tea to update
}
```

**Step 4: Update startTimer callback**

Modify the startTimer callback to accept and store the new parameters:

```typescript
const startTimer = useCallback((seconds: number, teaName: string, steepIndex: number, teaId: string, totalSteeps: number) => {
  playNotificationSound('chime');
  setTimeLeft(seconds);
  setActiveTeaName(teaName);
  setActiveSteepIndex(steepIndex);
  setActiveTeaId(teaId);
  setActiveTeaTotalSteeps(totalSteeps);
  setShowConsumptionModal(false); // Reset if starting new timer
}, []);
```

**Step 5: Add dismissConsumptionModal callback**

After startTimer:

```typescript
const dismissConsumptionModal = useCallback(() => {
  setShowConsumptionModal(false);
  setActiveTeaId(null);
  setActiveTeaTotalSteeps(null);
}, []);
```

**Step 6: Update stopTimer to also clear new state**

```typescript
const stopTimer = useCallback(() => {
  setTimeLeft(null);
  setActiveTeaName(null);
  setActiveSteepIndex(null);
  setActiveTeaId(null);
  setActiveTeaTotalSteeps(null);
  setShowConsumptionModal(false);
}, []);
```

**Step 7: Update context value**

Add the new values to the context provider value object:

```typescript
<TimerContext.Provider value={{
  timeLeft,
  activeTeaName,
  activeSteepIndex,
  activeTeaId,
  activeTeaTotalSteeps,
  showConsumptionModal,
  startTimer,
  stopTimer,
  dismissConsumptionModal
}}>
```

**Step 8: Commit**

```bash
git add src/TimerContext.tsx
git commit -m "feat: extend TimerContext to support consumption modal"
```

---

### Task 2: Create ConsumptionModal Component

**Files:**
- Create: `src/ConsumptionModal.tsx`

**Step 1: Create the component file**

```typescript
import { X } from 'lucide-react';

interface ConsumptionModalProps {
  teaName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ConsumptionModal({
  teaName,
  onConfirm,
  onCancel,
  isLoading = false,
  error = null
}: ConsumptionModalProps) {
  return (
    <div className="consumption-modal-overlay">
      <div className="consumption-modal">
        <button className="close-btn" onClick={onCancel} aria-label="Close">
          <X size={20} />
        </button>
        <div className="consumption-modal-content">
          <h3>Tea Session Complete</h3>
          <p>Mark <strong>{teaName}</strong> as done drinking?</p>
          {error && <p className="consumption-modal-error">{error}</p>}
          <div className="consumption-modal-actions">
            <button
              className="btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              No
            </button>
            <button
              className="btn-primary"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Yes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/ConsumptionModal.tsx
git commit -m "feat: add ConsumptionModal component"
```

---

### Task 3: Add Modal Styles

**Files:**
- Modify: `src/App.css`

**Step 1: Add consumption modal styles**

Add at the end of the file (before media queries if any exist at the end):

```css
/* Consumption Modal */
.consumption-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 1rem;
}

.consumption-modal {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 360px;
  position: relative;
  animation: modal-appear 0.2s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.consumption-modal .close-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  color: var(--color-text-muted);
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.consumption-modal .close-btn:hover {
  color: var(--color-text);
}

.consumption-modal-content {
  padding: 2rem;
  text-align: center;
}

.consumption-modal-content h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1.25rem;
  color: var(--color-text);
}

.consumption-modal-content p {
  margin: 0 0 1.5rem 0;
  color: var(--color-text-muted);
}

.consumption-modal-error {
  color: var(--color-error, #dc2626);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.consumption-modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.consumption-modal-actions button {
  min-width: 80px;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.consumption-modal-actions .btn-secondary {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.consumption-modal-actions .btn-secondary:hover:not(:disabled) {
  background: var(--color-background);
}

.consumption-modal-actions .btn-primary {
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  color: white;
}

.consumption-modal-actions .btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.consumption-modal-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

**Step 2: Commit**

```bash
git add src/App.css
git commit -m "feat: add consumption modal styles"
```

---

### Task 4: Integrate Modal into App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Import the ConsumptionModal component**

Add to imports at the top:

```typescript
import { ConsumptionModal } from './ConsumptionModal';
```

**Step 2: Update startTimer call in handleSteepTimeClick**

Find the `handleSteepTimeClick` function (around line 458) and update the `startTimer` call to pass tea ID and total steeps:

```typescript
const handleSteepTimeClick = (timeIdx: number, teaId: string, time: number, teaName: string, totalSteeps: number) => {
  startTimer(time, teaName, timeIdx, teaId, totalSteeps);
  // ... rest of function stays the same
};
```

**Step 3: Update where handleSteepTimeClick is called**

Find where steep time buttons call this function and add the totalSteeps parameter. Look for onClick handlers that call handleSteepTimeClick:

```typescript
onClick={() => handleSteepTimeClick(idx, tea.id, time, tea.name, tea.steepTimes.length)}
```

**Step 4: Add modal state and handlers in AppContent**

In the AppContent component, add after the existing useTimer destructuring:

```typescript
const { startTimer, showConsumptionModal, activeTeaId, dismissConsumptionModal } = useTimer();

const [modalLoading, setModalLoading] = useState(false);
const [modalError, setModalError] = useState<string | null>(null);

// Find the tea name for the modal
const modalTeaName = activeTeaId ? teas.find(t => t.id === activeTeaId)?.name ?? 'this tea' : '';

const handleConfirmConsumption = async () => {
  if (!activeTeaId) return;
  setModalLoading(true);
  setModalError(null);
  try {
    await markTeaConsumed(activeTeaId);
    showSuccess('Tea marked as consumed!');
    dismissConsumptionModal();
    fetchTeas(); // Refresh tea list
  } catch (error) {
    console.error('Failed to mark tea as consumed:', error);
    setModalError(error instanceof Error ? error.message : 'Failed to save');
  } finally {
    setModalLoading(false);
  }
};

const handleCancelConsumption = () => {
  setModalError(null);
  dismissConsumptionModal();
};
```

**Step 5: Render the modal**

Add at the end of the AppContent return, before the closing fragment:

```typescript
{showConsumptionModal && activeTeaId && (
  <ConsumptionModal
    teaName={modalTeaName}
    onConfirm={handleConfirmConsumption}
    onCancel={handleCancelConsumption}
    isLoading={modalLoading}
    error={modalError}
  />
)}
```

**Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate consumption modal into App"
```

---

### Task 5: Remove the "All Done" Button

**Files:**
- Modify: `src/App.tsx`

**Step 1: Remove button from SidePanel**

Find the SidePanel component and remove the "All Done" button section (around lines 198-206):

```typescript
// DELETE THIS BLOCK:
{showAllDoneButton && (
  <button
    className="btn-all-done"
    onClick={handleMarkConsumed}
    disabled={isDoneDrinking}
  >
    {isDoneDrinking ? 'Done' : 'All Done'}
  </button>
)}
```

**Step 2: Remove unused state and handler from SidePanel**

Remove:
- `showAllDoneButton` prop from interface
- `isDoneDrinking` state
- `handleMarkConsumed` function
- Any related imports (markTeaConsumed if only used here)

**Step 3: Update SidePanel props where it's called**

Remove the `showAllDoneButton` prop from where SidePanel is rendered.

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: remove All Done button from side panel"
```

---

### Task 6: Manual Testing

**Steps:**

1. Start the dev server: `npm run dev`
2. Select a tea and click through all its steep times
3. When the last timer completes, verify:
   - Klaxon sound plays
   - Modal appears immediately
   - Modal shows correct tea name
4. Click "No" - verify modal closes, no API call
5. Repeat test, click "Yes" - verify:
   - Loading state shows "Saving..."
   - Tea is marked as consumed (check `timesConsumed` updated)
   - Success toast appears
   - Modal closes
6. Verify the "All Done" button no longer appears in side panel

**Step 7: Final commit**

```bash
git add -A
git commit -m "feat: consumption popup on last steep timer completion"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Extend TimerContext with modal state and new parameters |
| 2 | Create ConsumptionModal component |
| 3 | Add modal CSS styles |
| 4 | Integrate modal into App.tsx with handlers |
| 5 | Remove the "All Done" button |
| 6 | Manual testing and verification |
