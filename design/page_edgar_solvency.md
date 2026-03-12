# Edgar Solvency

## Implementation Status

- [x] Create `useSolvencyScore` composable with data fetching and processing
- [x] Create `SolvencyScoreDialog` component with 4 boxes
- [x] Implement Financials box with ratios and hover tooltips
- [x] Implement Distress Events box with table and weighted score
- [x] Implement Behavior Signals box with table and behavior score
- [ ] Implement Stake Changes box (uses 13D/13G info)
- [ ] Implement Instrument Signals box
- [ ] Calculate overall Solvency Score from components
- [ ] Officer departures detection
- [ ] Director departures detection

## Files

- `features/watchlist/composables/useSolvencyScore.ts` - Data fetching and score calculations
- `features/watchlist/components/SolvencyScoreDialog.vue` - Dialog display component

---

This is a pop up page accessed via the Watchlist from the Solvency Column. See `DESIGN.md` for instructions to access the data used to build this page.

At the top of the page we have a Solvency Score. The equation for the score is given at the bottom of this page.

The page consistents of 4 boxes, arranged vertically.

## Financials

These numbers are drawn from the financial facts table (see `design/feature_financial_facts.md`). In each case we use the most recent available value from the table.

The equation should be displayed in hover text above the value.

| Name           | Value                                | Unit |
| -------------- | ------------------------------------ | ---- |
| Leverage Ratio | Liabilities / Equity                 | x    |
| Equity Ratio   | Equity / Assets                      | %    |
| Net Margin     | Net Income / Revenue                 | %    |
| Current Ratio  | Current Assets / Current Liabilities | x    |

## Distress Events

### Data

This information is drawn from the 8k events (see `design/feature_8k_events.md`). On this page we show events, but ONLY these specific events, and looking ONLY at the previous 2 years. Events are listed from most recent to least recent. Note that the events match those on the other page, but the severity may be different.

| Item Code | Event                         | Severity | Score | Weight |
| --------- | ----------------------------- | -------- | ----- | ------ |
| 1.02      | `FINANCING_TERMINATION`       | medium   | 50    | 8      |
| 1.03      | `FINANCING_BANKRUPTCY`        | critical | 100   | 30     |
| 2.04      | `FINANCING_TRIGGERING_EVENTS` | high     | 70    | 15     |
| 2.06      | `FINANCIAL_IMPAIRMENT`        | high     | 60    | 10     |
| 3.01      | `DELISTING_NOTICE`            | critical | 90    | 25     |
| 4.02      | `ACCOUNTING_NON_RELIANCE`     | critical | 85    | 20     |

### Presentation

We display a distress score, and show a table with the following columns. Date is based on the filing date of the document including the event from the table above.

Columns

1. Date
2. Item Code
3. Event
4. Severity

Weight is hidden.

Then we count up the occurrences of each type of event and calculate a distress score. We also factor in a recency multiplier.

```
def recency_multiplier(days_ago):
    # 1.0 for today, 0.5 for 1 year ago, 0.25 for 2 years ago
    return max(0.25, 1.0 - (days_ago / 730 * 0.75))
```

weighted_score = Σ (event_count × event_weight × recency_multiplier)

The weighted score is displayed at the top of the box, and will be used for future processing.

## Behavior Signals

### Data

This box uses much more varied data. The table below shows each kind of behavior and its source. All of these are counted based on the previous time period.

| Behavior Signal     | Detection                                                             | Weight | Time Period |
| ------------------- | --------------------------------------------------------------------- | ------ | ----------- |
| Late filing         | form_type IN ('NT 10-K', 'NT 10-Q', 'NT 10-K/A', 'NT 10-Q/A')         | 1.2x   | 12 months   |
| Filing gap          | days since most recent filing                                         | 1x     | 12 months   |
| Amendment Frequency | Count of amended filings (forms ending in /A)                         | 0.8x   | 12 months   |
| Officer departures  | TODO, currently always 0                                              | 1x     | 90 days     |
| Director departures | TODO, currently always 0                                              | 0.8x   | 90 days     |
| Auditor changes     | 8-K filings with event_type = 'ACCOUNTING_AUDITOR_CHANGE' (Item 4.01) | 1.5x   | 12 months   |

### Severity Thresholds

In each bucket we have the value that places the behavior signal in that bucket, and in parentheses the score given based on the bucket.

| Behavior Signal     | Low     | Medium      | High         | Critical   |
| ------------------- | ------- | ----------- | ------------ | ---------- |
| Late filing         | 0 (0)   | 1 (50)      | 2 (70)       | ≥3 (85)    |
| Filing gap          | <90 (0) | 90-179 (40) | 180-364 (65) | >=365 (90) |
| Amendment Frequency | <5 (0)  | ≥5 (40)     | N/A          | N/A        |
| Officer departures  | 0 (0)   | 1 (40)      | 2 (60)       | ≥3 (80)    |
| Director departures | 0 (0)   | 1 (35)      | ≥2 (55)      | N/A        |
| Auditor changes     | 0 (0)   | N/A         | 1 (65)       | ≥2 (85)    |

### Presentation

A table with each of the 6 behavior signals and their severity level. Columns:

1. Behavior signal
2. Severity

We also have a Behavior Score. To calculate this, we look only at those behavior signals with non-zero scores. Among these, we multiply each score by its weight, sum them together, and divide by the sum of their weights.

## Stake Changes

"TODO (Uses 13D/13G info)"

## Instrument Signals

"TODO"

# Solvency Score

"TODO: The score is made up of all the components above."
