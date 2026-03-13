# News Summary

Pop-up page from the Watchlist "Summary (24H)" column.

## Purpose

Provide a quick overview of recent news coverage with article details.

## Data Source

Uses the **shared news query** from `design/page_news_mentions.md`, plus supplemental article detail queries.

### From shared query (`/mentions/lookup/detail`)

- `publication_date`: Filter to past 24 hours, sort by recency
- `artid`: Use to fetch article details
- `sentiment`: Display per-article
- `original_publication_name`: Display source
- `snippet`: Fallback summary text

### From article details (`/articles/{artid}`)

For the 20 most recent articles from the past 24 hours:

- `title`: Article headline
- `summary`: Full article summary
- `url`: Link to original article

## UI

### Summary Header

Placeholder text: "Summary: work in progress"

(Future: AI-generated summary of recent news themes)

### Article List

Display up to 20 articles from the past 24 hours. If none exist, show: "No news found for the past day."

Each article card shows:

| Field       | Source                                          |
| ----------- | ----------------------------------------------- |
| Title       | `/articles/{artid}`                             |
| Publication | `original_publication_name` from mention detail |
| Summary     | `/articles/{artid}` (fallback: `snippet`)       |
| Sentiment   | `sentiment` from mention detail                 |
| URL         | `/articles/{artid}`                             |
