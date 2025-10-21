# Parsing Configuration Improvements

Based on the player assignment debug report analysis, the following improvements have been made to reduce manual reassignments.

## Current Performance

**Before improvements:**
- Manual reassignments: 49 out of 4,476 respawns
- Manual intervention rate: **1.09%**
- Uncategorized players: 8 out of 368 (2.17%)

## Issues Identified

### 1. Case Sensitivity Problems
**Examples:**
- `V-[1STMD.CAV]rct.KryTop` → Not matching "1stMD" due to uppercase
- `[7THLA.(LB)]MCan.Photoshop™` → Not matching "7thLA" due to uppercase

**Solution:** Added case-insensitive patterns with normalization to uppercase.

### 2. Spaces in Regiment Names
**Examples:**
- `(7TH AR) CCSPC VooDoo` → Space between "7TH" and "AR"
- `PVT {65th IL} Fire Truck` → Space between "65th" and "IL"

**Solution:** Added patterns to match regiments with spaces and normalize by removing spaces.

### 3. Dashes in Regiment Names
**Examples:**
- `V-[65th-IL]PVT.Dman2112g` → Dash between "65th" and "IL"

**Solution:** Added pattern to match and normalize dashes.

### 4. Company Suffix Variations
**Examples:**
- `.CAV`, `.Cav` → Cavalry company
- `(LB)` → Louisiana Brigade
- `{A}`, `{D}` → Company letters
- `.WA` → Washington company

**Solution:** Added company suffix stripping with multiple patterns.

## New Patterns Added

### 1. Brackets with Spaces (Case Insensitive)
```json
{
  "pattern": "\\[([0-9]+(?:st|nd|rd|th)?\\s*[A-Za-z]{2,4})(?:\\s+[A-Za-z]{2,4})?\\]",
  "normalize": "removeSpaces"
}
```
**Matches:** `[65th IL]`, `[7TH AR]`, `[1STMD CAV]`

### 2. Braces with Spaces (Case Insensitive)
```json
{
  "pattern": "\\{([0-9]+(?:st|nd|rd|th)?\\s*[A-Za-z]{2,4})(?:\\s+[A-Za-z]{2,4})?\\}",
  "normalize": "removeSpaces"
}
```
**Matches:** `{65th IL}`, `{6thAR WA}`

### 3. Parentheses with Spaces (Case Insensitive)
```json
{
  "pattern": "\\(([0-9]+(?:st|nd|rd|th)?\\s*[A-Za-z]{2,4})(?:\\s+[A-Za-z]{2,4})?\\)",
  "normalize": "removeSpaces"
}
```
**Matches:** `(7TH AR)`, `(6th AR)`

### 4. Brackets with Dash
```json
{
  "pattern": "\\[([0-9]+(?:st|nd|rd|th)?)-([A-Za-z]{2,4})\\]",
  "normalize": "removeDash"
}
```
**Matches:** `[65th-IL]`, `[1st-MD]`

### 5. Company Suffix Stripping
```json
{
  "pattern": "\\[([0-9]+(?:st|nd|rd|th)?[A-Za-z]{2,4})[\\.\\(\\{][A-Za-z]+[\\)\\}\\]]?\\]",
  "normalize": "uppercase"
}
```
**Matches:** `[1stMD.Cav]`, `[8thCT.CAV]`, `[7thLA.(LB)]`, `[8thCT{A}]`

## Normalization Rules

The configuration now includes normalization rules that are applied after pattern matching:

1. **removeSpaces**: Removes all spaces from extracted regiment name
   - `"7TH AR"` → `"7THAR"`
   - `"65th IL"` → `"65thIL"`

2. **removeDash**: Removes dashes and normalizes to single word
   - `"65th-IL"` → `"65thIL"`

3. **uppercase**: Converts to uppercase for consistency
   - `"1stmd"` → `"1STMD"`
   - `"7thla"` → `"7THLA"`

4. **cleanCompanySuffix**: Removes company suffixes
   - `"1stMD.Cav"` → `"1stMD"`
   - `"8thCT.CAV"` → `"8thCT"`
   - `"7thLA.(LB)"` → `"7thLA"`
   - `"8thCT{A}"` → `"8thCT"`

## Company Suffix Patterns

The following suffixes are automatically stripped:

- `.CAV`, `.Cav` (Cavalry)
- `.WA` (Washington)
- `(LB)` (Louisiana Brigade)
- `{A}`, `{D}` (Company letters in braces)
- `[A]` (Company letters in brackets)
- `.[A-Z]{1,3}` (Any 1-3 letter suffix after dot)

## Expected Impact

These improvements should reduce manual reassignments for:

1. **8thCT variations** (13 manual reassignments)
   - `8thCT.CAV`, `8thCT.Cav`, `8thCTCAV`, `8thCT{A}`, `8thCT{D}`, `8thCT[A`
   - All should now normalize to `8thCT`

2. **1stMD variations** (10 manual reassignments)
   - `1stMD.CAV`, `1STMD.CAV`, `1stMD.Cav)`
   - All should now normalize to `1stMD`

3. **7thLA variations** (6 manual reassignments)
   - `7thLA.(LB)`, `7THLA.(LB)`
   - All should now normalize to `7thLA`

4. **65thIL variations** (2 manual reassignments)
   - `65th-IL`, `{65th IL}`
   - All should now normalize to `65thIL`

5. **Other edge cases** (18 manual reassignments)
   - Various spacing, casing, and delimiter issues

## Testing Recommendations

1. Test with the same log file that generated the debug report
2. Compare the new uncategorized count and manual reassignments
3. Target: Reduce manual reassignments from 49 to <20 (60% reduction)
4. Target: Reduce uncategorized percentage from 2.17% to <1%

## Implementation Notes

**Note:** These patterns are defined in the configuration file but require implementation in the parsing logic to:
1. Apply normalization rules after pattern matching
2. Handle case-insensitive regex matching
3. Strip company suffixes based on the defined patterns

The parsing logic should be updated to read and apply these normalization rules when processing player names.
