# Mass Regiment Update Feature

This feature allows you to select multiple players and reassign their regiments in bulk, making it much faster to correct player assignments.

## Overview

The Regiment Reassignment section now includes:
1. **Selectable rows** - Checkboxes for each player
2. **Mass update panel** - Appears when players are selected
3. **Bulk assignment** - Apply regiment to all selected players at once

## How to Use

### Step 1: Select Players
- Click checkboxes next to player names to select them
- Use the "Select All" checkbox in the header to select all visible players
- You can select players across multiple pages

### Step 2: Choose Regiment
- When players are selected, a blue panel appears at the top
- Shows count of selected players (e.g., "5 player(s) selected")
- Use the dropdown to select or type a regiment name

### Step 3: Apply Changes
- Click the "Apply" button
- All selected players are reassigned to the chosen regiment
- Changes apply to all their respawns immediately
- Selection is cleared automatically

## Use Cases

### 1. Fix Uncategorized Players
**Scenario:** Multiple players from the same regiment are uncategorized

**Steps:**
1. Filter by "Uncategorized"
2. Select all players from the same regiment
3. Assign correct regiment
4. Apply

**Example:**
```
Selected: 8 players
Regiment: 8thCT
Result: All 8 players now assigned to 8thCT
```

### 2. Correct Regiment Variations
**Scenario:** Players assigned to "8thCT.CAV" should be "8thCT"

**Steps:**
1. Filter by "8thCT.CAV (12 players)"
2. Select all players
3. Change to "8thCT"
4. Apply

### 3. Merge Similar Regiments
**Scenario:** Consolidate "1stMD.CAV", "1STMD.CAV" into "1stMD"

**Steps:**
1. Filter by first variation
2. Select all
3. Assign to "1stMD"
4. Repeat for other variations

## UI Components

### Mass Update Panel
```
┌─────────────────────────────────────────────────────────┐
│ 👥 5 player(s) selected                                 │
│                                                          │
│ [Assign Regiment ▼]  [Apply]                           │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Only visible when players are selected
- Blue tonal background for visibility
- Shows selection count
- Combobox for regiment selection (can type custom names)
- Apply button (disabled until regiment is chosen)

### Data Table
```
☑ Player Name           Current Regiment    Respawns  New Regiment
☑ [10thUS.G] Sgt. John  Uncategorized      12        [dropdown]
☑ [10thUS.I] Pvt. Jane  Uncategorized      8         [dropdown]
☐ [8thCT] Cpl. Bob      8thCT              15        [dropdown]
```

**Features:**
- Checkbox column for selection
- "Select All" checkbox in header
- Individual regiment dropdowns still available
- Can mix mass updates with individual changes

## Technical Details

### State Management
```javascript
selectedPlayers: []        // Array of selected player names
massUpdateRegiment: null   // Regiment chosen for mass update
```

### Mass Update Function
```javascript
applyMassUpdate() {
  // Build changes object
  const changes = {}
  selectedPlayers.forEach(player => {
    changes[player] = massUpdateRegiment
  })
  
  // Apply to store
  logStore.applyRegimentReassignments(changes)
  
  // Update UI
  // Clear selection
}
```

### Data Flow
1. User selects players → `selectedPlayers` array updated
2. User chooses regiment → `massUpdateRegiment` updated
3. User clicks Apply → `applyMassUpdate()` called
4. Changes sent to store → All events updated
5. UI refreshed → Selection cleared

## Benefits

### Time Savings
**Before:** Reassign 20 players individually = 20 actions
**After:** Select 20 players + 1 assignment = 2 actions

### Accuracy
- Less chance of typos when entering regiment names
- Consistent naming across multiple players
- Easy to fix parsing errors in bulk

### Workflow
1. **Filter** by problematic regiment
2. **Select** all affected players
3. **Assign** correct regiment
4. **Done** - all players updated

## Keyboard Shortcuts

- **Click checkbox** - Toggle single player
- **Click header checkbox** - Toggle all visible players
- **Tab** - Navigate between fields
- **Enter** in dropdown - Confirm selection
- **Click Apply** - Execute mass update

## Edge Cases Handled

1. ✅ **Empty selection** - Apply button disabled
2. ✅ **No regiment chosen** - Apply button disabled
3. ✅ **Selection across pages** - All selected players updated
4. ✅ **Mixed selection** - Can select any combination of players
5. ✅ **Auto-clear** - Selection cleared after successful update
6. ✅ **UI sync** - All affected rows update immediately

## Visual Feedback

### Selection Count
- Shows exact number of selected players
- Updates in real-time as you select/deselect

### Panel Visibility
- Panel only appears when players are selected
- Disappears when selection is cleared
- Blue tonal color for clear visibility

### Apply Button State
- Disabled (gray) when no regiment chosen
- Enabled (blue) when ready to apply
- Icon: check-all (✓✓)

## Future Enhancements

Potential improvements:
- Add "Select All Uncategorized" quick action
- Add "Select by Regiment" quick filter
- Show preview of changes before applying
- Add undo functionality
- Export selected players to CSV
- Bulk delete/reset functionality
