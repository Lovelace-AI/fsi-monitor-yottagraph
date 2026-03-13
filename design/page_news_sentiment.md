# News Sentiment

Pop-up page from the Watchlist "Sentiment" column.

## Purpose

Show how sentiment toward the company has changed over time.

## Data Source

Uses the **shared news query** from `design/page_news_mentions.md`. This page uses:

- `publication_date`: Group mentions into calendar days
- `sentiment`: The sentiment score for each mention (range: -1 to 1)

## Aggregation Logic

For each calendar day with mentions:

1. **Daily average**: Simple mean of all `sentiment` values for that day
2. **Distribution buckets**: Count occurrences in each bucket: `-1`, `-0.75`, `-0.5`, `0`, `0.5`, `0.75`, `1`

## UI

### Current Sentiment

Display the daily average for the most recent day with data.

- Color coding: Red (< -0.25), Grey (-0.25 to 0.25), Green (> 0.25)
- Format: Show value with 2 decimal places

### Sentiment Chart

Line chart showing daily sentiment over time:

- X-axis: Calendar dates (past 30 days)
- Y-axis: Sentiment score (-1 to 1)
- Hover interaction: When hovering over a data point, show a histogram of the sentiment distribution for that day using the buckets defined above
