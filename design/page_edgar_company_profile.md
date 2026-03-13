# Edgar Company Profile

## Implementation Status

- [x] Create `EdgarCompanyProfileDialog` component
- [x] Implement Company Profile box
- [x] Implement Leadership box (stubbed with table structure)
- [x] Implement Filings box
- [x] Implement Financial Facts box
- [x] Implement 8-K Events box

## Files

- `features/watchlist/components/EdgarCompanyProfileDialog.vue` - Main dialog component
- `features/watchlist/components/FilingsListBox.vue` - Filings table component
- `features/watchlist/components/FinancialFactsBox.vue` - Financial facts table component
- `features/watchlist/components/Form8kEventsBox.vue` - 8-K events table component

---

This is a pop up page accessed via the Watchlist from the Edgar Filings Column. See `DESIGN.md` for instructions to access the data used to build this page.

The page consistents of 5 boxes, arranged vertically.

## Company Profile

Basic company info. Each of these is listed with the property on the left and the value on the right.

1. Company Name: canonical company name
2. Ticker Symbol: property `ticker`
3. CIK: property `company_cik`
4. Industry (SIC): property `sic_description`
5. State of Incorporation: property `state_of_incorporation`

## Leadership

TODO fill in table. This table is just stubbed out for now.

Leadership has three sections.

### Officers

Officer count: --
Table:

1. Title
2. Name
3. Appointed

### Directors

Director count: --
Table:

1. Title
2. Name
3. Appointed

### Leadership changes

A table with two columns

1. Date
2. Change

## Filings

A table listing all the filings for the company. See `design/feature_filings_list.md` for details.

## Financial Facts

A table with financial facts based on filings. See `design/feature_financial_facts.md` for details.

## 8-K Events

A table listing all events from 8-K Forms. See `design/feature_8k_events.md` for details.
