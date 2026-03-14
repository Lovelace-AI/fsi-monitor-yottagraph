# Implementation Status

- [x] Create `useFinancialFacts` composable with data fetching and processing
- [x] Create `FinancialFactsBox` component with table display
- [x] Implement column header tooltips showing priority order with color coding
- [x] Implement cell value tooltips showing used XBRL concept
- [x] Integrate into `CompanySummary.vue`
- [x] Store most recent values for each column in memory

## Files

- `features/watchlist/composables/useFinancialFacts.ts` - Data fetching and business logic
- `features/watchlist/components/FinancialFactsBox.vue` - Table display component

# Feature Overview

A feature box (in the Edgar Company Profile dialog) containing a table of financial facts about a company. This table draws only from forms 10-K and 10-Q.

Each fact draws from a sequence of fields, where we first look for the first field in the list, and then if it's not present move on to the next field or combination of fields.

Each row in the table applies to a single document. For each document, we try to fill in each column. If we can't (there is no data, or no supported fields), put "—".

For each column header, if the user hovers over it, they see XBRL concepts that are used to populate the column along with the priority order. If the concept is supported, it is displayed in black, and if it is not supported it is displayed in red. For computed values (sums/differences), each component of the equation can be a different color based on its support status.

For each table value, if the user hovers over it, they see the XBRL concept that was actually used to populate that value.

In addition to being displayed in the app, this table is stored in memory for further processing: we save the most recent value for each column. For example, if a July form has Assets and Equity, and a September form has only Equity, we save the Assets from July and the Equity from September.

## Display Rules

- **Row ordering**: Rows are sorted by `filing_date`, most recent first
- **Date limit**: Only show filings from the previous 3 years
- **Filing filter**: Only 10-K and 10-Q forms (including amendments like 10-K/A and 10-Q/A)
- **Number formatting**: Use thousand separators and include units where relevant (e.g., `$1,234,567`)
- **Computed values**: For fallbacks that combine multiple concepts (e.g., `AssetsCurrent + AssetsNoncurrent`), if any component is missing, skip this fallback entirely and try the next priority

# Details

## Looking up properties

Each row in the table displays the financial facts from a specific Edgar filing. You should already have the NEID of the company. See `DESIGN.md` "Edgar Data" section for information on querying document properties.

PROPERTIES SHOULD BE QUERIED AS A BULK CALL WHENEVER POSSIIBLE, OTHERWISE IT WILL BE VERY SLOW! ALL PROPERTIES SHOULD HAVE BEEN QUERIED WHEN LOADING THE COMPANY, BEFORE ARRIVING AT THIS BOX!

## XBRL Concept to Property Mapping

Each fact comes from one or more XBRL concept. For simplicity we refer to these below by their original name. However, when we look them up on a property, we need to use the property name. Some of the concepts are not included yet, in which case they are marked "Not implemented". Whenever an equation includes a "Not implemented" field, we ignore it and move on to the next implemented option.

| XBRL Concept                                                                   | Document property                     |
| ------------------------------------------------------------------------------ | ------------------------------------- |
| us-gaap:Assets                                                                 | us_gaap:assets                        |
| us-gaap:AssetsCurrent                                                          | us_gaap:assets_current                |
| us-gaap:AssetsNoncurrent                                                       | Not Supported                         |
| us-gaap:Cash                                                                   | us_gaap:cash                          |
| us-gaap:CashAndCashEquivalentsAtCarryingValue                                  | us_gaap:cash_and_cash_equivalents     |
| us-gaap:CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents          | Not Supported                         |
| us-gaap:ComprehensiveIncomeNetOfTax                                            | Not Supported                         |
| us-gaap:InterestAndDebtExpense                                                 | us_gaap:interest_and_debt_expense     |
| us-gaap:InterestExpense                                                        | us_gaap:interest_expense              |
| us-gaap:InterestExpenseDebt                                                    | us_gaap:interest_expense_debt         |
| us-gaap:InterestExpenseNonoperating                                            | us_gaap:interest_expense_nonoperating |
| us-gaap:InterestExpenseOperating                                               | us_gaap:interest_expense_operating    |
| us-gaap:Liabilities                                                            | us_gaap:liabilities                   |
| us-gaap:LiabilitiesAndStockholdersEquity                                       | Not Supported                         |
| us-gaap:LiabilitiesCurrent                                                     | us_gaap:liabilities_current           |
| us-gaap:LiabilitiesNoncurrent                                                  | Not Supported                         |
| us-gaap:MembersEquity                                                          | Not Supported                         |
| us-gaap:NetIncomeLoss                                                          | us_gaap:net_income_loss               |
| us-gaap:NetIncomeLossAttributableToParent                                      | Not Supported                         |
| us-gaap:NetIncomeLossAvailableToCommonStockholdersBasic                        | Not Supported                         |
| us-gaap:NetIncomeLossFromRealEstateAndFinancialServiceActivities               | Not Supported                         |
| us-gaap:OperatingIncomeLoss                                                    | us_gaap:operating_income_loss         |
| us-gaap:PartnersCapital                                                        | us_gaap:partners_capital              |
| us-gaap:ProfitLoss                                                             | us_gaap:profit_loss                   |
| us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax                    | us_gaap:revenue_from_contracts        |
| us-gaap:RevenueFromContractWithCustomerIncludingAssessedTax                    | Not Supported                         |
| us-gaap:Revenues                                                               | us_gaap:revenues                      |
| us-gaap:SalesRevenueGoodsNet                                                   | Not Supported                         |
| us-gaap:SalesRevenueNet                                                        | Not Supported                         |
| us-gaap:SalesRevenueServicesNet                                                | Not Supported                         |
| us-gaap:StockholdersEquity                                                     | us_gaap:stockholders_equity           |
| us-gaap:StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest | us_gaap:stockholders_equity_total     |

