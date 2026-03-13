# CIK Velocity

## Implementation Status

- [ ] Create `useCIKVelocity` composable with data fetching and score calculations
- [ ] Create `CIKVelocityDialog` component
- [ ] Implement Quarterly Trends section with sparklines
- [ ] Implement Divergence Analysis section
- [ ] Implement Recent Activity section
- [ ] Implement Velocity Clusters section
- [ ] Implement Velocity Score calculation

## Files

- `features/watchlist/composables/useCIKVelocity.ts` - Data fetching and score calculations
- `features/watchlist/components/CIKVelocityDialog.vue` - Dialog display component

---

A popup dialog displaying a CIK Velocity Score and its contributing signals. Velocity measures the rate and clustering of activity—both a company's own filings and its connections to other companies. A cluster of events in a short window is more significant than the same events spread over time. Accessed from the Watchlist.

## Data Sources

This page uses data from the previous 3 years. Events are aggregated by quarter for trend analysis.

| Data Type         | Source                 | Description                                                |
| ----------------- | ---------------------- | ---------------------------------------------------------- |
| Directors         | TODO                   | Current directors of the company                           |
| Officers          | TODO                   | Current officers of the company                            |
| Own Filings       | TODO                   | Filings submitted by this company                          |
| Other Filings     | Cross-reference (TODO) | Filings from other companies that reference this company   |
| Shared Leadership | TODO                   | Key people listed as directors/officers at other companies |
| Stake Ownership   | SC 13D/G filings       | Company A owns a stake in company B                        |
| Subsidiary        | EX-21 exhibits         | Company A lists B as a subsidiary                          |
| Agreements        | 8-K Item 1.01          | Company A signs agreement with B                           |
| Borrowing         | 8-K Item 2.03          | Company A borrows from B                                   |

**TODO**: Entity resolution for identifying when this company is referenced in other companies' filings will be added later.

## Excluded from Original Implementation

The original velocity implementation included the following features that will be excluded:

| Feature                | Original Purpose                                 | Why Excluded                       |
| ---------------------- | ------------------------------------------------ | ---------------------------------- |
| Global Rank            | Rank entity by cross-entity mentions vs all CIKs | Requires universe-wide aggregation |
| News Velocity          | 30-day news mentions and sentiment trend         | News data not in scope             |
| Peer Comparison        | Compare to entities with similar mention volume  | Requires global mention data       |
| Risk Score Integration | Combine with computed risk scores                | Separate scoring system            |

---

## Presentation

**CIK Velocity Score** displayed at top (0-100, capped).

The page consists of 4 boxes, arranged vertically.

## Quarterly Trends

This section tracks filing and connection activity over the previous 3 years, aggregated by quarter.

### Data

Two quarterly time series:

| Metric              | Description                                                               |
| ------------------- | ------------------------------------------------------------------------- |
| Direct Filings      | Count of filings submitted by this company per quarter                    |
| Cross-Entity Events | Count of connection events per quarter (see Connection Event Types below) |

### Connection Event Types

| Event Type          | Source                                                 | Description                                 |
| ------------------- | ------------------------------------------------------ | ------------------------------------------- |
| `STAKE_ACQUIRED`    | SC 13D/G filed by another company referencing this one | Another entity disclosed ownership stake    |
| `STAKE_DISCLOSED`   | SC 13D/G filed by this company                         | This company disclosed ownership in another |
| `SUBSIDIARY_LISTED` | EX-21 from another company listing this one            | Listed as subsidiary by another company     |
| `AGREEMENT_SIGNED`  | 8-K Item 1.01 referencing this company                 | Material agreement with another party       |
| `BORROWING_EVENT`   | 8-K Item 2.03 referencing this company                 | Credit facility or borrowing arrangement    |
| `SHARED_EXECUTIVE`  | Person becomes officer/director at both companies      | Leadership overlap with another entity      |

### Presentation

Two sparkline charts side by side:

1. **Direct Filings** - quarterly filing counts (12 quarters)
2. **Cross-Entity Events** - quarterly connection event counts (12 quarters)

Below the sparklines, a summary row:

| Metric                   | Value                               |
| ------------------------ | ----------------------------------- |
| Active Quarters          | Count of quarters with any activity |
| Total Filings (3yr)      | Sum of direct filings               |
| Total Cross-Entity (3yr) | Sum of connection events            |

### Trend Classification

Based on the two most recent complete quarters (Q1 vs Q2):

| Condition                     | Trend Label    |
| ----------------------------- | -------------- |
| Q2 total = 0 and Q1 total = 0 | `inactive`     |
| Q1 total = 0 and Q2 total > 0 | `new`          |
| Q2 total > Q1 total × 1.15    | `accelerating` |
| Q2 total < Q1 total × 0.85    | `declining`    |
| Otherwise                     | `stable`       |

Display the trend label with an appropriate icon (↑ accelerating, ↓ declining, → stable, ○ inactive, ★ new).

## Divergence Analysis

Divergence measures whether cross-entity attention is growing at a different rate than the company's own filing activity. A company "gaining attention" has cross-entity events growing faster than its direct filings.

