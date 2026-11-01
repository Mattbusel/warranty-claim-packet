# Warranty Claim Packet

A UGREEN AI NAS Skill that answers "is this still under warranty?" from the files you already have, and builds the claim packet when something breaks.

Your proof of purchase is never in one place. The invoice is a PDF in Downloads, the paper receipt is a phone photo in the backup, the manual is somewhere else, and the serial number is on a label you photographed once. This Skill finds all of them on the NAS, joins them, and gives you:

- **A coverage ledger**: every purchase it can prove, with the proof file, warranty term, expiry date, days left and a status of `covered`, `expiring soon`, `expired`, `term unknown` or `no proof found`.
- **A claim packet** for one broken item: a dated verdict that quotes the warranty clause it relies on, a formal claim letter written only from verified facts, and a folder with copies of the receipt, the terms and the serial photo.

Nothing leaves the NAS. The Skill never sends anything, never moves or deletes originals, and asks before every write.

Entry for the [UGREEN Hackathon 2026 on AI NAS](https://ugreenhackathon.devpost.com/), track Automate Your Workflow. Devpost: https://devpost.com/software/warranty-claim-packet. Round 1 walkthrough video (1:50): https://youtu.be/bYfK_iADNuc

## What is in this repo

| Path | What it is |
| --- | --- |
| `warranty-claim-packet/SKILL.md` | The Skill entry point (Uliya Skill Development Standard) |
| `warranty-claim-packet/references/` | Coverage rules, claim packet spec, disclosure |
| `dist/warranty-claim-packet.zip` | The Round 1 Pre-test Skill Package |
| `proposal/` | Round 1 proposal (HTML source and PDF) |
| `checks/static-check-uliya-0.7.3.json` | Output of the official checker on this package |
| `.github/workflows/check.yml` | CI that downloads the official kit and fails unless the check is `static-pass` |
| `scripts/demo/record.mjs` | Records the walkthrough video (headless Chrome, a real checker run, local Piper narration, ffmpeg) |

## How it works

The Skill is pure orchestration: the parent never touches files itself, it delegates each step to a registered UGOS expert and passes only real results forward.

| Step | Expert | Catalog capability | Writes? |
| --- | --- | --- | --- |
| 1. Resolve the user home folder | `file-agent` | `file-workflow get-user-dir` | No |
| 2. Find invoices, receipts, manuals | `file-agent` | `ug-filesystem find` | No |
| 3. Find receipt, warranty card and label photos | `photo-agent` | `ug-photo search-screen`, `search-picture` | No |
| 4. Extract purchase records from documents | `document-agent` | `ug-document extract` | No |
| 5. Read receipts and serial labels in photos | `photo-agent` | `ug-photo vision-ocr`, `vision-vlm` | No |
| 6. Find the warranty term and quote it | `document-agent` | `ug-document qa` | No |
| 7. Decide coverage (date rules) | parent | none | No |
| 8. Draft the claim letter | `document-agent` | `ug-document writing` | No |
| 9. Save packet or ledger, optional tags | `file-agent`, `knowledge-agent` | `ug-filesystem mkdir`, `cpmv` (copy), `ug-knowledge save-text`, `ug-filemgr tag-*` | Yes, after approval |

Every delegation handles `completed`, `failed`, `cancelled`, `waiting_user` and `waiting_approval`. Empty results stop the workflow honestly instead of substituting a similar file.

## Check it yourself

```
curl -sSL -o kit.zip "https://cdn.shopify.com/s/files/1/0630/9416/1602/files/uliya-skill-kit-0.7.3-en.zip?v=1790578898"
unzip -q kit.zip -d kit
node kit/uliya-skill-kit/scripts/check-skill.mjs warranty-claim-packet
```

Expected: `"status": "static-pass"` with 0 errors and 0 warnings. A static pass does not prove behavior on a device; that is what the Round 2 NAS test day is for.

## Install on a UGREEN AI NAS

Upload `dist/warranty-claim-packet.zip` through UGREEN Skill Hub, then ask Uliya something like:

- "Which of my appliances are still under warranty?"
- "My dishwasher stopped draining last week. Am I still covered?"

## License

MIT. The UGREEN Skill Developer Package is not redistributed here; CI downloads it from UGREEN.
