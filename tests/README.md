# Regiment Parser Tests

Unit tests for the regiment extraction logic to ensure player names are correctly parsed.

## Running Tests

```bash
# Install dependencies (if not already installed)
npm install

# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui
```

## Test Coverage

### CB Clan Format Tests
Tests for the CB clan prefix pattern where the clan tag appears before brackets/braces containing a sub-regiment.

**Format:** `CB[regiment]`, `CB{regiment}`, `CB [regiment]`, `CB_regiment`

**Examples:**
- `CB[30thOH]Pvt. Riley Gaming` → `CB`
- `CB{30thOh}Cpt.HomelessBanana` → `CB`
- `CB {30thOH} Merc. Minty` → `CB`
- `CB_8ThOhio_Pv2_Sword` → `CB`
- `cb{30thoh} Pvt. Dragonov` → `CB` (case insensitive)

### Standard Regiment Format Tests
Tests for common regiment name patterns in brackets, braces, and parentheses.

**Examples:**
- `[8thCT.Cav]1Sgt. Mucho Bitey` → `8thCT`
- `V-[1stMD.Cav]SgtMaj.UMP45` → `1stMD`
- `V-[65th-IL]PVT.Dman2112g` → `65thIL`
- `PVT {65th IL} Fire Truck` → `65thIL`
- `(7TH AR) CCSPC VooDoo` → `7thAR`

### Edge Cases
Tests for unusual patterns and edge cases.

**Examples:**
- Mixed case: `[1STMD.CAV]rct.KryTop` → `1stMD`
- Spaces: `[7THLA.(LB)]MCan.Photoshop™` → `7thLA`
- Special chars: `CB[8thOH]Pfc. Henry Kissinger (` → `CB`
- No match: `RandomPlayerName123` → `Uncategorized`

### Company Suffix Removal
Tests for automatic removal of company designators.

**Examples:**
- `[8thCT.CAV]Sgt. Woodhams` → `8thCT`
- `[1stMD.Cav]Sgt.Harold` → `1stMD`
- `[7thLA.(LB)]Cpl.Williman` → `7thLA`
- `[8thCT{A}]Pfc. Puncakian` → `8thCT`

## Pattern Priority

Patterns are tested in order of priority:

1. **CB Clan with Brackets** - Highest priority for CB clan members
2. **Brackets with Spaces** - Handles spaced regiment names
3. **Braces with Spaces** - Handles spaced regiment names in braces
4. **Prefix Before Any Wrapper** - Generic prefix extraction
5. **Square Brackets (Generic)** - Fallback for bracket patterns
6. **Curly Braces (Generic)** - Fallback for brace patterns
7. **Underscore Delimiter** - Handles underscore-separated names

## Adding New Tests

To add a new test case:

1. Identify the player name pattern
2. Determine the expected regiment
3. Add test to appropriate `describe` block
4. Run tests to verify

Example:
```javascript
it('should extract REGIMENT from PLAYER_NAME', () => {
  expect(parser.extractRegiment('PLAYER_NAME')).toBe('REGIMENT')
})
```

## Test Structure

```
tests/
├── README.md                    # This file
└── regiment-parser.test.js      # Main test file
```

## Debugging Failed Tests

If a test fails:

1. Check the pattern priority in `parsing-config.json`
2. Verify the regex pattern matches the player name
3. Check normalization rules are applied correctly
4. Ensure case-insensitive matching is enabled
5. Look for conflicting patterns with higher priority

## Pattern Configuration

The actual patterns are defined in:
- `src/config/parsing-config.json` - Pattern definitions
- `src/workers/log-parser.worker.js` - Pattern matching logic

## Normalization Rules

The parser applies these normalizations:

1. **removeSpaces** - Remove all spaces from regiment name
2. **removeDash** - Remove dashes from regiment name
3. **uppercase** - Convert to uppercase
4. **cleanCompanySuffix** - Remove company suffixes (.CAV, .Cav, (LB), {A}, etc.)
5. **extractCB** - Special rule to extract "CB" clan prefix

## Common Issues

### Issue: CB players assigned to wrong regiment
**Problem:** `CB[30thOH]` being assigned to `30thOH` instead of `CB`
**Solution:** CB clan pattern must be first in priority order

### Issue: Case sensitivity
**Problem:** `cb{30thoh}` not matching `CB`
**Solution:** Regex must use case-insensitive flag (`i`)

### Issue: Company suffixes not removed
**Problem:** `[8thCT.CAV]` being assigned to `8thCT.CAV` instead of `8thCT`
**Solution:** Apply `cleanCompanySuffix` normalization

## Contributing

When adding new patterns:

1. Add test cases first (TDD approach)
2. Update `parsing-config.json` with new pattern
3. Run tests to verify
4. Update this README with examples
5. Document any edge cases
