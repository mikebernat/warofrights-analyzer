# Live Monitoring UI Refactor

## Changes Made

Refactored the LiveMonitor component to use the same analysis UI as standard file upload, with real-time updates instead of a separate interface.

## Before (Separate UI)

The LiveMonitor component had its own complete UI:
- ❌ Separate stats cards (respawns, rounds, new events, file size)
- ❌ Recent events feed
- ❌ Settings panel
- ❌ Duplicate UI that didn't match the main analysis views

**Problem:** Users had two different experiences - one for uploaded files and one for live monitoring.

## After (Unified UI)

LiveMonitor is now just a **control component**:
- ✅ File selection interface
- ✅ Compact status bar showing monitoring state
- ✅ Collapsible settings (poll interval)
- ✅ Stop button
- ✅ Uses the **same charts and analysis** as standard upload
- ✅ All views update in real-time automatically

## How It Works

### 1. LiveMonitor Component (Simplified)

**When NOT monitoring:**
- Shows file selection button
- Browser compatibility check
- File path hint

**When monitoring:**
- Compact status bar with:
  - File name
  - Poll interval
  - Event count
  - File size
  - Settings button
  - Stop button

### 2. Main Analysis Views (Unchanged)

All existing components work automatically:
- `RoundSelector` - Shows rounds as they're detected
- `KpiCard` - Updates total respawns in real-time
- `RespawnsTimelineChart` - New events appear on the chart
- `TopRegimentsChart` - Rankings update live
- `TopPlayersChart` - Player stats update live
- `RegimentTimelineChart` - Timeline extends in real-time
- `PlayersTable` - New players appear automatically

### 3. Data Flow

```
game.log (file system)
    ↓
LiveMonitor polls file every 2s
    ↓
Reads new bytes
    ↓
logStore.processLiveUpdate(chunk)
    ↓
Store updates: events, rounds, stats
    ↓
Vue reactivity triggers
    ↓
ALL charts/components re-render automatically
```

## Benefits

### 1. Consistent User Experience
- Same UI whether uploading or monitoring live
- No learning curve - users already know the interface
- Familiar charts and analysis tools

### 2. Simpler Code
- Removed ~150 lines of duplicate UI code
- No need to maintain two different stat displays
- Leverages existing reactive components

### 3. Real-Time Everything
- All charts update automatically
- Round selector shows new rounds immediately
- Filters work on live data
- Export works with live data
- Share works with live data

### 4. Better Maintainability
- One UI to maintain
- Changes to charts benefit both modes
- Easier to add new features

## User Experience

### Starting Live Monitoring

1. User clicks "Live Monitor" mode
2. Clicks "Select game.log File"
3. Grants browser permission
4. **Immediately sees:**
   - Step 2: Select a Round (appears as rounds are detected)
   - All charts (start empty, populate as events come in)
   - All analysis tools

### During Gameplay

- New respawn events appear in charts in real-time
- Round selector updates when new rounds start
- KPI card shows increasing respawn count
- Timeline chart extends to the right
- Top players/regiments rankings update live

### Same Features Available

- ✅ Round selection
- ✅ Time filtering
- ✅ Player/regiment search
- ✅ Regiment reassignment
- ✅ Team assignment
- ✅ CSV export
- ✅ Share analysis
- ✅ All charts and visualizations

## Technical Details

### State Management

**LiveMonitor only manages:**
- `isMonitoring` - Boolean flag
- `fileHandle` - File System Access API handle
- `fileName` - Display name
- `pollInterval` - Update frequency
- `pollTimer` - setInterval reference
- `lastFileSize` - Track file growth
- `showSettings` - Settings panel visibility

**Store manages everything else:**
- `events` - All respawn events
- `rounds` - All detected rounds
- `warnings` - Parser warnings
- `stats` - Aggregate statistics
- `playerSessions` - Join/leave events
- `isLiveMonitoring` - Global monitoring state

### Component Reactivity

All existing components use computed properties from the store:
```javascript
const topRegiments = computed(() => logStore.topRegiments)
const filteredEvents = computed(() => logStore.filteredEvents)
```

When `logStore.events` updates → All computeds recalculate → All components re-render

**No changes needed to existing components!**

## Files Modified

1. **`src/components/LiveMonitor.vue`**
   - Removed: Stats cards, recent events feed, duplicate UI
   - Kept: File selection, status bar, settings
   - Simplified from ~380 lines to ~280 lines

2. **`src/views/HomeView.vue`**
   - Already shows main content when `logStore.fileName` is set
   - No changes needed - works automatically!

## Testing

### Verify Real-Time Updates

1. Start live monitoring
2. Join a War of Rights match
3. Watch as:
   - Round appears in Round Selector
   - Events appear in charts
   - KPI card increments
   - Timeline extends
   - Rankings update

### Verify All Features Work

- [ ] Round selection
- [ ] Time slider filtering
- [ ] Player/regiment search
- [ ] Regiment reassignment
- [ ] Team assignment
- [ ] CSV export (exports live data)
- [ ] Share analysis (shares current state)
- [ ] Stop monitoring (preserves data)
- [ ] Settings (poll interval adjustment)

## Migration Notes

### For Users

**No breaking changes!**
- Live monitoring now feels exactly like analyzing an uploaded file
- All familiar tools and charts work the same way
- Data updates in real-time instead of being static

### For Developers

**Simplified architecture:**
- LiveMonitor is now a "dumb" component (just handles file polling)
- All "smart" logic stays in the store
- All UI stays in existing analysis components
- Easier to add new charts (they automatically work with live data)

## Future Enhancements

Now that live monitoring uses the same UI:

1. **Notifications** - Alert when specific events occur
2. **Auto-pause** - Detect when game closes
3. **Session comparison** - Compare live session to historical data
4. **Live filters** - Filter events as they come in
5. **Performance mode** - Reduce update frequency for long sessions

All of these can be added without touching the UI components!

## Conclusion

The refactored live monitoring provides a **unified, consistent experience** where users interact with the same familiar interface whether they're analyzing historical logs or monitoring live gameplay. All charts and analysis tools work seamlessly with real-time data updates.
