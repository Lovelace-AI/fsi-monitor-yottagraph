# News Mentions

This is a pop up from the Watchlist under the News Mentions column.

A count of the total news mentions for the entity in the last 30 days.

## News chart

A simple line chart showing the number of news mentions per day.

## Data access

The count of news mentions is accessed via the /elemental/find endpoint. We search for entities with the flavor `article` that have the property `appears_in` and the value is the NEID of the target company. Each `appears_in` should also have a `recorded_at` attribute, and we use that as the date of the article for all over processing. Count the number of articles that appear on each calendar date. Do NOT use a `eq` operator with this query. Instead use `linked`. Also query the `sentiment`, `url`, and `summary` attributes which will be used later.

THIS QUERY SHOULD BE RUN ONCE AND REUSED FOR NEWS SENTIMENT AND NEWS SUMMARY.
