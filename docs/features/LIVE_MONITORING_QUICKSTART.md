# Live Monitoring Quick Start Guide

## What You Need

- **Browser**: Chrome or Edge (version 86+)
- **Game**: War of Rights installed and running
- **Log File**: Located at `C:\Program Files (x86)\Steam\steamapps\common\War of Rights\WarOfRights\Saved\Logs\game.log`

## ⚠️ Windows Users: Create a Hard Link First!

Windows restricts browser access to files in `Program Files`. You must create a hard link to your game.log file:

### How to Create a Hard Link

1. **Open Command Prompt as Administrator**
   - Press `Win + X`
   - Select "Terminal (Admin)" or "Command Prompt (Admin)"

2. **Run this command** (replace `<YourUsername>` with your Windows username):
   ```cmd
   mklink /H "C:\Users\<YourUsername>\Documents\game.log" "C:\Program Files (x86)\Steam\steamapps\common\War of Rights\WarOfRights\Saved\Logs\game.log"
   ```

3. **You should see**: `Hardlink created for C:\Users\<YourUsername>\Documents\game.log`

**What is a hard link?** It's like a mirror of the original file. Any changes to game.log are instantly reflected in the hard link. It doesn't duplicate the file or use extra disk space.

## Quick Start (3 Steps)

### Step 1: Switch to Live Monitor Mode
1. Open the War of Rights Log Analyzer in your browser
2. Click the **"Live Monitor"** button (instead of "Upload File")

### Step 2: Select Your Log File
1. Click **"Select game.log File"**
2. Navigate to your Documents folder (if you created a hard link):
   ```
   C:\Users\<YourUsername>\Documents\
   ```
   Or the original location (may not work on Windows):
   ```
   C:\Program Files (x86)\Steam\steamapps\common\War of Rights\WarOfRights\Saved\Logs\
   ```
3. Select `game.log`
4. Click "Open" and grant permission when prompted

### Step 3: Start Playing!
- Join a War of Rights match
- Watch as respawn events appear in real-time
- All charts and statistics update automatically

## What You'll See

### Live Stats Dashboard
- **Respawns**: Total respawn count
- **Rounds**: Number of rounds detected
- **New Events**: Events added in the last poll
- **File Size**: Current log file size

### Recent Events Feed
- Shows the last 50 events (configurable)
- Updates in real-time as players respawn
- Displays time, player name, and regiment

### Live Charts
All existing charts update automatically:
- Respawns over time
- Top regiments
- Top players
- Regiment timeline
- And more!

## Tips

### Adjust Poll Interval
- Default: 2 seconds
- Lower (1s) = More responsive, higher CPU usage
- Higher (5-10s) = Less responsive, lower CPU usage
- Open "Monitoring Settings" to adjust

### Stop Monitoring
- Click the **"Stop"** button when done
- Data remains available for analysis
- Can restart monitoring anytime

### Browser Permissions
- You only need to grant permission once per session
- Browser remembers your choice while the tab is open
- Permissions reset when you close the tab

## Troubleshooting

**"Browser doesn't support File System Access API"**
- Use Chrome or Edge (version 86+)
- Firefox and Safari are not supported

**No new events appearing**
- Make sure you're in an active match
- Check that you selected the correct `game.log` file
- Verify the game is actually writing to the log

**High CPU usage**
- Increase poll interval to 5-10 seconds
- Close other browser tabs
- Reduce "Recent Events Display" count

## Privacy & Security

✅ **All processing happens locally in your browser**
✅ **No data is uploaded to any server**
✅ **You control file access permissions**
✅ **Completely private and secure**

## Next Steps

Once monitoring is active:
1. Select a round from the Round Selector
2. Use filters to focus on specific players or regiments
3. Export data to CSV if needed
4. Share your analysis with others (requires backend server)

For more details, see the full [Live Monitoring Documentation](LIVE_MONITORING.md).
