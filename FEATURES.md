# Features Documentation

## Core Features

### 1. Client-Side Log Parsing
- **Web Worker Processing**: Parsing runs in background thread to keep UI responsive
- **Progress Tracking**: Real-time progress bar during parsing
- **No Server Upload**: All processing happens locally in your browser
- **Privacy First**: Your log files never leave your computer

### 2. Round Detection

#### Explicit Rounds (Complete)
- Detected by: `OnRoundStarted` → `OnVictory`
- Status: Complete
- Includes winner information (USA/CSA)

#### Map-Bounded Rounds (Incomplete)
- Detected by: `PrepareLevel` → next `PrepareLevel` or EOF
- Status: Incomplete
- Captures map name and game rules

#### Pseudo-Rounds (Activity Clusters)
- Created after 5-minute idle gaps
- Status: Pseudo
- Map: "Unknown Map"
- Helps analyze fragmented sessions

### 3. Regiment Extraction

Automatically extracts regiment tags from player names using multiple patterns:

1. **Square Brackets**: `[10thUS.I]` → `10thUS.I`
2. **Curly Braces**: `{30thOH}` → `30thOH`
3. **Clan + Brackets**: `JD-[38th Va]` → `38th Va`
4. **Clan + Braces**: `CB{8thOH}` → `8thOH`
5. **Unit Tokens**: `1stVACav` → `1stVACav`
6. **Fallback**: `Uncategorized` for unmatched patterns

### 4. Time-Based Filtering

- **Second-Level Precision**: Filter data down to the second
- **Range Slider**: Intuitive dual-handle slider
- **Thumb Labels**: Shows time in HH:MM:SS format
- **Auto-Bounds**: Automatically sets range to data bounds
- **Real-Time Updates**: All charts update instantly

### 5. Search & Filter

- **Free-Form Text**: Search for any text
- **Player Names**: Filter by player name
- **Regiment Tags**: Filter by regiment
- **Case-Insensitive**: Matches regardless of case
- **Partial Matches**: Finds substring matches
- **Clear Button**: Quick reset

### 6. Visualizations

#### KPI Card
- Total respawns (filtered)
- Player count
- Regiment count
- Round count
- Map list

#### Respawns Over Time (Line Chart)
- 30-second time buckets
- Smooth line with area fill
- Shows activity patterns
- Tooltip with exact counts

#### Top 10 Regiments (Horizontal Bar)
- Sorted by respawn count
- Color-coded bars
- Value labels
- Responsive layout

#### Top 10 Players (Horizontal Bar)
- Sorted by respawn count
- Truncated names for long entries
- Color-coded bars
- Value labels

#### Top 5 Regiments Over Time (Multi-Line)
- Cumulative respawn counts
- 1-minute time buckets
- Color-coded lines
- Legend for identification
- Cross-hair tooltip

### 7. Warnings Panel

Displays important information about the parsed data:

- **Incomplete Rounds**: Rounds that ended without victory
- **Pseudo-Rounds**: Activity clusters created from idle gaps
- **Persistent Display**: Always visible when warnings exist
- **Color-Coded**: Different colors for different warning types

### 8. Data Export

#### CSV Export
- **Raw Data Only**: Time, Player, Regiment, RoundId, Map
- **Filtered Data**: Exports currently filtered dataset
- **Proper Formatting**: Quoted fields, comma-separated
- **Timestamped Filename**: Unique filename with timestamp

### 9. LocalStorage Caching

- **Automatic Caching**: Saves parsed data after processing
- **Quick Reload**: Instant load on page refresh
- **Single File Cache**: Only most recent log stored
- **Manual Clear**: Clear cache button available
- **Size Efficient**: Stores only essential data

### 10. Responsive Design

- **Mobile Friendly**: Works on tablets and phones
- **Adaptive Layout**: Columns stack on smaller screens
- **Touch Support**: Slider works with touch gestures
- **Dark Theme**: Easy on the eyes for long sessions

## Technical Features

### Performance Optimizations
- Web Worker prevents UI blocking
- Computed properties for efficient reactivity
- Debounced filter updates
- Efficient data structures

### Error Handling
- Try-catch blocks for parsing errors
- User-friendly error messages
- Graceful degradation
- Console logging for debugging

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Edge, Safari)
- ES6+ features
- Web Worker support required
- LocalStorage support required

## Configuration

All parsing rules are configurable in `src/config/parsing-config.json`:

```json
{
  "idleGapSeconds": 300,
  "regimentPatterns": [...],
  "rankPatterns": [...],
  "topNDefaults": {
    "regimentBar": 10,
    "playerBar": 10,
    "regimentTimeline": 5
  }
}
```

### Customizable Settings
- Idle gap duration for pseudo-rounds
- Regiment extraction patterns
- Rank patterns for filtering
- Top N limits for charts

## Future Enhancement Ideas

- Multiple log file comparison
- Team detection (USA vs CSA)
- Death/kill tracking (if available in logs)
- Map-specific analytics
- Time-of-day patterns
- Player session tracking
- Regiment performance metrics
- Export to other formats (JSON, Excel)
- Custom date range selection
- Bookmark favorite filters
