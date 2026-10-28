# Editing the portfolio's content

Every card on the page except the Lab's is a Markdown file in `src/content/cards/<section>/`. The fields go in
the front matter and the description goes below it:

```md
---
title: IEEE Senior Member
company: IEEE
companyLogo: /logos/ieee-logo.png
date: February 2026
skills:
  - Engineering
---
Elevated membership grade of the IEEE, awarded for professional achievement.
```

To add a card, add a file to the right section's folder. Its name is up to you, but a slug of the title keeps
the folders easy to scan. The Lab's projects are kept separately, in `src/data/lab.js`.

## Fields

| Field | What it does |
| --- | --- |
| `title` | Required, up to 100 characters. It must be unique, because other cards and the strip refer to cards by title. |
| `date` | Required, with a year: `May 2026`, `2016 - 2018` or `February 2022 - Present`. Cards are sorted by it. |
| `company`, `companyLogo` | Who it's from, and their logo: white on transparent, in `public/logos/`. |
| `projectImage` | A photo in `public/images/`, ideally 4:3 and at least 1200 px wide. |
| `video` | `{ id, title }` for a YouTube video, which plays in place. |
| `url` | A link shown in the card's details. |
| `location` | Where it happened. For press pieces, the outlet. |
| `volume` | For papers: `Journal, Volume n, Issue m`. The journal shows on the tile. |
| `skills` | Tags shown in the details, each with an icon from `iconMap` in `src/data/timelineData.js`. |
| `parent` | The title of a card to show this one inside, as Find My Zoox sits in Creative Technologist. |
| `tile` | `info` to show an info tile even when the card has a photo (the awards do this). |
| `typewriterTitle`, `typewriterPrefix` | The role the greeting's typewriter cycles through ("I am a" + title). |

## Tiles or timeline

`src/data/sections.js` lists the sections in page order with their layout:
- **Timeline:** Career and Education, things that follow one another. These show as wide cards in date order.
- **Tiles:** everything else, a body of separate pieces.

A tile's style follows from its card:
- **Photo tile:** the card has a photo or a video.
- **Info tile:** it doesn't, or it sets `tile: info`. The logo and the organisation lead.

## Checks

The build (`scripts/cards.mjs`) checks every card and stops with the file's name when:
- a field is misspelt or unknown, or a required one is missing;
- a logo or image path isn't in `public/`;
- a `parent` doesn't name a card;
- two cards share a title;
- a folder isn't a section in `sections.js`.

While `npm run dev` is running, editing a card reloads the page.

Public counts (papers, reviews, press) must match the EB-1A petition. Check them after adding or removing cards.
