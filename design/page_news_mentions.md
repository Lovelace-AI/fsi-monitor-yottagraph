# News Mentions

Pop-up page from the Watchlist "News Mentions" column.

## Purpose

Show the volume of news coverage for a company over the past 30 days.

## Data Source

Uses the **shared news query** (see below). This page displays:

- **Total count**: Sum of all mentions in the time period
- **Daily counts**: Group mentions by `publication_date` (truncated to calendar date)

## UI

### Header

"News Mentions: {company name}" with total count badge.

### Chart

Line chart showing daily mention counts:

- X-axis: Calendar dates (past 30 days)
- Y-axis: Number of mentions
- Hover: Shows exact count for that day

---

# Shared News Query

**This section defines the single query used by all three news pages.** Run this query once when opening any news page, then reuse the cached results for the others.

## Query: `/mentions/lookup/detail`

```
GET /mentions/lookup/detail
  ?neid={company_neid}
  &interval_start={30_days_ago_RFC3339}
  &interval_end={now_RFC3339}
```

## Response Fields Used

| Field                       | Used By             | Purpose                              |
| --------------------------- | ------------------- | ------------------------------------ |
| `publication_date`          | Mentions, Sentiment | Group by day, sort by recency        |
| `sentiment`                 | Sentiment, Summary  | Daily averages, per-article display  |
| `artid`                     | Summary             | Fetch article details                |
| `original_publication_name` | Summary             | Display publication source           |
| `snippet`                   | Summary             | Fallback if full summary unavailable |

## Supplemental Query: Article Details (Summary page only)

For the 20 most recent articles (past 24 hours), fetch additional properties via `/elemental/entities/properties` using the `artid` as the entity NEID:

```
POST /elemental/entities/properties
{
  "neids": [<artid1>, <artid2>, ...],
  "pnames": ["title", "summary", "url"]
}
```

This provides `title`, `summary`, and `url` which are not in the mention detail response. Use a single bulk call for all 20 articles.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    /mentions/lookup/detail                          │
│         (30-day window, returns all mention details)                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
   ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
   │  Mentions   │        │  Sentiment  │        │   Summary   │
   │    Page     │        │    Page     │        │    Page     │
   ├─────────────┤        ├─────────────┤        ├─────────────┤
   │ Count by    │        │ Average     │        │ Recent 20   │
   │ pub_date    │        │ sentiment   │        │ articles    │
   │             │        │ by day      │        │ + details   │
   └─────────────┘        └─────────────┘        └─────────────┘
                                                        │
                                                        ▼
                                               ┌───────────────────┐
                                               │ /elemental/       │
                                               │ entities/         │
                                               │ properties        │
                                               │ (bulk, 20 artids) │
                                               └───────────────────┘
```
