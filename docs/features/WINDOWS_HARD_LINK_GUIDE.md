# Windows Hard Link Guide for Live Monitoring

## Why Do I Need a Hard Link?

Windows has security restrictions that prevent browsers from accessing files in protected system directories like `Program Files`. The War of Rights game.log file is located in:

```
C:\Program Files (x86)\Steam\steamapps\common\War of Rights\WarOfRights\Saved\Logs\game.log
```

When you try to select this file using the File System Access API, Windows will block the browser from reading it, even if you grant permission.

## The Solution: Hard Links

A **hard link** is a direct reference to a file on your disk. It's not a copy or shortcut - it's another name for the exact same file. When the game writes to `game.log`, the changes are instantly visible in the hard link.

### Benefits

✅ **No duplication** - Doesn't use extra disk space  
✅ **Real-time sync** - Changes appear instantly  
✅ **Browser accessible** - Located in your user folder  
✅ **Permanent** - Stays until you delete it  

## How to Create a Hard Link

### Step 1: Open Command Prompt as Administrator

**Method 1: Using Win + X**
1. Press `Win + X` on your keyboard
2. Select "Terminal (Admin)" or "Command Prompt (Admin)"
3. Click "Yes" when prompted by User Account Control

**Method 2: Using Start Menu**
1. Click the Start button
2. Type "cmd"
3. Right-click "Command Prompt"
4. Select "Run as administrator"
5. Click "Yes" when prompted

### Step 2: Find Your Windows Username

If you don't know your username, type this command:
```cmd
echo %USERNAME%
```

This will display your Windows username (e.g., "John", "Sarah", etc.)

### Step 3: Create the Hard Link

Copy and paste this command, replacing `<YourUsername>` with your actual Windows username:

```cmd
mklink /H "C:\Users\<YourUsername>\Documents\game.log" "C:\Program Files (x86)\Steam\steamapps\common\War of Rights\WarOfRights\Saved\Logs\game.log"
```

**Example** (if your username is "John"):
```cmd
mklink /H "C:\Users\John\Documents\game.log" "C:\Program Files (x86)\Steam\steamapps\common\War of Rights\WarOfRights\Saved\Logs\game.log"
```

### Step 4: Verify Success

You should see this message:
```
Hardlink created for C:\Users\<YourUsername>\Documents\game.log <<===>> C:\Program Files (x86)\...\game.log
```

## Using the Hard Link

### In Live Monitoring

1. Click "Select game.log File"
2. Navigate to: `C:\Users\<YourUsername>\Documents\`
3. Select `game.log`
4. Grant browser permission
5. Start monitoring!

### Verifying It Works

1. Open File Explorer
2. Navigate to `C:\Users\<YourUsername>\Documents\`
3. You should see `game.log` listed
4. Right-click it → Properties
5. The file size should match the original game.log

## Troubleshooting

### "Access is denied"

**Problem:** You didn't run Command Prompt as Administrator

**Solution:** 
- Close Command Prompt
- Follow Step 1 again, making sure to select "Run as administrator"
- Try the mklink command again

### "The system cannot find the path specified"

**Problem:** The game.log file doesn't exist yet, or the path is wrong

**Solution:**
1. Launch War of Rights at least once to create the log file
2. Verify the game path is correct for your Steam installation
3. Check if Steam is installed in a custom location

### "A file with that name already exists"

**Problem:** You already created a hard link, or a file named game.log exists in Documents

**Solution:**
- Delete the existing `C:\Users\<YourUsername>\Documents\game.log`
- Run the mklink command again

### Hard Link Shows 0 KB

**Problem:** The original game.log is empty or hasn't been created yet

**Solution:**
- Launch War of Rights to create/populate the log file
- The hard link will automatically show the correct size

### Changes Not Appearing

**Problem:** The hard link might not be working correctly

**Solution:**
1. Delete the hard link
2. Create it again using the mklink command
3. Verify both files show the same size and modification date

## Alternative Locations

If you don't want to use Documents folder, you can create the hard link anywhere in your user folder:

### Desktop
```cmd
mklink /H "C:\Users\<YourUsername>\Desktop\game.log" "C:\Program Files (x86)\Steam\steamapps\common\War of Rights\WarOfRights\Saved\Logs\game.log"
```

### Downloads
```cmd
mklink /H "C:\Users\<YourUsername>\Downloads\game.log" "C:\Program Files (x86)\Steam\steamapps\common\War of Rights\WarOfRights\Saved\Logs\game.log"
```

### Custom Folder
```cmd
mklink /H "C:\Users\<YourUsername>\WarOfRights\game.log" "C:\Program Files (x86)\Steam\steamapps\common\War of Rights\WarOfRights\Saved\Logs\game.log"
```

## Deleting a Hard Link

To remove the hard link (this does NOT delete the original file):

1. Navigate to where you created it (e.g., Documents)
2. Right-click `game.log`
3. Select "Delete"

The original game.log in the War of Rights folder remains untouched.

## Technical Details

### What is mklink?

`mklink` is a Windows command that creates symbolic links and hard links:
- `/H` flag creates a hard link (what we need)
- `/D` flag creates a symbolic link (directory junction)
- `/J` flag creates a directory junction

### Hard Link vs Symbolic Link

**Hard Link** (what we use):
- Direct reference to file data on disk
- Works even if original path changes
- Requires both files on same drive
- Deleting one doesn't affect the other

**Symbolic Link**:
- Pointer to another file path
- Breaks if original is moved/deleted
- Can span different drives
- Requires admin rights to create

### Why Not Use a Copy?

Copying the file would:
- ❌ Use double the disk space
- ❌ Require manual updates
- ❌ Show stale data
- ❌ Not reflect real-time changes

Hard links solve all these problems!

## Security Considerations

### Is This Safe?

✅ **Yes!** Hard links are a standard Windows feature  
✅ **No security risk** - You're just creating another reference to your own file  
✅ **No admin access** - The hard link doesn't grant elevated permissions  
✅ **Easily reversible** - Delete it anytime  

### Privacy

- The hard link is only accessible to your user account
- Browser can only read it (not write)
- No data is uploaded to any server
- All processing happens locally

## FAQ

**Q: Will this slow down my game?**  
A: No, hard links have zero performance impact.

**Q: Do I need to recreate it after updates?**  
A: No, the hard link persists across game updates.

**Q: Can I create multiple hard links?**  
A: Yes, you can create as many as you want.

**Q: Will this work on Linux/Mac?**  
A: This guide is Windows-specific. Linux/Mac don't have the same Program Files restrictions.

**Q: What if I reinstall the game?**  
A: You'll need to recreate the hard link pointing to the new location.

**Q: Does this work for other games?**  
A: Yes! You can use this technique for any game with logs in Program Files.

## Summary

Creating a hard link is a one-time setup that:
1. Takes 30 seconds
2. Requires no technical knowledge
3. Enables live monitoring on Windows
4. Has no downsides or risks

Once created, you can use live monitoring anytime without repeating this process!
