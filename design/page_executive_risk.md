# Executive Risk

A popup dialog displaying an Executive Risk Score and its contributing signals. All signals analyze the previous 12 months of leadership changes. Accessed from the Watchlist.

## Implementation Status

- [ ] Create `useExecutiveRisk` composable with data fetching and score calculations
- [ ] Create `ExecutiveRiskDialog` component
- [ ] Implement signal detection from company profile Leadership data
- [ ] Implement score calculation with weighting

## Files

- `features/watchlist/composables/useExecutiveRisk.ts` - Data fetching and score calculations
- `features/watchlist/components/ExecutiveRiskDialog.vue` - Dialog display component

---

## Data Source

Leadership data comes from the company profile Leadership section (see `DESIGN.md` and `design/page_edgar_company_profile.md`). This includes:

- Current officers and their titles
- Current directors
- Officer/director departure events with dates
- Auditor changes (originally sourced from 8-K)

## Presentation

**Executive Risk Score** displayed at top (0-100, capped).

**Signals Table** with columns:

1. Signal
2. Count (always a count for every signal)
3. Score
4. Risk Level

## Signals

### Officer Count

| Threshold | Risk Level | Score |
| --------- | ---------- | ----- |
| ≥3        | low        | 0     |
| 1-2       | medium     | 20    |
| 0         | high       | 50    |

### C-Suite Coverage

Count of C-suite executives (CEO, CFO, COO, CTO, CMO, etc.).

| Threshold | Risk Level | Score |
| --------- | ---------- | ----- |
| ≥2        | low        | 0     |
| <2        | medium     | 25    |

### Officer Departures

**Base**: 15 points per departure  
**Cap**: 60 points  
**Formula**: `base × recency_multiplier × title_multiplier`

**Recency Multiplier** (days since departure):

| Days Ago | Multiplier |
| -------- | ---------- |
| ≤30      | 1.0        |
| ≤60      | 0.85       |
| ≤90      | 0.7        |
| ≤180     | 0.5        |
| ≤365     | 0.4        |
| >365     | 0.3        |

**Title Multiplier** (case insensitive):

| Title Contains                      | Multiplier |
| ----------------------------------- | ---------- |
| "CEO" or "CHIEF EXECUTIVE"          | 1.5        |
| "CFO" or "CHIEF FINANCIAL"          | 1.4        |
| "COO", "CTO", "CMO", or other CHIEF | 1.3        |
| "PRESIDENT"                         | 1.2        |
| Other                               | 1.0        |

**Risk Levels**:

| Score | Risk Level |
| ----- | ---------- |
| 0     | low        |
| 1-20  | medium     |
| 21-40 | high       |
| >40   | critical   |

### Director Departures

**Base**: 10 points per departure  
**Cap**: 40 points  
**Formula**: `base × recency_multiplier`

Uses the same recency multiplier as Officer Departures.

**Risk Levels**:

| Score | Risk Level |
| ----- | ---------- |
| 0     | low        |
| 1-20  | medium     |
| 21-40 | high       |
| >40   | critical   |

### Cumulative Departures

Total count of officer + director departures in the past 12 months (raw count, not weighted).

**Cumulative Multiplier**:

| Total Departures | Multiplier | Rationale            |
| ---------------- | ---------- | -------------------- |
| ≥6               | 1.6        | systemic instability |
| ≥4               | 1.4        | concerning pattern   |
| ≥3               | 1.2        |                      |
| <3               | 1.0        |                      |

**Formula**: `cumulative_bonus = (cumulative_multiplier - 1.0) × 20`

Only applied if total departures ≥ 3. Max bonus: 12 points.

| Count | Risk Level | Score |
| ----- | ---------- | ----- |
| <3    | low        | 0     |
| 3     | medium     | 4     |
| 4-5   | high       | 8     |
| ≥6    | critical   | 12    |

### Auditor Changes

| Count | Risk Level | Score |
| ----- | ---------- | ----- |
| 0     | low        | 0     |
| 1     | medium     | 20    |
| ≥2    | high       | 40    |

## Executive Risk Score Calculation

Sum of all signal scores, capped at 100:

```
score = min(100,
    officer_count_score +
    csuite_coverage_score +
    officer_departures_score +
    director_departures_score +
    cumulative_departures_score +
    auditor_changes_score
)
```

## Open Questions

None.
