# News Sentiment

This is a pop up from the Watchlist under the News Sentiment column. See `DESIGN.md`.

## Data aggregation

When running news mentions (see `design/page_news_mentions.md` we already got a list of all the articles per day over the last 30 days. We will reuse this query here.

Each of those articles has a sentiment score attached to the entity. For each day, we take a simple average of all the sentiment scores for the day, which becomes the daily sentiment score.

We also count up the number of occurences of each sentiment score for each day. The scores will be one of: `-1`, `-0.75`, `-0.5`, `0`, `0.5`, `0.75`, `1`.

## Presentation

Current sentiment score: (show the daily sentiment score for the most recent day with data. Color code is red, grey, or green based on value).

## Sentiment Chart

A line chart showing the daily sentiment score per day for the last 30 days. X-axis is days, and Y-axis ranges from -1 to 1. If a user hovers over any daily value on the graph, they can see a histogram of the distribution of scores for that day, in the buckets `-1`, `-0.75`, `-0.5`, `0`, `0.5`, `0.75`, `1`,
