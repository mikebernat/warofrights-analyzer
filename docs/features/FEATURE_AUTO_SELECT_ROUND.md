# Auto-Select Latest Round Feature

## Overview

During live monitoring, the application now automatically selects the latest round when a new round is detected. This provides a seamless experience where users always see the most current round's analysis.

## Behavior

### When Live Monitoring Starts
- Round selection is reset to `null`
- User sees "Select a Round" prompt
- Waiting for first round to be detected

### When First Round is Detected
- Round 1 appears in Round Selector
- **Automatically selected**
- All charts and analysis show Round 1 data
- User can immediately see live analysis

### When New Rounds Start
- New round detected (e.g., Round 2, Round 3, etc.)
- **Automatically switches to the new round**
- Charts update to show the new round's data
- Time range adjusts to the new round's bounds
- Console logs: "Auto-selected new round X"

### User Override
- User can manually select any previous round
- Auto-selection **only happens when a NEW round is detected**
- If user is viewing Round 1, and Round 2 starts → switches to Round 2
- User can then manually go back to Round 1 if desired

## Implementation

### File: `src/stores/logStore.js`

#### 1. Reset Selection on Start
```javascript
async startLiveMonitoring(fileName) {
  // ...
  this.selectedRoundId = null // Reset round selection
  // ...
}
```

#### 2. Auto-Select on New Round
```javascript
async processLiveUpdate(chunk) {
  // Track previous round count
  const previousRoundCount = this.rounds.length
  
  // Process chunk...
  
  // Auto-select latest round when new round is detected
  if (state.rounds.length > previousRoundCount && state.rounds.length > 0) {
    const latestRound = state.rounds[state.rounds.length - 1]
    this.setSelectedRound(latestRound.id)
    console.log(`Auto-selected new round ${latestRound.id}`)
  }
}
```

## User Experience

### Scenario 1: Starting Mid-Game

1. User starts live monitoring while a match is in progress
2. Parser detects Round 1 from log history
3. **Round 1 auto-selected**
4. User immediately sees current round analysis
5. When Round 2 starts → **auto-switches to Round 2**

### Scenario 2: Starting Before Match

1. User starts live monitoring before joining a match
2. No rounds detected yet
3. User joins match, round starts
4. **Round 1 auto-selected** when detected
5. Analysis appears automatically

### Scenario 3: Reviewing Previous Round

1. Currently on Round 3 (auto-selected)
2. User manually selects Round 2 to review
3. User is viewing Round 2 analysis
4. Round 4 starts in the game
5. **Auto-switches to Round 4**
6. User can manually go back to Round 2 if needed

## Benefits

### 1. Zero Configuration
- No user action required
- Always shows the most relevant data
- "Just works" out of the box

### 2. Immediate Feedback
- As soon as a round starts, analysis appears
- No need to manually select rounds
- Focus stays on the current action

### 3. Seamless Transitions
- Automatic switching between rounds
- Charts update smoothly
- Time range adjusts automatically

### 4. Still Flexible
- Users can manually select any round
- Full control when needed
- Auto-selection doesn't lock them in

## Technical Details

### Round Detection

Rounds are detected by the parser when it encounters:
- `CGameRulesEventHelper::OnRoundStarted` events
- Idle gaps (pseudo-rounds)
- Map changes

### Selection Trigger

Auto-selection triggers when:
```javascript
state.rounds.length > previousRoundCount
```

This ensures:
- Only NEW rounds trigger selection
- Re-processing existing rounds doesn't cause switches
- Works with incremental parsing

### Time Range Update

When a round is selected (auto or manual), `setSelectedRound()` also:
- Updates time range to match round bounds
- Filters events to the selected round
- Adjusts all charts and visualizations

## Edge Cases Handled

### 1. Multiple Rounds in One Update
If multiple rounds are detected in a single chunk:
- Only the **latest** round is selected
- Intermediate rounds are skipped
- User sees the most current state

### 2. File Reset/Truncation
If the log file is reset:
- Parser resets
- Round count goes to 0
- Next round detected will be auto-selected

### 3. Component Unmount
If monitoring stops:
- Round selection is preserved
- User can review the data
- Re-starting monitoring resets selection

## Console Logging

For debugging and transparency:
```
Live monitoring started for: game.log
Auto-selected new round 1
Auto-selected new round 2
Auto-selected new round 3
```

## Future Enhancements

Potential improvements:
1. **User Preference**: Toggle auto-selection on/off
2. **Notification**: Visual indicator when round switches
3. **History**: "Previous Round" / "Next Round" buttons
4. **Sticky Selection**: Option to stay on manually selected round
5. **Smart Selection**: Don't auto-switch if user is actively interacting

## Testing

### Verify Auto-Selection

1. Start live monitoring
2. Join a War of Rights match
3. Observe:
   - Round 1 appears and is auto-selected
   - Charts show Round 1 data
   - When Round 2 starts, it auto-switches
   - Console shows "Auto-selected new round X"

### Verify Manual Override

1. During Round 2, manually select Round 1
2. Verify Round 1 data is shown
3. When Round 3 starts, verify it auto-switches to Round 3
4. Manually select Round 1 again
5. Verify you can stay on Round 1

## Conclusion

The auto-select feature provides an intelligent, hands-free experience for live monitoring. Users can focus on gameplay while the analyzer automatically tracks and displays the current round's statistics in real-time.
