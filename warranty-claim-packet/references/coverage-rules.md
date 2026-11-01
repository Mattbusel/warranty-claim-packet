# Coverage rules

Read this before deciding coverage in Step 7. The parent applies these rules only to values that a child expert returned with a source file. Nothing here permits estimating a missing date or term.

## Inputs per product

- **Purchase date**: from a record in PURCHASES. If the record also has a printed delivery date and TERMS says coverage starts on delivery, use the delivery date as the start date and say so.
- **Term**: from TERMS, as a whole number of months or years quoted from the source. Convert years to months (1 year = 12 months).
- **Today**: the current date on the NAS at the time of the run.

## Expiry date

Expiry = start date plus the term in calendar months, minus one day. When the start day does not exist in the end month (for example 31 January plus 1 month), use the last day of the end month.

Examples:

| Start | Term | Expiry |
| --- | --- | --- |
| 2025-03-14 | 12 months | 2026-03-13 |
| 2024-01-31 | 1 month | 2024-02-29 |
| 2023-11-01 | 24 months | 2025-10-31 |

## Status

| Status | Rule |
| --- | --- |
| `covered` | Expiry is more than 60 days after today |
| `expiring soon` | Expiry is today or within the next 60 days |
| `expired` | Expiry is before today |
| `term unknown` | A purchase date was found but TERMS has no warranty period for this product |
| `no proof found` | No purchase record with a legible purchase date was found for this product |

Days left = expiry minus today, in whole days. Show it for `covered` and `expiring soon`.

## Edge cases

- **Several terms for one product** (for example 2 years on parts and 5 years on the motor): show each term as its own line with its quoted sentence. In `claim` mode, ask the user which part failed before choosing the line.
- **Registration required**: if TERMS says an extended term needs product registration and no registration confirmation was found in DOC_CANDIDATES, use the base term and add the note "extended term needs proof of registration".
- **Seller and manufacturer warranties**: keep them as separate lines with their own sources.
- **Exclusions**: if the user's FAULT matches an exclusion quoted in TERMS (for example accidental damage or commercial use), keep the date status but add the warning "fault may be excluded" with the quoted exclusion. Never decide the exclusion for the user.
- **Refurbished, open-box or second-hand purchases**: if the receipt says so, flag it, because terms often differ; use only a term that the documents state for that condition.
- **Gift or duplicate receipts**: a gift receipt without a price is still proof of the purchase date. Duplicates of the same purchase are one record with several sources.
- **Unreadable dates**: a date the expert marked illegible is missing. Ask the user; do not read it yourself from the file name.

## Ledger table

Show and save the ledger in this exact column order:

| Item | Merchant | Purchase date | Term | Expiry | Status | Days left | Proof file | Terms source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

Rules for the table:

- One row per product and term line. Sort `expiring soon` first, then `covered` by expiry date, then `term unknown`, `no proof found` and `expired`.
- "Proof file" and "Terms source" are the real paths returned by the experts. For a term quoted from a document add the page, for example "Manuals/DW-500.pdf p.14".
- Under the table, list "Not read" files and any warnings, then the date of the run.
