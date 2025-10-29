# Disable Share During Live Monitoring

## Overview

The Share button is now disabled during live monitoring to prevent sharing incomplete or constantly changing data. A tooltip explains why the feature is unavailable.

## Rationale

### Why Disable Sharing During Live Monitoring?

1. **Data is Constantly Changing**
   - Live monitoring data updates every 2 seconds
   - Shared snapshot would be outdated immediately
   - Recipient would see stale data

2. **Incomplete Rounds**
   - Current round is likely still in progress
   - Stats are incomplete and misleading
   - Better to share after the round/match completes

3. **User Intent**
   - Users typically want to share final results
   - Live data is for personal real-time analysis
   - Sharing is more meaningful with complete data

4. **Server Resources**
   - Prevents accidental repeated shares
   - Avoids storing multiple snapshots of same session
   - Reduces unnecessary API calls

## Implementation

### File: `src/App.vue`

**Before:**
```vue
<v-btn
  v-if="logStore.fileName && !isShareView"
  :disabled="logStore.selectedRoundId === null"
  @click="showShareModal = true"
>
  Share
</v-btn>
```

**After:**
```vue
<v-tooltip location="bottom">
  <template v-slot:activator="{ props }">
    <v-btn
      v-if="logStore.fileName && !isShareView"
      :disabled="logStore.selectedRoundId === null || logStore.isLiveMonitoring"
      @click="showShareModal = true"
      v-bind="props"
    >
      Share
    </v-btn>
  </template>
  <span v-if="logStore.isLiveMonitoring">
    Sharing is disabled during live monitoring. Stop monitoring to share this analysis.
  </span>
  <span v-else-if="logStore.selectedRoundId === null">
    Select a round to share
  </span>
  <span v-else>
    Share this analysis with others
  </span>
</v-tooltip>
```

## User Experience

### During Live Monitoring

**Button State:**
- ✅ Visible but disabled (grayed out)
- ✅ Cursor shows "not-allowed" on hover
- ✅ Tooltip appears explaining why

**Tooltip Message:**
```
"Sharing is disabled during live monitoring. 
Stop monitoring to share this analysis."
```

### When Round Not Selected

**Tooltip Message:**
```
"Select a round to share"
```

### When Ready to Share

**Tooltip Message:**
```
"Share this analysis with others"
```

## Workflow

### Scenario 1: User Wants to Share Live Session

1. User is live monitoring a match
2. Hovers over Share button
3. Sees tooltip: "Sharing is disabled during live monitoring..."
4. Clicks Stop button to end monitoring
5. Share button becomes enabled
6. User can now share the complete analysis

### Scenario 2: User Forgets They're Live Monitoring

1. User tries to click Share button
2. Button is disabled (no action)
3. Tooltip reminds them they're in live mode
4. User decides to wait until match ends
5. Stops monitoring when ready
6. Shares the final results

## Benefits

### 1. Prevents Confusion
- Clear feedback about why sharing is unavailable
- Users understand the limitation
- Guided toward the correct workflow

### 2. Better Shared Content
- Only complete, final data is shared
- Recipients get meaningful analysis
- No confusion about incomplete rounds

### 3. Reduced Server Load
- Prevents rapid-fire share attempts
- Avoids storing duplicate snapshots
- Cleaner share database

### 4. Intentional Sharing
- Users make conscious decision to share
- Stop monitoring → Review data → Share
- More thoughtful sharing process

## Technical Details

### Disabled Condition

```javascript
:disabled="logStore.selectedRoundId === null || logStore.isLiveMonitoring"
```

Button is disabled when:
- No round is selected **OR**
- Live monitoring is active

### Tooltip Logic

```vue
<span v-if="logStore.isLiveMonitoring">
  <!-- Live monitoring message -->
</span>
<span v-else-if="logStore.selectedRoundId === null">
  <!-- No round selected message -->
</span>
<span v-else>
  <!-- Ready to share message -->
</span>
```

Priority:
1. Live monitoring check (highest priority)
2. Round selection check
3. Default ready state

### State Management

Uses existing store state:
- `logStore.isLiveMonitoring` - Boolean flag
- `logStore.selectedRoundId` - Currently selected round

No additional state needed!

## Edge Cases

### 1. User Stops Monitoring
- `isLiveMonitoring` becomes `false`
- Share button automatically enables
- Tooltip updates to "Share this analysis with others"

### 2. User Switches Rounds During Live Monitoring
- Share button stays disabled
- Tooltip still shows live monitoring message
- Consistent behavior

### 3. User Uploads File After Live Monitoring
- `isLiveMonitoring` is `false`
- Share button works normally
- No interference with standard workflow

## Alternative Approaches Considered

### 1. Hide Button Completely
**Rejected:** Less discoverable, users might wonder where it went

### 2. Allow Sharing with Warning
**Rejected:** Too complex, users might share incomplete data anyway

### 3. Auto-Share on Stop
**Rejected:** Presumptuous, not all sessions should be shared

### 4. Queue Share for Later
**Rejected:** Over-engineered, simple disable is clearer

## Future Enhancements

Potential improvements:

1. **"Share When Done" Button**
   - Queue share action
   - Automatically share when monitoring stops
   - One-click workflow

2. **Session Bookmarking**
   - Mark interesting moments during live monitoring
   - Share specific bookmarked events
   - More granular sharing

3. **Live Share Links**
   - Generate temporary live-updating share links
   - Recipients see real-time updates
   - Requires WebSocket infrastructure

4. **Share History**
   - Track previously shared sessions
   - Quick re-share of past analyses
   - Avoid duplicate shares

## Testing

### Verify Disabled State

1. Start live monitoring
2. Select a round (auto-selected)
3. Observe Share button is disabled
4. Hover over button
5. Verify tooltip: "Sharing is disabled during live monitoring..."

### Verify Re-Enable

1. While live monitoring, click Stop
2. Observe Share button becomes enabled
3. Hover over button
4. Verify tooltip: "Share this analysis with others"

### Verify Round Selection

1. Upload a file (not live monitoring)
2. Don't select a round
3. Observe Share button is disabled
4. Verify tooltip: "Select a round to share"
5. Select a round
6. Observe Share button becomes enabled

## Documentation Updates

Updated files:
- `src/App.vue` - Added tooltip and disabled condition
- `FEATURE_DISABLE_SHARE_LIVE.md` - This documentation

Related documentation:
- `docs/features/LIVE_MONITORING_GUIDE.md` - Mentions sharing limitation
- `docs/features/LIVE_MONITORING_QUICKSTART.md` - Notes sharing workflow

## Conclusion

Disabling the Share button during live monitoring provides clear, helpful feedback to users while preventing the sharing of incomplete or constantly changing data. The tooltip-based approach maintains discoverability while guiding users toward the correct workflow: stop monitoring, review the complete data, then share.
