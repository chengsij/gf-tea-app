# Tea Consumption Popup Design

## Overview

Replace the "All Done" button with a modal popup that appears when the last steep timer completes, asking users if they want to mark the tea as done drinking.

## Requirements

- When the last steep timer hits zero, immediately show a modal popup
- Popup asks: "Mark {teaName} as done drinking?"
- User can click Yes or No
- If Yes: call the existing markTeaConsumed API endpoint
- If No: simply close the popup
- Popup stays until user responds (no auto-dismiss)
- Remove the existing "All Done" button from the side panel

## Architecture

### Trigger Logic

The TimerContext already tracks `activeSteepIndex` and `activeTeaName`. When the timer reaches zero:
1. Check if `activeSteepIndex` equals the last steep index for the active tea
2. If yes, set `showConsumptionModal = true` in addition to playing the klaxon sound

### Components

**New Component: ConsumptionModal**
- Props: `isOpen`, `teaName`, `onConfirm`, `onCancel`
- Centered modal with semi-transparent backdrop
- Text: "Mark {teaName} as done drinking?"
- Two buttons: "Yes" and "No"

### Data Flow

```
Timer hits 0 + isLastSteep
  → TimerContext sets showConsumptionModal = true
  → App.tsx renders ConsumptionModal
  → User clicks Yes → call markTeaConsumed(id) → close modal
  → User clicks No → close modal (no API call)
```

### Files to Modify

1. **src/TimerContext.tsx** - Add `showConsumptionModal` state and logic to trigger it
2. **src/App.tsx** - Render ConsumptionModal, remove "All Done" button from SidePanel
3. **src/ConsumptionModal.tsx** - New component (create)
4. **src/App.css** - Modal styling

### Error Handling

- If API call fails when marking consumed, show error and keep modal open for retry
- If tea data unavailable when timer ends, skip the modal

## Decisions

- **Popup timing**: Immediately when timer hits zero (not delayed)
- **Button removal**: "All Done" button removed entirely (popup is the only way)
- **Auto-dismiss**: None - popup stays until user responds
