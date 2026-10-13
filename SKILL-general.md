---
name: course-revision-document
description: Turn lesson transcripts (YouTube or any video/audio course) into one cumulative, professional revision document with diagrams, mind maps, key takeaways, glossary, checklist and quiz. Use when the user sends a transcript and asks to add a lesson or chapter, or to start a revision document.
---

# Course revision document builder

The user sends lesson transcripts one at a time. You build and keep growing **one single revision document** organised by subject, then by lesson. Each new transcript is added to the same document, never to a new one.

## Settings to confirm once (then remember)
- **Document language and direction** (e.g. Arabic RTL, French, English). Write the document in that language. Talk to the user in the language they write to you.
- **Output format**: a single self-contained HTML page (preferred, supports diagrams and navigation), or the format the user names (docx, pdf, slides). If a published-page tool such as an Artifact is available, publish there and **republish the same file/URL** on every update.
- **Subjects**: the course may have several subjects (e.g. law, theory, practice). Group lessons by subject.

## Workflow for every new transcript
1. **Open the existing document first** (re-read it from its link or file). Edit it; never rebuild from scratch. If none exists, create it with the structure below.
2. **Read the whole transcript.** Transcripts are often auto-generated: fix obvious errors (names, dates, technical terms) from context. List every doubtful fix and every guess in your chat reply, not inside the document.
3. **Identify the subject and lesson number.** Follow the order the user sends lessons, even if the teacher numbers them differently; mention any mismatch.
4. **Write only what the teacher said.** Do not add outside facts silently. If you add a complement, flag it in the reply. Present disputed or personal positions as "according to the teacher".
5. **Build the lesson block** (see below), merge it into the document, check it, republish.
6. **Reply briefly**: one sentence on what was added, then a short list of points to verify against the source.

## Lesson block (in this order)
1. **Header**: subject · lesson number · title.
2. **Summary in three sentences.**
3. **Mind map**: central topic with about six branches (inline SVG).
4. **Core sections**: choose the visual that fits the content: flowchart for processes, tree for classifications, table for comparisons, timeline for history, nested diagram for set relations, cards for definitions or biographies, numbered steps for procedures, rule boxes for rules.
5. **Glossary** of the terms used in the lesson.
6. **Must-remember checklist**: tick boxes with a progress counter saved in the browser.
7. **Quiz**: 10 to 12 questions, each answer hidden until opened, plus a "show all answers" button.

Give every section a unique id prefixed by the lesson (e.g. `s2-summary`). Keep checkbox ids and SVG marker ids unique across the whole document.

## Navigation structure
- Sticky top bar with three levels: **subjects**, **lesson tabs** for the chosen subject, **section links** for the chosen lesson.
- Only one lesson visible at a time; all lessons stay visible if scripts fail.
- Adding a lesson to an existing subject = new tab + new section-links row + new lesson block at the end of that subject.
- Adding a new subject = new subject button + its tab row + a new subject container, and update the title area that lists the subjects.
- Remember the last viewed lesson in browser storage (wrapped in try/catch).

## Content rules
- **Copyright**: never reproduce poems, song lyrics, verses or long passages from books. Paraphrase and quote only short terms. For memorisation of verses or texts, provide an empty box where the user pastes their own text and tests themselves from memory.
- Facts must come from the transcript. Dates, names and numbers that are unclear are marked in the reply for the user to check.
- No "notes on the transcript" section in the page. Corrections go in the chat reply.
- Keep wording simple and exam-oriented: definitions, rules, lists, classifications, examples.

## Design rules for HTML pages
- Define colours as CSS variables with a dark-mode variant; no hard-coded colours.
- Use web fonts from a trusted provider only, with a proper font for the document's script (e.g. Arabic).
- Wide diagrams sit in a horizontally scrollable container; the page must stay readable at 400 px wide.
- Contrast and focus states must be accessible; do not rely on colour alone.
- Respect the text direction of the document language (`dir="rtl"` for Arabic, Hebrew, etc.).

## Technical method (large files)
- Write the new lesson in a separate file, then merge by script (e.g. Python string replace) with an assertion that each anchor point occurs exactly once. Avoid exact-match manual edits on the big file.
- After merging check: duplicate ids, balanced tags, checklist counter equals the number of boxes, links to existing section ids.
- Republish to the same location so the link never changes.

## Final reply template
- Added: subject, lesson N, what it contains.
- To verify: bullet list of transcript corrections, uncertain dates or names, anything you added yourself, numbering mismatch.
- Do not paste the link unless asked.
