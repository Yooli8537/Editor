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

## Installation

1. Clone the Repo using `git clone https://github.com/Yooli8537/Editor`.
2. Run `npm install`.
3. Run `npm run dev` and open `http://localhost:8511/`.

## Known Issues

- Only images added via a direct link are supported. Images should be able to be dropped into the Editor via Drag & Drop or Copy & Paste.
- Links without https:// (or http://) redirect the user to a nonexistent URL within the application. https:// should be added automatically.
- When deleting the opened file itself or a parent the editor should close.
- Image resize doesn't work.
- When creating a new File / Folder, the Input Field isn't automatically focused.
- Can't search with `Enter` :(
- No Error Message when a Filename already exists after trying to create a new file.
- `.json` is at the end of every File.
- No Folder Priority over Files.
- When renaming Folders in different directories in a series, the chain eventually breaks and causes a (500) Error.
- Large Images shouldn't increase the horizontal Size of the A4 preview within the editor.
- Importing Tables from Excel (and likely other sources) makes tables bigger than mount Everest.
- Empty Notebook name gives out a (409 - Conflict) error, which is just weird.
- Too long Names give out a (500) at times and other times they go past the sidebar, not allowing themselves to be deleted until renamed because the button is in the Backrooms.
- Empty Name errors have no error handling.
- Empty Links style as links and link to the root of the app.
- Syntax Highlighting Extensions do not work.

## Planned Features

- Autosaving
- Full Image support
- Collapsing / Expanding Folders
- Hover shows short explanation of the Editor Function
- Moving folders & files using drag & drop.
- Enter Key should function as confirmation for basically anything.
- Page separation
- A4 Toggle
- Dedicated Notebook Icon
- Highlighting the current Document
- Backups of previous 5 versions of a document
- Settings Menu
- "No Results" message when searching and no results come up.
- Swap Discard button for Close Button if the Document is saved.
- Colors: Add a spalsh of life to the editor.
