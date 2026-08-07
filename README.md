# Editor

This is a Web-based Editor which can run locally or on a home server.

## Contents

- [Features](#features)
- [Installation](#installation)
- [Update Guide](#update-guide)
- [Known Issues](#known-issues)
- [Planned Features](#planned-features)
- [Notes](#notes)

## Features

- Different Styles
  - Headings
  - Lists
  - Code Blocks
  - Bold
  - Italic
  - Underlined
  - Inline Code
  - Tables
  - Links
- Sidebar allowing for easy navigation of the Folder Structure
- Search Bar
- Undo / Redo
- Exporting Documents as .pdf files.

## Installation

1. Clone the Repo using `git clone https://github.com/Yooli8537/Editor`.
2. Run `npm install`.
3. Run `npm run dev` and open `http://localhost:8511/`.

## Update Guide

**This Guide only works if you keep your local clone of the Repo connected to the original repo.**

- Run `git pull`

## Known Issues

- Using Firefox will slow down the App a lot, and I don't know why. [Brave](https://brave.com/) is a very good alternative to use instead. I don't actively test different browsers, so this may get better over time. (08/26)

### To be fixed

- Links without https:// (or http://) redirect the user to a nonexistent URL within the application. https:// should be added automatically.
- Image resize doesn't work.
- Can't search with `Enter` :(
- When renaming Folders in different directories in a series, the chain eventually breaks and causes a (500) Error.
- Importing Tables from Excel (and likely other sources) makes tables bigger than mount Everest.
- Empty Links style as links and link to the root of the app.
- The delete confirmation Modal for a Notebook says its a folder, which is technically correct and is too technically inconvenient to change for me to care.
- Renaming a Folder in which a file is currently open doesn't update the file's path, thus making saving and other operations impossible.
- Confirmation Modals can't be confirmed with the Enter Key.
- Pasting in Code from Word which was pasted in from VSC makes the line spacing very big.
- Sometimes, most of a Code Block will just be defined as a String by the Syntax highlighting. Likely due to the MD formatting (``````).
- Helptexts within submenus do not disappear when you click on the function, they just stick around.
- Sometimes, Helptexts appear in the top left corner instead of the spot they should be in. May be another Submenu issue.
- Image drag & drop doesn't work.
- If the selected Document shows up in Search Results, it isn't highlighted. Same thing when the search is closed.
- Font sizes are smaller and generally different for the Export.
- Exported Documents show up inside the Assets???

## Planned Features

- Autosaving
- Full Image support
- Collapsing / Expanding Folders
- Moving folders & files using drag & drop.
- Page separation
- A4 Toggle
- Highlighting the current Document
- Backups of previous 5 versions of a document
- Settings Menu
  - Keybinds
  - Display (Dark / Light Mode)
  - Edit Formats
  - "Cleanup Page" - Delete images from bin, etc.
  - Info (Lucide & TipTap credit, etc.)
- "No Results" message when searching and no results come up.
- Dark Mode
- Containerization
- Extension: Audio
- Some kind of highlighting for Text
- Keybinds (for example, Ctrl + S for saving)
- Language Selection List for Codeblocks
- Discard Button warning Color
- Allow the user to save a Document when Discard Button is clicked.
- Label Images
- Refactor Code for the single-function principle.
- Hovering over an Image shows it's label.
- Image labels can be searched through.

## Notes

- Icons were downloaded from [Lucide](https://lucide.dev/).
- The Editor's functionality comes from [TipTap](https://tiptap.dev/) and its Extensions.
