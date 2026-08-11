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
  - Code Blocks with Syntax Highlighting
  - Bold
  - Italic
  - Underlined
  - Inline Code
  - Tables
  - Links
- Sidebar allowing for easy navigation of the Folder Structure
- Search Bar
- Undo / Redo
- Export Documents as .pdf files.
- Always continue where you left off with URLs for any page.
- Add Images and never delete them! *Seriously, they aren't deleted automatically right now, so they'll clog up storage*
- Avoid losing Data with Autosaves

## Installation

1. Clone the Repo using `git clone https://github.com/Yooli8537/Editor`.
2. Run `npm install`.
3. Run `npm run dev` and open [http://localhost:8511](http://localhost:8511).

## Update Guide

**This Guide only works if you keep your local clone of the Repo connected to the original repo.**
*I also don't know if it works at all since I'm the one updating things*

- Run `git pull`.

## Known Issues

- Using Firefox will slow down the App a lot, and I don't know why. [Brave](https://brave.com) is a very good alternative to use instead. I don't actively test different browsers, so this may get better over time. (08/26)

### Priority

- Image resize doesn't work.
- Renaming a Folder in which a file is currently open doesn't update the file's path, thus making saving and other operations impossible.
- Helptexts within submenus do not disappear when you click on the function, they just stick around.
- When switching between Documents with images inside them, the images are replaced with the images of the previously opened document, but only inside the browser, not the file itself.
- Sidebar Code is geuinely impossible to understand. 1000 previousentries but they're never defined and all have a different use. Help.

### To be fixed

- Links without https:// (or http://) redirect the user to a nonexistent URL within the application. https:// should be added automatically.
- Can't search with `Enter` :(
- When renaming Folders in different directories in a series, the chain eventually breaks and causes a (500) Error.
- Importing Tables from Excel (and likely other sources) makes tables bigger than mount Everest.
- Empty Links style as links and link to the root of the app.
- The delete confirmation Modal for a Notebook says its a folder, which is technically correct and is too technically inconvenient to change for me to care.
- Confirmation Modals can't be confirmed with the Enter Key.
- Pasting in Code from Word which was pasted in from VSC or Code copied directly from GitHub makes the line spacing very big.
- Sometimes, most of a Code Block will just be defined as a String by the Syntax highlighting. Likely due to the MD formatting (``````).
- Sometimes, Helptexts appear in the top left corner instead of the spot they should be in. May be another Submenu issue.
- TipTap's emoji Extension doesn't work.
- Files with the same name in different directories will overwrite each other when autosaving. Add support for this, maybe by creating the same folderstructure in the autosaves folder right when a new notebook / folder is created.
- When reloading a page, there's a chance that the `master.json` isn't loaded into the state correctly, thus creating an error.
- When renaming a file, it will likely not recognize its previous autosaves.

## Planned Features

### Priority

- Refactor Code for the single-function principle
- Full Image support
  - Unused Images should be deleted from the Server.
  - Allow different ways of putting Text around an Image instead of it just not allowing Text next to it.
- Collapsing / Expanding Folders
- Some kind of highlighting
- Extension: Audio

### Functional

- Backups of previous 5 versions of a document
- Moving folders & files using drag & drop.
- Settings Menu
  - Keybinds
  - Display
    - Dark / Light Mode
    - Amount of Characters before "..."
  - Saving Config
    - Autosaving Interval
    - Number of Backed-Up Versions
  - Edit Formats
  - Info (Lucide & TipTap credit, etc.)
- Containerization
- Language Selection List for Codeblocks
- Allow the user to save a Document when Discard Button is clicked.
- Advanced Images
  - Label Images
  - Hovering over an Image shows it's label.
  - Image labels can be searched through.
- Support long names by replacing them with "..." if they get >25 characters long. Cap at 50 instead of 30.

### Cosmetic

- Page separation
- A4 Toggle
- "No Results" message when searching and no results come up.
- Dark Mode
- A nicer 404 page
- Discard Button warning Color

## Notes

- Icons were downloaded from [Lucide](https://lucide.dev/).
- The Editor's functionality comes from [TipTap](https://tiptap.dev/) and its Extensions.
