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

## Installation

1. Install [Node.js](https://nodejs.org/) and [git](https://git-scm.com/).
2. Clone the repository using `git clone https://github.com/Yooli8537/Editor` or download a recent release and unzip it.
3. Run `npm install` within the repository's directory.
4. Run `npm run dev` and open [http://localhost:8511](http://localhost:8511).

## Known Issues

- Using Firefox will slow down the App a lot, and I don't know why. [Brave](https://brave.com) is a very good alternative to use instead. I don't actively test different browsers, so this may get better over time. (08/26)

## Notes

- Icons were downloaded from [Lucide](https://lucide.dev/).
- The Editor's functionality comes from [TipTap](https://tiptap.dev/) and its Extensions.
