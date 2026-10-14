---
name: course-learning-document
description: Turn lesson transcripts into a cumulative, accessible learning course with structured explanations, examples, guided practice, feedback, progress and review. Use when the user sends a transcript and asks to add a lesson or chapter, or to start a subject.
---

# Course learning document builder

Build one cumulative learning site organised by subject and lesson. The goal is for the learner to understand and use the material, not only to revise it. Zlearn is a static multi-page site: the home page lists subjects, each subject has one page, and shared styles and scripts live in `assets/`.

## Content policy

1. Read the full transcript and the existing subject page before editing. Never delete or replace a lesson.
2. Preserve the teacher’s explanation as the main course content. Correct obvious transcription errors only when context makes the correction certain; mention uncertain names, dates, terms or numbering to the user.
3. When the transcript needs clarification, add a concise supplement only when it can be verified. Label it visibly as **إضافة تعليمية** and cite the source next to it. Keep the teacher’s explanation and the supplement distinct. If verification is not possible, mark the point for teacher review rather than guessing.
4. Do not silently introduce rulings, doctrinal claims, grammatical rules, dates, or attributions from outside sources. Use primary course material or authoritative sources appropriate to the subject and cite them.
5. Present disputed or personal positions as “according to the teacher”. Never imply that a self-check score certifies mastery.
6. Do not reproduce poems, long passages, or copyrighted texts. Paraphrase. For memorisation, provide a blank practice area for text the learner supplies.

## Learning sequence for each dars

Use the material that is actually available; do not invent missing programme details.

1. **Header and outcomes:** subject, dars number, title, and 2–4 observable learning outcomes.
2. **Orientation:** a short explanation of why the lesson matters and any verified prerequisite. If there is no known prerequisite, do not invent one.
3. **Explain in steps:** divide the teacher’s content into short, ordered parts. Choose the visual that teaches it best: comparison table, classification tree, worked example, timeline, process, or rule box.
4. **Worked examples:** show how to apply the idea, then invite the learner to try a parallel example before revealing a model answer.
5. **Practice and feedback:** include questions that test recall, understanding and application. Give a model answer or explanation; link errors back to the relevant lesson section. Keep self-assessment explicitly labelled as self-assessment.
6. **Key terms and takeaways:** define only terms used in the lesson and end with a short synthesis.
7. **Completion and next step:** let the learner record that they completed the lesson after studying and attempting the practice; provide previous/next lesson navigation.
8. **Review aids:** retain optional checklists, flash recall, maps and spaced review as supporting tools, not as the main learning experience.

Every new section id is unique and prefixed by the lesson (e.g. `aq4-outcomes`). Checkbox ids and SVG marker ids remain unique within the page.

## Navigation and progress

- Keep the three-level subject / dars / section navigation.
- Make the learning path and “continue where you left off” available across the site.
- Track lesson completion separately from memorisation checklists and quiz self-assessment.
- Explain that browser-only progress is stored on the current device.
- Keep content readable if JavaScript fails; scripts enhance navigation and progress but do not contain the lesson itself.

## Language and design

- Write lesson content in the course language. Zlearn lessons are Arabic (`lang="ar" dir="rtl"`); communicate with the user in their language.
- Use simple, teachable phrasing. Distinguish definition, example, application and source note.
- Define colors with CSS variables and light/dark values. Use the shared stylesheet and ES5 vanilla JavaScript.
- Keep Arabic typography readable, diagrams accessible, focus visible, and layout usable at 400 px.
- No dead buttons or links.

## Technical workflow

1. Identify subject, dars number and title. Ask if they cannot be established confidently.
2. Back up the relevant page before a substantial edit.
3. Build the dars in a separate fragment and merge it with an asserted unique anchor.
4. Update the subject tabs, section links, homepage links and shared manifest as required.
5. Preserve existing local progress keys when adjusting a page; update checklist totals only when the number of checkboxes changes.
6. Run `python3 .opencode/skills/transcript-to-lesson/scripts/validate_site.py .` and report any source uncertainties.

## Reply

Briefly report what changed, what was validated, and any transcript uncertainty or externally sourced supplement that needs review. Do not hide a source attribution or a numbering mismatch.