### Calculation

Using the two most recent complete quarters:

```
direct_qoq_pct = ((Q2_direct - Q1_direct) / Q1_direct) × 100
cross_qoq_pct = ((Q2_cross - Q1_cross) / Q1_cross) × 100
divergence = cross_qoq_pct - direct_qoq_pct
```

If Q1 is 0, use 100% if Q2 > 0, else 0%.

### Divergence Labels

| Divergence | Label               | Interpretation                                       |
| ---------- | ------------------- | ---------------------------------------------------- |
| > 25       | `gaining-attention` | External interest growing faster than own activity   |
| < -25      | `fading`            | External interest declining relative to own activity |
| -25 to 25  | `in-sync`           | External interest tracking own activity              |

### Presentation

A divergence indicator showing:

- **Direct Filings QoQ**: +X% or -X%
- **Cross-Entity QoQ**: +X% or -X%
- **Divergence**: +X or -X points
- **Label**: gaining-attention / fading / in-sync

Use color coding: green for gaining-attention, red for fading, neutral for in-sync.

## Recent Activity

This section shows detailed events from the previous 30 days for context.

### Filing Activity

| Metric          | Detection                                                 |
| --------------- | --------------------------------------------------------- |
| Filing Count    | Count of `filings` with `filing_date` in previous 30 days |
| 8-K Count       | Subset where `form_type` = '8-K'                          |
| Amendment Count | Forms ending in '/A'                                      |

A table of filings with columns:

1. Date (`filing_date`)
2. Form Type
3. Event Type (for 8-Ks only, otherwise blank)

### Connection Events

A table of connection events from the previous 30 days with columns:

1. Date
2. Event Type
3. Counterparty (the other company involved, if identifiable)
4. Source Filing

## Velocity Clusters

This section detects when events occur in rapid succession within the previous 90 days, which indicates heightened activity.

### Cluster Detection Algorithm

Events are grouped into clusters using a sliding window approach:

```
CLUSTER_WINDOW_DAYS = 14
MIN_CLUSTER_SIZE = 3
VELOCITY_BONUS = 25
SEVERE_CLUSTER_SIZE = 5
SEVERE_VELOCITY_BONUS = 40
```

**Algorithm**:

1. Combine all dated events from previous 90 days (filings + connection events)
2. Sort by date
3. For each event not yet assigned to a cluster:
    - Find all events within `CLUSTER_WINDOW_DAYS` forward
    - If count >= `MIN_CLUSTER_SIZE`, form a cluster
    - Mark all events in cluster as used
4. Score each cluster:
    - 5+ events: `SEVERE_VELOCITY_BONUS` (40 points)
    - 3-4 events: `VELOCITY_BONUS` (25 points)

### Event Types for Clustering

All of the following event types contribute to velocity clustering:

| Category    | Event Types                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| Filings     | All filings (10-K, 10-Q, 8-K, etc.)                                                                     |
| Connections | STAKE_ACQUIRED, STAKE_DISCLOSED, SUBSIDIARY_LISTED, AGREEMENT_SIGNED, BORROWING_EVENT, SHARED_EXECUTIVE |

### Presentation

**Clusters Detected**: count

If clusters exist, show a table with columns:

1. Period (start date – end date)
2. Events (count)
3. Window (days between first and last event)
4. Severity (Normal or Severe)
5. Score

Below the table, list the event types present in each cluster.

## CIK Velocity Score Calculation

The velocity score combines cluster detection with trend signals:

```
base_score = Σ cluster_scores

trend_modifier:
  accelerating: +10
  declining: -5
  stable/inactive/new: 0

divergence_modifier:
  gaining-attention: +10
  fading: -5
  in-sync: 0

velocity_score = min(100, max(0, base_score + trend_modifier + divergence_modifier))
```

### Score Components

| Component          | Points | Description                               |
| ------------------ | ------ | ----------------------------------------- |
| Normal cluster     | +25    | 3-4 events within 14 days                 |
| Severe cluster     | +40    | 5+ events within 14 days                  |
| Accelerating trend | +10    | QoQ activity increasing > 15%             |
| Declining trend    | -5     | QoQ activity decreasing > 15%             |
| Gaining attention  | +10    | Cross-entity growing faster than direct   |
| Fading             | -5     | Cross-entity declining relative to direct |

### Score Interpretation

| Score Range | Interpretation                                                           |
| ----------- | ------------------------------------------------------------------------ |
| 0           | No detected velocity clusters; activity is spread out or declining       |
| 1-25        | Low velocity; one normal cluster or positive trend signals               |
| 26-50       | Moderate velocity; multiple clusters or cluster + positive signals       |
| 51-75       | High velocity; multiple severe clusters                                  |
| 76-100      | Very high velocity; significant event concentration with positive trends |

## Open Questions

1. How do we detect "Shared Executive" events? This requires tracking when a person's `is_officer`/`is_director` relationship to this company was established, and cross-referencing their other positions. The appointment date may not be readily available.