## Table columns

### Period

This is taken from the `filing_date` property, and reported as month and year ex. "Jul 2025".

### Form

This is taken from the `form_type` property.

### Revenue

| Priority | XBRL Concept                                                       |
| -------- | ------------------------------------------------------------------ |
| 1        | `us-gaap:Revenues`                                                 |
| 2        | `us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax`      |
| 3        | `us-gaap:RevenueFromContractWithCustomerIncludingAssessedTax`      |
| 4        | `us-gaap:SalesRevenueNet`                                          |
| 5        | `us-gaap:SalesRevenueGoodsNet`                                     |
| 6        | `us-gaap:SalesRevenueServicesNet`                                  |
| 7        | `us-gaap:NetIncomeLossFromRealEstateAndFinancialServiceActivities` |

### Net Income

| Priority | XBRL Concept                                              |
| -------- | --------------------------------------------------------- |
| 1        | `us-gaap:NetIncomeLoss`                                   |
| 2        | `us-gaap:NetIncomeLossAvailableToCommonStockholdersBasic` |
| 3        | `us-gaap:ProfitLoss`                                      |
| 4        | `us-gaap:NetIncomeLossAttributableToParent`               |
| 5        | `us-gaap:ComprehensiveIncomeNetOfTax`                     |

### Operating Income

| Priority | XBRL Concept                  |
| -------- | ----------------------------- |
| 1        | `us-gaap:OperatingIncomeLoss` |

### Assets

| Priority | XBRL Concept                                                        |
| -------- | ------------------------------------------------------------------- |
| 1        | `us-gaap:Assets`                                                    |
| 2        | `us-gaap:AssetsCurrent` + `us-gaap:AssetsNoncurrent` (computed sum) |

### Current Assets

| Priority | XBRL Concept            |
| -------- | ----------------------- |
| 1        | `us-gaap:AssetsCurrent` |

### Liabilities

| Priority | XBRL Concept                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------- |
| 1        | `us-gaap:Liabilities`                                                                           |
| 2        | `us-gaap:LiabilitiesCurrent` + `us-gaap:LiabilitiesNoncurrent` (computed sum)                   |
| 3        | `us-gaap:LiabilitiesAndStockholdersEquity` - `us-gaap:StockholdersEquity` (computed difference) |

### Current Liabilities

| Priority | XBRL Concept                 |
| -------- | ---------------------------- |
| 1        | `us-gaap:LiabilitiesCurrent` |

### Equity

| Priority | XBRL Concept                                                                             |
| -------- | ---------------------------------------------------------------------------------------- |
| 1        | `us-gaap:StockholdersEquity`                                                             |
| 2        | `us-gaap:StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest`         |
| 3        | `us-gaap:LiabilitiesAndStockholdersEquity` - `us-gaap:Liabilities` (computed difference) |
| 4        | `us-gaap:MembersEquity` (for LLCs)                                                       |
| 5        | `us-gaap:PartnersCapital` (for partnerships)                                             |

### Interest Expense

| Priority | XBRL Concept                          |
| -------- | ------------------------------------- |
| 1        | `us-gaap:InterestExpense`             |
| 2        | `us-gaap:InterestExpenseNonoperating` |
| 3        | `us-gaap:InterestExpenseOperating`    |
| 4        | `us-gaap:InterestExpenseDebt`         |
| 5        | `us-gaap:InterestAndDebtExpense`      |

### Cash

| Priority | XBRL Concept                                                            |
| -------- | ----------------------------------------------------------------------- |
| 1        | `us-gaap:CashAndCashEquivalentsAtCarryingValue`                         |
| 2        | `us-gaap:CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents` |
| 3        | `us-gaap:Cash`                                                          |
