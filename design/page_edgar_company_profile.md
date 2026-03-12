# Edgar Company Profile

This is a pop up page accessed via the Watchlist from the Edgar Filings Column. See `DESIGN.md` for instructions to access the data used to build this page.

The page consistents of 4 boxes, arranged vertically.

## Company Profile

Basic company info. Each of these is listed with the property on the left and the value on the right.

1. Company Name: canonical company name
2. Ticker Symbol: property `ticker`
3. CIK: property `company_cik`
4. Industry (SIC): property `sic_description`
5. State of Incorporation: property `state_of_incorporation`

## Leadership

Company leadership info. See `DESIGN.md` Edgar Leadership section.

1. Officer count: count number of people with is_officer property on the company.
1. Director count: count number of people with is_director property on the company.

## Financial Facts

A table with financial facts based on filings. See `design/feature_financial_facts.md` for details.

## 8-K Events

A table listing all events from 8-K Forms. See `design/feature_8k_events.md` for details.
