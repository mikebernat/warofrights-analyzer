# Player Presence Tracking Feature

This feature tracks when players join and leave the server, calculating their total presence time for each round.

## Overview

The system now tracks:
1. **Player Join Events** - When a player joins the server
2. **Player Leave Events** - When a player leaves the server
3. **Presence Time** - Total time a player was present during a round
4. **Presence Percentage** - Percentage of the round the player was present

## Log Parsing

### Join Event Pattern
```
<13:39:14> Player [10thUS.G] CSgt. Spam has joined the server. SteamID: 76561198031150336. DLC: 0
```
- Extracts player name (without SteamID)
- Records timestamp and round ID

### Leave Event Pattern
```
<13:41:18> Player [10thUS.I] Pvt. Legend has left the server. SteamID: 76561197960443557
```
- Extracts player name (without SteamID)
- Records timestamp and round ID

## Presence Time Calculation

The system handles multiple scenarios:

### 1. Player Present Before Round Start
If a player has respawns but no join event, they were present at round start.
```
Presence Time = Round End - Round Start
```

### 2. Player Joins and Leaves Multiple Times
Tracks all join/leave pairs and sums the durations.
```
Total Presence = Σ(Leave Time - Join Time)
```

### 3. Player Joins But Never Leaves
If player joins but has no leave event, counts until round end.
```
Presence Time = Round End - Join Time
```

### 4. First Event is Leave
If first event is a leave (no join), player was present at round start.
```
Presence Time = Leave Time - Round Start + (subsequent join/leave pairs)
```

## Display Format

### Players by Regiment Table
Each player now shows:
- **Player Name**
- **Respawns** - Total respawn count
- **Presence Time** - Formatted as `HH:MM:SS`
- **Percentage Badge** - Color-coded percentage of round presence

### Color Coding
- **Green (Success)**: ≥80% presence
- **Orange (Warning)**: 50-79% presence
- **Red (Error)**: <50% presence

## Example

**Round Duration:** 60 minutes (3600 seconds)

**Player A:**
- Present entire round
- Presence: `01:00:00` (100%)

**Player B:**
- Joined at 10 minutes
- Left at 40 minutes
- Rejoined at 50 minutes
- Round ended at 60 minutes
- Presence: `00:40:00` (67%)

**Player C:**
- Present at start
- Left at 20 minutes
- Never rejoined
- Presence: `00:20:00` (33%)

## Data Storage

### Store State
```javascript
playerSessions: [
  {
    player: "PlayerName",
    action: "join" | "leave",
    time: 12345, // seconds
    roundId: 1
  }
]
```

### Cache
Player sessions are cached to localStorage along with events and rounds.

## API

### `getPlayerPresenceTime(playerName, roundId)`
Calculates presence time for a specific player and round.

**Parameters:**
- `playerName` (string) - Name of the player
- `roundId` (number|null) - Round ID, or null for all rounds

**Returns:**
```javascript
{
  totalSeconds: 3600,
  percentage: 100,
  formattedTime: "01:00:00"
}
```

## Edge Cases Handled

1. ✅ Players present before round starts (no join event)
2. ✅ Players who join and leave multiple times
3. ✅ Players who join but never leave (counted until round end)
4. ✅ Players whose first event is a leave (present at start)
5. ✅ Join/leave events outside round boundaries (clamped to round start/end)
6. ✅ Empty player sessions (assumes full presence if respawns exist)

## Performance Considerations

- Presence calculation is done on-demand in computed properties
- Results are cached per render cycle
- Efficient filtering by round ID
- No impact on log parsing performance

## Future Enhancements

Potential improvements:
- Add presence time to CSV export
- Show join/leave timeline visualization
- Filter players by presence percentage
- Show average presence time per regiment
- Track AFK time (long periods without respawns)
