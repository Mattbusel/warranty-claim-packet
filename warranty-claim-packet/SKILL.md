---
name: warranty-claim-packet
description: Warranty coverage ledger and ready-to-send claim packet assembled from the receipts, invoices, warranty cards, manuals and product-label photos already stored on the NAS. Use when the user asks whether something is still under warranty, which purchases have warranties running out soon, or says an item broke and wants help filing a warranty claim.
---

# Goal

People keep proof of purchase in three places that never meet: PDF invoices and order confirmations in Downloads or Documents, phone photos of paper receipts and warranty cards in the photo backup, and product manuals saved somewhere else. When something breaks, they cannot find the receipt in time, do not know whether the warranty still runs, and give up on a repair they were owed.

This Skill joins those scattered files on the NAS into two user-visible results:

1. **Coverage ledger** (mode `ledger`): one table of the user's purchases with the proof file, purchase date, warranty term, expiry date and a status of `covered`, `expiring soon`, `expired`, `term unknown` or `no proof found`, saved as a Markdown file after the user approves.
2. **Claim packet** (mode `claim`): for one broken item, a dated coverage verdict with the exact warranty clause that supports it, a formal claim letter drafted from verified facts only, and a folder holding copies of the proof of purchase, the warranty terms and the serial-number photo, created after the user approves.

Supported scope: files and photos the signed-in user can already access on this NAS. The Skill never sends, emails or uploads anything; the user decides what to send to the manufacturer or store. It only copies files into the packet folder and never moves, renames or deletes the originals.

# Required input

Collect only what the parent workflow needs, then confirm it back to the user in one sentence before Step 1.

- **Mode**: `ledger` (what is still covered) or `claim` (one item broke). If the request is ambiguous, ask which one.
- **For `claim` only**: the item in the user's own words (brand and model if known, otherwise a description such as "the dishwasher"), what went wrong in one or two sentences, and roughly when it started.
- **Optional narrowing**: the store or the approximate purchase month or year, and any extra folders the user wants included. Default scope is the user's own home directory returned by `file-agent` plus the user's personal photo library.
- **For `ledger` only, optional**: a start year, for example "purchases since 2023". Default is the last five years.

Do not collect file paths, file IDs, tag IDs, album IDs or other private parameters; the child experts resolve them.

# Generation-time capability evidence

- `ug-filesystem` → `file-agent`
- `ug-filemgr` → `file-agent`
- `file-workflow` → `file-agent`
- `ug-photo` → `photo-agent`
- `ug-document` → `document-agent`
- `ug-knowledge` → `knowledge-agent`

Actions this workflow relies on, as listed in catalog 2.0.0: `file-workflow get-user-dir`, `ug-filesystem find`, `ug-filesystem mkdir`, `ug-filesystem cpmv` (copy only), `ug-filemgr tag-list`, `ug-filemgr tag-add`, `ug-filemgr tag-add-file`, `ug-photo search-screen`, `ug-photo search-picture`, `ug-photo vision-ocr`, `ug-photo vision-vlm`, `ug-photo meta`, `ug-document extract`, `ug-document qa`, `ug-document writing`, `ug-knowledge save-text`. The parent Skill never calls cli.invoke itself; it only delegates.

# Orchestration

## Values carried between steps

Each later instruction uses UPPERCASE names for values that come from an earlier step. Before delegating, replace every UPPERCASE name with the real result returned by the earlier delegation or the real answer the user gave. If a required value is unavailable, do not send that delegation; follow the rules in Completion and failure.

| Name | Comes from | Meaning |
| --- | --- | --- |
| HOME_DIR | Step 1 | The user home directory path returned by `file-agent` |
| EXTRA_DIRS | Required input | Extra folders the user named, or none |
| ITEM | Required input | The item in the user's words, plus brand and model once confirmed |
| FAULT | Required input | The user's description of what went wrong and when |
| SINCE_DATE | Required input | Earliest purchase date to consider |
| DOC_CANDIDATES | Step 2 | Real document paths returned by `file-agent` |
| PHOTO_CANDIDATES | Step 3 | Real photo paths returned by `photo-agent` |
| PURCHASES | Steps 4 and 5 | Verified purchase records, each tied to one source file |
| TERMS | Step 6 | Verified warranty terms, each with its source file, page and quoted sentence |
| PACKET_DIR | Step 9 | The real packet folder path returned by `file-agent` |
| LETTER_TEXT | Step 8 | The claim letter text the user approved |

## Step 1. Resolve the search scope

`delegate --target file-agent --instruction 'Return the home directory of the current signed-in user on this NAS as a real path together with its fileId. Read only. Do not list, open, change or create anything.'`

