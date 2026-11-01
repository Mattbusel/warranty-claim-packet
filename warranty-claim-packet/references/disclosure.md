# Disclosure

## Principal functionality developed for the UGREEN Hackathon 2026

All of the following was newly written for this Hackathon in November 2026 by the entrant, Matthew Busel:

- The two-mode workflow (coverage ledger and claim packet) and its nine-step expert orchestration in SKILL.md.
- The rule set that joins purchase records from documents and photographed receipts with warranty terms from manuals and warranty cards, and the coverage status and expiry date rules in [coverage-rules.md](coverage-rules.md).
- The claim letter structure, packet folder layout and claim checklist in [claim-packet.md](claim-packet.md).
- The approval, empty-result and partial-result handling for every write step.

## Third-party components and open source libraries

None are bundled. The package contains only Markdown files written by the entrant.

The Skill was authored against the official UGREEN Skill Developer Package, `uliya-skill-kit` version 0.7.3 (capability catalog 2.0.0), downloaded from the UGREEN Hackathon Starter Kit page at ai.ugreen.com/pages/hackathon-starter-kit and used under the UGREEN Skill Hub User Agreement, Privacy Policy and Skill Content Safety and Publishing Guidelines. No file from that package is redistributed here. Its bundled static checker was run against this package; the result is recorded in the project repository.

The Skill delegates only to the registered UGOS experts `file-agent`, `photo-agent`, `document-agent` and `knowledge-agent`, which belong to UGOS.

## External services and data flows

None. The Skill reads and writes only files the signed-in user can access on the NAS, through UGOS experts. It does not send, upload or email any data, and it does not call any outside API. Payment card numbers are masked to the last four digits in every result.

## AI tools used and their principal uses

- **Claude (Anthropic), in Claude Code, working from the official uliya-skill-kit authoring references**: drafting and revising SKILL.md and the reference files, mapping each step to catalog capabilities, and running the kit's static checker. The entrant directed the design and reviewed every file.
- **At run time on the NAS**: the Skill uses whatever model the UGOS experts use, including the AI NAS local model for photo text recognition and document reading. The Skill does not require a third-party model.
