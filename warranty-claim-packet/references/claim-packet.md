# Claim packet

Read this before Step 8 in `claim` mode. A claim packet is what a support agent asks for on the first call: proof of purchase, the product identity, a clear description of the fault and the term that covers it. Assembling it in one folder is what turns a lost afternoon into a five-minute email.

## Claim letter structure

The letter is drafted by `document-agent` from verified facts only, then shown to the user for edits.

1. **Subject line**: "Warranty claim: " followed by brand, model and, if found, serial number.
2. **Opening**: the product, the merchant, the purchase date and the order or receipt number.
3. **Fault**: the user's FAULT text, in the user's words, with the date it started.
4. **Coverage**: the quoted warranty sentence from TERMS with its source, and the expiry date computed under [coverage-rules.md](coverage-rules.md) only if the user wants it included.
5. **Remedy requested**: repair or replacement, as the quoted clause allows. If the clause names a specific remedy, use that one.
6. **Attachments**: the list of files copied into the packet.
7. **Sign-off**: blank lines for the sender name, address, phone and email. The Skill never fills these in.

Tone is formal and short; one page is the target. No threats, no legal claims, and no statements that are not backed by a source.

## Packet folder contents

Folder: `Warranty/Claims/` inside the user home directory, then a folder named after the item and the run date.

| File | Source |
| --- | --- |
| Copy of the proof of purchase | The chosen record in PURCHASES |
| Copy of the warranty terms document | The file cited in TERMS |
| Copy of the serial number or rating-label photo | Step 5, only if found |
| Warranty claim letter (Markdown) | LETTER_TEXT, saved by `knowledge-agent` |
| Claim checklist (Markdown) | Saved by `knowledge-agent` |

Originals are never moved or renamed. If a copy with the same name already exists in the folder, it is not overwritten; report it instead.

## Claim checklist

The checklist saved next to the letter contains:

- Verdict, start date, term, expiry date and days left, each with its source.
- The claim channel from TERMS (phone, web form, email or return to the store), quoted.
- The documents the terms say are required, each marked "in packet" or "missing".
- Fields the user still has to complete: sender details, photos or video of the fault if the terms ask for them, and the product's current location for pickup if relevant.
- Warnings carried over from coverage rules, such as "fault may be excluded" or "extended term needs proof of registration".
