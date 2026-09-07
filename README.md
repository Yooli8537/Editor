# Editor

This is a Web-based Editor which can run locally or on a home server. The project is powered by vanilla HTML, CSS and JS, an Express and Vite server, with Tiptap extensions powering the editor itself. It's easy to keep your documents organized with a sidebar including as many levels of folders as your heart desires and a search, so that you can always find what you're looking for.

## Contents

- [Features](#features)
- [Installation](#installation)
- [Known Issues](#known-issues)
- [Notes](#notes)

## Features

![Editor Preview](assets/editor_preview.png)

- Different Styles
  - Headings
  - Lists
  - Code Blocks with Syntax Highlighting
  - Bold
  - Italic
  - Underlined
  - Highlighting
  - Inline Code
  - Tables
  - Links
  - Images (copy-paste)
- Sidebar allowing for easy navigation of the Folder Structure
- Search Bar
- Undo / Redo
- Export Documents as .pdf files.
- Always continue where you left off with URLs for any page.
- Avoid losing Data with Autosaves.
- Configure the app to your liking with the Settings page (WIP).
- Collapse and Expand folders to keep the stuff you don't need out of sight and out of mind.

## Installation

1. Install [Node.js](https://nodejs.org/) and [git](https://git-scm.com/).
2. Clone the repository using `git clone https://github.com/Yooli8537/Editor` or download a recent release and unzip it.
3. Run `npm install` within the repository's directory.
4. Run `npm run dev` and open [http://localhost:8511](http://localhost:8511).

## Update Guide

Updates are detected automatically by the App. If the user denies an automatic update check, the App will no longer alert you until a new version is released. A manual update check can be done from the settings.

Updating will fail if the user has made changes to the source code, since it uses `git pull` to get the newest version. If there are any changes to package.json, these changes can be safely discarded.

If a `module not found` or similar error occurs, running `npm install` is required. After this, the app should run normally again.

## Known Issues

- Using Firefox will slow down the App a lot, and I don't know why. [Brave](https://brave.com) is a very good alternative to use instead. I don't actively test different browsers, so this may get better over time. (08/26)

## Notes

- Icons were downloaded from [Lucide](https://lucide.dev/).
- The Editor's functionality comes from [TipTap](https://tiptap.dev/) and its Extensions.
