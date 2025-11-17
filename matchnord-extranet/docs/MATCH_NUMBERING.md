# Match Numbering System

## Overview

The match numbering system automatically assigns unique match numbers to matches when they are created. This makes it easier to identify and schedule matches during tournament management.

## SQL Script for Existing Matches

To assign match numbers to existing matches in a tournament, use the SQL script:

**File**: `scripts/assign-match-numbers.sql`

### Usage

1. **Connect to your database**:
   ```bash
   psql -h localhost -p 5434 -U your_user -d tournament_app
   ```

2. **Run the SQL script**:
   ```sql
   \i scripts/assign-match-numbers.sql
   ```

   Or copy and paste the SQL directly into your database client.

3. **For a specific tournament**, the script is pre-configured for:
   - Tournament ID: `cmg1tk8z4000marfd6rneywbs`

4. **To use for a different tournament**, replace the tournament ID in the script.

### Numbering Options

The script provides three numbering formats:

#### Option 1: Simple Sequential (Default)
- Format: `M1`, `M2`, `M3`, etc.
- Numbers matches sequentially across the entire tournament
- Best for: Small tournaments with few matches

#### Option 2: Group-Based (Recommended)
- Format: `G1-M1`, `G1-M2`, `G2-M1`, etc.
- Numbers matches per group within the tournament
- Best for: Tournaments with multiple groups
- **To use**: Uncomment Option 2 and comment Option 1 in the SQL script

#### Option 3: Division-Based
- Format: `D1-M1`, `D1-M2`, `D2-M1`, etc.
- Numbers matches per division within the tournament
- Best for: Tournaments with multiple divisions
- **To use**: Uncomment Option 3 and comment Option 1 in the SQL script

## Automatic Match Numbering

### How It Works

When matches are created, match numbers are automatically assigned based on:

1. **Match Generation** (Round-Robin, Elimination):
   - Uses the match number from the generation algorithm
   - Format: `{GroupName}-M{Number}` (e.g., `Group A-M1`, `Group A-M2`)

2. **Manual Match Creation**:
   - If `matchNumber` is provided, it's used as-is
   - If not provided, automatically generates: `{GroupName}-M{Count+1}`

3. **Placement Matches**:
   - Uses the match number from the placement configuration
   - Falls back to group-based numbering if not available

### Implementation Details

**Helper Function**: `src/lib/tournament/match-numbering.ts`
- `generateMatchNumber()`: Automatically generates match numbers
- Supports three formats: `simple`, `group`, `division`
- Default format: `group` (uses group names)

**Updated Endpoints**:
- `POST /api/v1/tournaments/[id]/matches` - Auto-assigns match numbers
- `POST /api/v1/divisions/[id]/matches/generate` - Uses match numbers from generation
- `POST /api/v1/tournaments/[id]/matches/bulk` - Auto-assigns match numbers
- `POST /api/v1/tournaments/[id]/placement-matches` - Uses placement match numbers

## Match Number Format

### Current Format (Group-Based)
```
{GroupName}-M{Number}
```

Examples:
- `Group A-M1`
- `Group A-M2`
- `Group B-M1`
- `Elite-M1`

### Alternative Formats

**Simple**:
```
M1, M2, M3...
```

**Division-Based**:
```
{DivisionName}-M{Number}
```

Examples:
- `P15-M1`
- `P15-M2`
- `Elite-M1`

## Display

Match numbers are displayed in:

1. **Match Scheduler Calendar**:
   - Shown at the top of match cards (7px font, uppercase)
   - Included in hover tooltips

2. **Match Tables** (Client & Extranet):
   - Conditional "Match #" column (only shows if any match has a number)
   - Bold, semibold styling

3. **Match Lists**:
   - Shown before status badge in match cards

## Manual Override

Match numbers can be manually set or edited:

1. **Via API**: Include `matchNumber` in the request body
2. **Via Match Scheduler**: Edit match modal includes "Match Number" field
3. **Via SQL**: Direct database update (use with caution)

## Best Practices

1. **Use Group-Based Numbering**: Provides better organization for tournaments with multiple groups
2. **Keep Format Consistent**: Once you choose a format, stick with it for the tournament
3. **Don't Override Unless Necessary**: Let the system auto-assign for consistency
4. **Update Existing Matches**: Run the SQL script to backfill match numbers for existing tournaments

## Troubleshooting

### Match numbers not showing
- Check that matches have `matchNumber` field populated in database
- Verify the API response includes `matchNumber`
- Ensure the component checks for `matchNumber` before displaying column

### Duplicate match numbers
- Run the SQL script to reassign numbers
- Check for race conditions in match creation (should be rare)

### Match numbers not auto-assigning
- Verify the match creation endpoint is using `generateMatchNumber()`
- Check database constraints allow NULL match numbers (they should)

## Future Enhancements

Potential improvements:
- Custom match number formats per tournament
- Match number templates (e.g., "Match {round}-{number}")
- Automatic renumbering when matches are deleted
- Match number validation to prevent duplicates

