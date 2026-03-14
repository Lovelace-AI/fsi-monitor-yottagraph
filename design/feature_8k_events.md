# Feature Overview

Status: Implemented

A feature box (in the Edgar Company Profile dialog) containing a table of 8-k events filed about a company. Each row in the table applies to a single event.
Table columns: Date, Item, Event Type, Severity

In addition to being displayed in the app, this table is stored in memory for further processing. We save the entire contents of the table, which will be used in other company profile info boxes.

## Finding 8k events

If the `form_type` of `document` is `8-K`, this is an 8-K form. These document should also have a property `filing_reference`, which will return multiple `event` entities. Each of those `event`s should have a `form_8k_item_code` property.

## Table

The table includes all 8k events. We take the filing date from the document with the 8k event attached. They are sorted in reverse chronologic order (most recent at the top). The date is given in the format "Nov 11, 2025". The value for the property will be the item ex. "1.01".

### Item-Event Type-Severity Lookup

The mapping between item codes, event types, and severities is encoded based on the information in this table. This mapping should match the mapping found using `form_8k_item_code` and `form_8k_event`.

| Item Code | Event                           | Severity |
| --------- | ------------------------------- | -------- |
| 1.01      | `FINANCING_MATERIAL_AGREEMENT`  | high     |
| 1.02      | `FINANCING_TERMINATION`         | high     |
| 1.03      | `FINANCING_BANKRUPTCY`          | critical |
| 1.04      | `OPERATIONAL_SAFETY`            | medium   |
| 2.01      | `MNA_ACQUISITION_DISPOSITION`   | medium   |
| 2.02      | `FINANCIAL_RESULTS`             | low      |
| 2.03      | `FINANCING_DIRECT_OBLIGATION`   | medium   |
| 2.04      | `FINANCING_TRIGGERING_EVENTS`   | high     |
| 2.05      | `OPERATIONAL_RESTRUCTURING`     | medium   |
| 2.06      | `FINANCIAL_IMPAIRMENT`          | high     |
| 3.01      | `DELISTING_NOTICE`              | high     |
| 3.02      | `EQUITY_ISSUANCE`               | low      |
| 3.03      | `GOVERNANCE_STOCKHOLDER_RIGHTS` | medium   |
| 4.01      | `ACCOUNTING_AUDITOR_CHANGE`     | medium   |
| 4.02      | `ACCOUNTING_NON_RELIANCE`       | critical |
| 5.01      | `GOVERNANCE_CHANGES_CONTROL`    | high     |
| 5.02      | `EXEC_DEPARTURE_APPOINTMENT`    | medium   |
| 5.03      | `GOVERNANCE_BYLAW_CHANGE`       | low      |
| 5.04      | `TRADING_SUSPENSION`            | high     |
| 5.05      | `GOVERNANCE_ETHICS_CHANGE`      | low      |
| 5.06      | `CORPORATE_STRUCTURE_CHANGE`    | medium   |
| 5.07      | `GOVERNANCE_SHAREHOLDER_VOTE`   | low      |
| 5.08      | `GOVERNANCE_NOMINATION`         | low      |
| 6.01      | `ABS_DISCLOSURE`                | low      |
| 7.01      | `REG_FD_DISCLOSURE`             | low      |
| 8.01      | `OTHER_EVENT`                   | low      |
| 9.01      | `EXHIBITS`                      | low      |
