## Inspiration

Warranties are worth money only if you can prove two dates: when you bought the thing, and how long the cover runs. Most people can prove neither in the five minutes before they give up. The invoice is a PDF in Downloads, the paper receipt is a phone photo from two years ago, the manual is somewhere else, and the serial number is on a label you once photographed under the sink. A NAS is the one place where all of those files already end up, which makes it the right place to join them.

## What it does

**Warranty Claim Packet** is a Skill for UGREEN AI NAS with two modes.

- **Ledger**: "Which of my things are still under warranty?" You get one table of purchases with the proof file, the warranty term, the expiry date, days left and a status: `covered`, `expiring soon`, `expired`, `term unknown` or `no proof found`.
- **Claim**: "My dishwasher stopped draining. Am I still covered?" You get a dated verdict that quotes the exact warranty sentence it relies on, a formal claim letter written only from verified facts, and, after you approve, a folder `Warranty/Claims/<item> <date>` with copies of the receipt, the terms and the serial photo, plus a checklist of what the support desk will ask for.

It never guesses. A missing term is `term unknown`, an illegible date is a question back to you, and an empty search says which folders were searched and stops. Nothing is sent anywhere, originals are only copied, and every write waits for approval.

## How we built it

The Skill follows the Uliya Skill Development Standard from the official UGREEN Skill Developer Package (uliya-skill-kit 0.7.3, capability catalog 2.0.0). It is pure orchestration: the parent only delegates to the registered experts and passes real results forward.

| Step | Expert | Capability |
| --- | --- | --- |
| Resolve the home folder | file-agent | file-workflow get-user-dir |
| Find invoices, receipts, manuals | file-agent | ug-filesystem find |
| Find receipt, warranty card and label photos | photo-agent | ug-photo search-screen, search-picture |
| Extract purchase records | document-agent | ug-document extract (receipt and invoice schemas) |
| Read receipts and serial labels in photos | photo-agent | ug-photo vision-ocr, vision-vlm (local model) |
| Find and quote the warranty term | document-agent | ug-document qa |
| Draft the claim letter | document-agent | ug-document writing |
| Save packet, ledger, tags | file-agent, knowledge-agent | ug-filesystem mkdir and cpmv (copy), ug-knowledge save-text, ug-filemgr tags |

Coverage is decided by written rules (start date, calendar-month terms, month-end handling, a 60-day "expiring soon" window, separate parts and motor terms, registration-only extensions, exclusions that match the fault). Every delegation handles `completed`, `failed`, `cancelled`, `waiting_user` and `waiting_approval`.

The package passes the kit's own static checker as **static-pass with 0 errors and 0 warnings**, and GitHub Actions re-downloads the official kit and re-runs that check on every push.

## Challenges we ran into

- The checker is strict in useful ways: delegate instructions must be single self-contained shell strings, so values passed between steps are named UPPERCASE values that the parent replaces with real expert results, and a missing value stops the dependent step instead of guessing.
- Receipts live in two worlds, documents and photos, which need different experts. The Skill merges records from both and keeps every source file attached, so the verdict can always point at its evidence.

## What we learned

Most of the value is in refusing to fill gaps. A warranty verdict that guesses a date is worse than none, because the support desk will reject it.

## What's next

Round 2 on a real iDX6011 Pro: tune search words on real photo libraries, check OCR recall on crumpled receipts, confirm the approval prompts for each write, and record the full claim flow end to end.

## Round 1 materials

- Proposal PDF and Pre-test Skill Package ZIP are attached to this submission.
- Source (MIT): https://github.com/Mattbusel/warranty-claim-packet