Use the returned path as HOME_DIR. If EXTRA_DIRS is not empty, confirm each one exists by asking `file-agent` to report its real path; drop any folder that does not exist and tell the user.

## Step 2. Find candidate proof and terms documents

`delegate --target file-agent --instruction 'Search HOME_DIR and EXTRA_DIRS recursively for documents and images whose file names suggest proof of purchase or warranty terms. Match names containing any of: receipt, invoice, order, purchase, bill, warranty, guarantee, manual, user guide, registration, confirmation, and also the words in ITEM when ITEM is known. Include PDF, DOCX, TXT, HTML, JPG, JPEG, PNG and HEIC files modified on or after SINCE_DATE. Return at most 300 results as a list of real path, fileId, file type, size and modified time. Read only: do not open, move, rename, tag or delete any file. If nothing matches, return an empty result and say so.'`

Store the real result as DOC_CANDIDATES. In `claim` mode with a known ITEM, keep files whose names mention ITEM first.

## Step 3. Find photographed receipts, warranty cards and product labels

`delegate --target photo-agent --instruction 'In the personal photo library of the current user, find photos and screenshots that show paper receipts, invoices, warranty cards or product rating labels with a serial number. Use the photo text recognition index to search for the words receipt, total, invoice, warranty, guarantee, serial, S/N, model, and the brand and model words in ITEM when ITEM is known. Limit to photos taken on or after SINCE_DATE. Return at most 60 photos as real path, capture time and the matched words. Read only: do not create albums, move or delete anything. If nothing matches, return an empty result and say so.'`

Store the real result as PHOTO_CANDIDATES.

If DOC_CANDIDATES and PHOTO_CANDIDATES are both empty, stop here and follow the empty-result rule in Completion and failure.

## Step 4. Read purchase details from documents

`delegate --target document-agent --instruction 'For each file in DOC_CANDIDATES that is a PDF, DOCX, TXT or HTML document, extract purchase records using the receipt or invoice extraction schema. For every purchased line item return: merchant name, purchase date, delivery date if printed, item description, brand, model number, quantity, price, currency, order or receipt number, and the source file path and page. Mask any payment card number to its last four digits. Report a field as missing when it is not printed; never estimate a date or price. Also return the list of files that could not be read and why. Read only.'`

## Step 5. Read purchase details and serial numbers from photos

`delegate --target photo-agent --instruction 'For each photo in PHOTO_CANDIDATES, read the printed text. If the photo shows a receipt or invoice, return merchant name, purchase date, item lines with prices, total, and receipt number exactly as printed. If the photo shows a product label or warranty card, return brand, model number, serial number and any printed warranty period exactly as printed. Return the source photo path with every value and mark each field as missing when it is not legible; never guess characters. Read only.'`

Merge the real results of Steps 4 and 5 into PURCHASES. Each record keeps its source file. When two sources describe the same purchase (same merchant, same date, same item), keep one record and list both sources. In `claim` mode, ask the user to pick the right record when more than one purchase matches ITEM, and wait for the answer.

## Step 6. Find the warranty terms

`delegate --target document-agent --instruction 'Using the manuals, warranty cards and order confirmations in DOC_CANDIDATES that mention the brand or model of each record in PURCHASES, answer for each product: how long the manufacturer or seller warranty lasts, whether it starts on the purchase date or the delivery date, whether registration was required, which faults or uses are excluded, and how a claim is filed (contact channel and required documents). Quote the exact sentence that states each answer with its file path and page. If no document states a warranty period for a product, say that no warranty period was found for it. Read only.'`

Store the real result as TERMS. A warranty period printed on a photographed warranty card in Step 5 also counts, with that photo as its source.

## Step 7. Decide coverage

The parent computes coverage itself from PURCHASES and TERMS only, following [references/coverage-rules.md](references/coverage-rules.md). Every verdict cites the source file of the purchase date and the source file and quoted sentence of the term. A record with no term found is `term unknown`; it is never treated as covered or expired by assumption.

## Step 8. Present the result and draft the claim letter

**`ledger` mode:** show the ledger table defined in [references/coverage-rules.md](references/coverage-rules.md), sorted by expiry date, with `expiring soon` rows first. Then ask whether to save it and whether to tag the proof files. Continue to Step 9 only after a clear yes.

**`claim` mode:** show the verdict for the chosen record. If the verdict is `covered`, `expiring soon` or `term unknown`, offer the claim letter. If it is `expired`, say so with both dates and draft a goodwill request only if the user asks for one, labelled as outside warranty. To draft:

