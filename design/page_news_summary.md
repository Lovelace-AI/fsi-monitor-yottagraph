# News Summary

The page has a news summary at the top. Below, we display a sample of news items.

## Summary

TODO, for now just put "Summary: work in progress"

## News articles

From News Mentions (`design/page_news_mentions.md`) we should have the NEIDS of all articles that the company appeared in from the past month along with a `recorded_at`, which is a stand in for the publication date of the article.

Take the most recent `recorded_at` articles from the past 24 hours, choosing a maximum of 20 articles. If there are no articles in the past 24 hours, just put "No news found for the past day".

For each of these 20 articles, do an `/elemental/entities/properties` query for the properties `title` and `original_publication_name`. Also include `sentiment`, `url`, and `summary` which were attributes on the `appears_in` relationship that was queried in `design/page_news_mentions.md`. Create a small box for each article with all this information.
