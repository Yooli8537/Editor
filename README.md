# Editor

This is a Web-based Editor which can run locally or on a home server.

## Contents

- [Features](#features)
- [Installation](#installation)
- [Known Issues](#known-issues)
- [Planned Features](#planned-features)

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

## Known Issues

- Using Firefox will slow down the App a lot, and I don't know why. [Brave](https://brave.com/) is a very good alternative to use instead. I don't actively test different browsers, so this may get better over time. (08/26)

### To be fixed

- Only images added via a direct link are supported. Images should be able to be dropped into the Editor via Drag & Drop or Copy & Paste.
- Links without https:// (or http://) redirect the user to a nonexistent URL within the application. https:// should be added automatically.
- When deleting the opened file itself or a parent the editor doesn't close.
- Image resize doesn't work.
- Can't search with `Enter` :(
- When renaming Folders in different directories in a series, the chain eventually breaks and causes a (500) Error.
- Large Images shouldn't increase the horizontal Size of the A4 preview within the editor.
- Importing Tables from Excel (and likely other sources) makes tables bigger than mount Everest.
- Empty Links style as links and link to the root of the app.
- Renaming a File but not making any changes still sends a request to make an update.
- The delete confirmation Modal for a Notebook says its a folder, which is technically correct and is too technically inconvenient to change for me to care.
- Renaming a Folder in which a file is currently open doesn't update the file's path, thus making saving and other operations impossible.
- Confirmation Modals can't be confirmed with the Enter Key.
- Pasting in Code from Word which was pasted in from VSC makes the line spacing very big.

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
- "No Results" message when searching and no results come up.
- Colors: Add a spalsh of life to the editor.
- Dark Mode
- Containerization