`delegate --target document-agent --instruction 'Draft a formal warranty claim letter in English using only these verified facts: product ITEM, purchase record and order number from PURCHASES with its merchant and date, serial number if found, the fault as described by the user in FAULT, and the warranty clause quoted in TERMS with its source. Follow this structure: subject line, opening that identifies the product and purchase, fault description, the clause showing coverage, the remedy requested (repair or replacement as the clause allows), and a list of attached documents. Leave the sender name, address and contact lines for the user to fill in. Do not add facts that are not in the inputs. Return the letter text only; do not save it.'`

Follow the letter structure and attachment list in [references/claim-packet.md](references/claim-packet.md). Show the full draft to the user and apply the edits they ask for. The approved text becomes LETTER_TEXT.

## Step 9. Save, after explicit approval

Before any write, tell the user exactly what will be created and where, and wait for a clear yes. Writes happen in this order and each one uses the real result of the one before it.

`delegate --target file-agent --instruction 'Create the folder Warranty inside HOME_DIR if it does not exist, and inside it the folder Claims, and inside that a folder named after ITEM followed by the date of today in YYYY-MM-DD form. Do not overwrite or change any existing folder. Return the real path of the deepest folder.'`

Only in `claim` mode. Store the returned path as PACKET_DIR, then:

`delegate --target file-agent --instruction 'Copy, do not move, these approved source files into PACKET_DIR: the proof of purchase file for the chosen record in PURCHASES, the warranty terms file cited in TERMS, and the serial number photo if one was found. Never overwrite a file that already exists in PACKET_DIR. Leave the original files unchanged. Return the real path of every copy and any file that failed.'`

`delegate --target knowledge-agent --instruction 'Save LETTER_TEXT as a new Markdown file in PACKET_DIR with the file name hint Warranty claim letter. Then save a second Markdown file in PACKET_DIR with the file name hint Claim checklist that lists the verdict, the expiry date, the copied evidence file paths, the claim channel from TERMS, and the fields the user still has to fill in. Return the real output file path and byte count of each saved file.'`

Only in `ledger` mode, save the approved table:

`delegate --target knowledge-agent --instruction 'Save the approved warranty ledger table as a new Markdown file inside the Warranty folder of HOME_DIR with the file name hint Warranty ledger and the date of today. The content is exactly the table the user approved, followed by the list of sources. Return the real output file path and byte count.'`

Optional tagging, only when the user said yes to tagging:

`delegate --target file-agent --instruction 'Check whether a file tag named warranty-proof exists; create it only if it is missing. Then add the warranty-proof tag to each proof of purchase file listed in the approved ledger. Do not change any other tag or file. Return each file path with tagged or failed.'`

Finish by telling the user the real saved paths and, in `claim` mode, the claim channel from TERMS. The Skill does not contact the manufacturer or store.

# Completion and failure

Report a business result only after the delegated expert returns `completed` with real data. Handle every delegation state explicitly:

- `completed`: use only the returned real result in later steps. An empty list is a valid completed result, not an error.
- `failed`: tell the user which step failed and the reason the expert gave. Keep any results already verified. Stop every step that needs the failed result; for example, without PURCHASES there is no verdict and no letter.
- `cancelled`: stop the workflow, report what was found so far, and confirm that nothing was written after the cancellation.
- `waiting_user`: relay the expert question to the user word for word, wait for the answer, then resume the same step. Do not answer on the user's behalf.
- `waiting_approval`: tell the user that the NAS is asking for approval of the named write, and resume only after the approval is granted. If approval is refused, treat the write as cancelled and keep the read results.

Empty and partial results:

- If Steps 2 and 3 return no results at all, say that no receipts, invoices, warranty cards or manuals were found in the searched folders, name those folders, and stop. Offer to search a folder the user names. Never substitute a similar product or a different purchase.
- If no purchase record matches ITEM, say so, list the closest file names found so the user can point to the right one, and do not draft a letter.
- If a purchase date is missing or illegible, the record is `no proof found` for date purposes; ask the user whether another file shows the date.
- If some files could not be read, list them under "Not read" in the result so the user knows the ledger may be incomplete.
- If only some copies or saves succeed in Step 9, report each succeeded and failed item with its real path, and do not claim the packet is complete.

The workflow is complete when the user has seen the ledger or verdict, and every write the user approved has returned `completed` with a real output path.

# References

- [references/coverage-rules.md](references/coverage-rules.md): how coverage is decided, the ledger table, and date edge cases. Read before Step 7.
- [references/claim-packet.md](references/claim-packet.md): claim letter structure, packet contents and the claim checklist. Read before Step 8 in `claim` mode.
- [references/disclosure.md](references/disclosure.md): third-party components, licenses, AI tools used and the functionality developed for the UGREEN Hackathon 2026.
