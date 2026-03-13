# Implementation Status

## Files

# Feature Overview

A feature box (in the Edgar Company Profile dialog) containing a table of edgar filings for a company.

Each row in the table applies to a single document.

The columns are

1. Filing date
2. Form type

## Display Rules

- **Row ordering**: Rows are sorted by `filing_date`, most recent first
- **Date limit**: Only show filings from the previous 3 years
- **Filing filter**: All form types are included

# Details

## Looking up properties

Each row in the table displays the financial facts from a specific Edgar filing. You should already have the NEID of the company. See `DESIGN.md` "Edgar Data" section for information on querying document properties.

PROPERTIES SHOULD BE QUERIED AS A BULK CALL WHENEVER POSSIIBLE, OTHERWISE IT WILL BE VERY SLOW! ALL PROPERTIES SHOULD HAVE BEEN QUERIED WHEN LOADING THE COMPANY, BEFORE ARRIVING AT THIS BOX!
