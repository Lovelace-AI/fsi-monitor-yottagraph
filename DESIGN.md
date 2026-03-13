# FSI Monitor App - Design Document

## Project Overview

An app to explore information about companies, with a focus on data derived from SEC filings.

**Created:** 2026-02-25  
**App ID:** aether-dserp-fsi-mm2h  
**Description:** A app for exploring DSERP-FSI data  
**Last updated:** 2026-03-12

## Configuration

| Setting           | Value                                 |
| ----------------- | ------------------------------------- |
| Authentication    | Auth0                                 |
| 3D Globe (Cesium) | Not required                          |
| Query Server      | https://query.news.sbox.g.lovelace.ai |

## Cross-Cutting Concepts

### Time frame

Everything in this app applies to the last 30 days. Always bound the search by date, don't search everything, and use the last 30 days as the time frame.

## Company Data

The user will be adding company to a watchlist. Every time a company is added or refreshed, we will pull all the following data. Some of this data will be displayed, other data will be used for further processing.

### Schema

Before trying to load any data, use `/elemental/metadata/schema` to look up flavor ids (FIDs) and property ids (PIDs). These will be used in subsequent data calls.

#### Flavors

Flavors:

- organization
- person
- document
- event

#### Properties

For the company, we pull the following properties.

Single value: These may occur multiple times, choose the instance with the most recent `recorded_at`.

- company_cik
- ticker
- sic_description
- state_of_incorporation

Multiple values: These may occur multiple times, and we want to use all values.

- filings
- is_officer
- is_director
- all properties listed in Edgar Data section

### Edgar data

The `filings` property on a company should typically return multiple results. The value of each one is the NEID of a `document` entity. (Known bug: sometimes the NEID will be "0", in which case we should ignore it.) We should make a single `properties` query for all the document NEIDs for the following properties. THIS SHOULD BE DONE AS A BULK CALL WHENEVER POSSIIBLE, OTHERWISE IT WILL BE VERY SLOW!

- filing_date
- form_type
- us_gaap:assets
- us_gaap:assets_current
- us_gaap:cash
- us_gaap:cash_and_cash_equivalents
- us_gaap:interest_and_debt_expense
- us_gaap:interest_expense
- us_gaap:interest_expense_debt
- us_gaap:interest_expense_nonoperating
- us_gaap:interest_expense_operating
- us_gaap:liabilities
- us_gaap:liabilities_current
- us_gaap:net_income_loss
- us_gaap:operating_income_loss
- us_gaap:partners_capital
- us_gaap:profit_loss
- us_gaap:revenue_from_contracts
- us_gaap:revenues
- us_gaap:stockholders_equity
- us_gaap:stockholders_equity_total

If a document has NO properties, it is Not Supported. Otherwise it is Supported.

#### 8-K Events

Documents with `form_type` = `8-K` are 8-K filings. These documents have a `filings` property that returns NEIDs of `event` entities. Each event entity has the following properties:

- form_8k_item_code
- form_8k_event

The filing date for an event comes from the parent 8-K document. See `design/feature_8k_events.md` for details on how events are displayed.

#### Edgar Leadership

Use `/elemental/find` with a `linked` expression to find people linked to the company via these relationship properties. The `is_officer` and `is_director` properties are `data_nindex` type (entity references), so we use `linked` with `direction: "incoming"` to find entities that point TO the company.

```
{
  "type": "linked",
  "linked": {
    "to_entity": "<company NEID>",
    "distance": 1,
    "pids": [<is_officer or is_director PID>],
    "direction": "incoming"
  }
}
```

### News data

To get news mentions, use `/mentions/lookup` with the targeted time frame (previous 30 days). This will return a list of mcodes.

## Modules

### Watchlist

Name: Watchlist
Description: One big complex module with a watchlist of companies. The companies are displayed in a table, and this provides an entry point to other views of the entity.
Implementation status: Implemented
Details:

The page has two sections: Agents and Watchlist

In the Agent section, we have three buttons:

1. Dialogue -> pops up a box "An interactive agent that lets users query the data with natural language. Coming soon!"
2. Alerting -> pops up a box "A agent that highlights recent alerts from the watchlist. Coming soon!"
3. Briefing -> opens the Briefing Agent dialog, which generates a natural language summary (max 100 words) of Edgar filings in the watchlist. Requires the `briefing_agent` to be deployed via `/deploy_agent`.

The Watchlist is a table with many columns (details below).

A user can hit the plus button and open a search box. They type the name of a company. The app uses `/entities/search` to find the top 10 matches for that search, and the user can select one to use and add to the Watchlist. When the user selects the company, we retrieve the NEID, which is used to populate the data associated with that company (details below) and save it locally for future reference.

#### Columns

The following columns populate the watchlist table. Some columns have a solid vertical line between them (represented by ||), separating groups. Details about each column are found below.

Company || Edgar Filings | Solvency | Executive Risk | CIK Velocity || News Mentions | Summary (24H) | Sentiment

##### Company

The canonical name of the company, as resolved via the original entity search. To the right of the company name within the same columns is a refresh icon, which the user can click to refresh all the data associated with the company.

##### Edgar Filings

An int value: the count of supported Edgar documents. A user can click to open a Edgar Company Profile pop up page. For details of the pop up, see `design/page_edgar_company_profile.md`.

#### Solvency

A placeholder score: --. A user can click to open a Solvency Score pop up page. For details of the pop up, see `design/page_edgar_solvency.md`.

#### Executive Risk

See details on `design/page_executive_risk.md`. The table just has the executive risk score. A user can click the score to open a Executive Risk pop up page.

#### CIK Velocity

See details on `design/page_cik_velocity.md`. The table just has the cik velocity score. A user can click the score to open a CIK Velocity pop up page.

##### News Mentions

An int value: the count of news mentions in the previous 30 days.

A user can click to open a News Company Profile pop up page. For now, the page just says "Coming Soon".

#### Summary

A placeholder value: "No summary". A user can click the score to open a News Summary pop up page. For now, the page just says "Coming Soon".

#### Sentiment

A placeholder score: --. A user can click the score to open a News Sentiment pop up page. For now, the page just says "Coming Soon".
