# Live Monitoring Complete Guide

## Table of Contents
- [Quick Start](#quick-start)
- [Windows Setup (Hard Link)](#windows-setup-hard-link)
- [Features](#features)
- [How It Works](#how-it-works)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Quick Start

### Requirements
- **Browser**: Chrome or Edge 86+
- **Game**: War of Rights installed
- **OS**: Windows (requires hard link setup)

### 3-Step Setup

#### Step 1: Create Hard Link (Windows Only - One Time Setup)

Windows restricts browser access to files in `Program Files`. Create a hard link first:

1. **Open Command Prompt as Administrator**
   - Press `Win + X`
   - Select "Terminal (Admin)" or "Command Prompt (Admin)"

2. **Run this command** (replace `<YourUsername>` with your Windows username):
   ```cmd
   mklink /H "C:\Users\<YourUsername>\Documents\game.log" "C:\Program Files (x86)\Steam\steamapps\common\War of Rights\WarOfRights\Saved\Logs\game.log"
   ```

3. **Verify**: You should see "Hardlink created for..."

#### Step 2: Start Live Monitoring

1. Open the analyzer in Chrome/Edge
2. Click **"Live Monitor"** mode
3. Click **"Select game.log File"**
4. Navigate to `C:\Users\<YourUsername>\Documents\`
5. Select `game.log` (the hard link you created)
6. Grant browser permission

#### Step 3: Play!

- Join a War of Rights match
- Watch events appear in real-time
- All charts update automatically

---

## Windows Setup (Hard Link)

### Why Is This Needed?

Windows security prevents browsers from accessing files in `Program Files`. A hard link creates a reference to the file in your user folder that the browser can access.

### What Is a Hard Link?

- **Not a copy** - It's another name for the same file
- **No extra space** - Doesn't duplicate data
- **Real-time sync** - Changes appear instantly
- **Permanent** - Stays until you delete it

### Detailed Instructions

See [WINDOWS_HARD_LINK_GUIDE.md](WINDOWS_HARD_LINK_GUIDE.md) for:
- Troubleshooting
- Alternative locations
- Technical details
- FAQ

---

## Features

### Real-Time Updates
- **Poll Interval**: Configurable 1-10 seconds (default: 2s)
- **Incremental Parsing**: Only processes new data
- **Live Charts**: All visualizations update automatically
- **Auto-Select Round**: Latest round selected automatically

### Unified Interface
- **Same UI as Upload**: Familiar interface
- **All Features Available**: Filters, export, team assignment
- **Round Selection**: Switch between rounds anytime
- **Time Filtering**: Filter events in real-time

### Privacy & Performance
- **Local Processing**: All parsing in your browser
- **Web Worker**: Off-main-thread parsing
- **No Uploads**: Data never leaves your computer
- **Memory Efficient**: Incremental processing

### Limitations
- **Browser Support**: Chrome/Edge 86+ only
- **Windows Only**: Hard link required for Windows
- **Sharing Disabled**: Must stop monitoring to share
- **Browser Must Stay Open**: Monitoring stops if you close the tab

---

## How It Works

### Architecture

```
game.log (file system)
    ↓
Hard Link in Documents folder
    ↓
File System Access API (browser permission)
    ↓
LiveMonitor component (polls every 2s)
    ↓
Read new bytes since last check
    ↓
live-monitor.worker.js (Web Worker)
    ↓
Incremental parsing with state preservation
    ↓
Store updates (events, rounds, stats)
    ↓
Vue reactivity triggers
    ↓
All charts/components re-render
```

### Incremental Parsing

The parser maintains state between updates:
- **Line Buffering**: Handles partial lines across chunks
- **Round Tracking**: Remembers current round
- **Event Accumulation**: Builds complete event list
- **State Preservation**: No re-parsing of old data

### Auto-Select Latest Round

When a new round starts:
1. Parser detects `OnRoundStarted` event
2. Round count increases
3. Store automatically selects the new round
4. Charts switch to show new round data
5. User sees current action without manual selection

---

## Troubleshooting

### "Browser doesn't support File System Access API"
**Solution**: Use Chrome or Edge 86+. Firefox and Safari are not supported.

### File Selection Fails
**Problem**: Trying to select file from Program Files  
**Solution**: Create hard link and select from Documents folder

### No New Events Appearing
**Check**:
- Game is running and logging events
- You're in an active match
- File is the hard link (not original)
- Browser has permission to access file

### High CPU Usage
**Solutions**:
- Increase poll interval to 5-10 seconds
- Close other browser tabs
- Reduce number of charts displayed

### Parser State Issues
**Solution**: Click "Stop" and restart monitoring to reset parser state

### Hard Link Not Working
**Check**:
- Command ran successfully (saw "Hardlink created")
- Both files show same size in File Explorer
- Hard link is in user-accessible location (Documents)

---

## FAQ

### Can I share my live monitoring session?
No, sharing is disabled during live monitoring. Stop monitoring first, then share the complete analysis.

### Does this work on Mac/Linux?
The hard link requirement is Windows-specific. Mac/Linux users may be able to select the file directly, but this is untested.

### Will this slow down my game?
No, the hard link and file monitoring have zero impact on game performance.

### Do I need to recreate the hard link after game updates?
No, the hard link persists across game updates.

### Can I monitor multiple log files?
Not currently. Only one file can be monitored at a time.

### What happens if I close the browser?
Monitoring stops. The data you've collected is preserved, but no new events will be captured.

### Can I use this for other games?
Yes! The hard link technique works for any game with logs in Program Files.

### How much disk space does the hard link use?
Zero. It's a reference to the existing file, not a copy.

### Is my data uploaded anywhere?
No. All processing happens locally in your browser. Nothing is uploaded.

### Can I export data from live monitoring?
Yes! CSV export works the same as with uploaded files.

---

## Advanced Topics

### Configuring Poll Interval

**Lower interval (1-2s)**:
- ✅ More responsive
- ✅ Events appear faster
- ❌ Higher CPU usage

**Higher interval (5-10s)**:
- ✅ Lower CPU usage
- ✅ Better for long sessions
- ❌ Slight delay in updates

### Server-Based Alternative

For browsers without File System Access API support, a WebSocket server option is available:

```bash
cd server
npm install
npm run live-monitor
```

See [server/README.md](../server/README.md) for details.

### Technical Implementation

For developers interested in how it works:
- [features/LIVE_MONITORING_IMPLEMENTATION.md](features/LIVE_MONITORING_IMPLEMENTATION.md) - Complete technical overview
- [features/REFACTOR_LIVE_MONITORING_UI.md](features/REFACTOR_LIVE_MONITORING_UI.md) - UI architecture
- [features/FEATURE_AUTO_SELECT_ROUND.md](features/FEATURE_AUTO_SELECT_ROUND.md) - Auto-selection logic
- [features/FEATURE_DISABLE_SHARE_LIVE.md](features/FEATURE_DISABLE_SHARE_LIVE.md) - Share button behavior

---

## Summary

Live monitoring provides a seamless, real-time experience for analyzing War of Rights gameplay:

1. **One-time setup**: Create hard link (30 seconds)
2. **Start monitoring**: Select file and grant permission
3. **Play normally**: Events appear automatically
4. **Analyze in real-time**: All charts update live
5. **Stop when done**: Data preserved for sharing

The feature uses the same familiar interface as file upload, with all analysis tools available in real-time.
