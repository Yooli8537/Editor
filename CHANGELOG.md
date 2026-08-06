# Changelog

## v0.2.0-beta

### Added

- Full URL support, you can now continue from where you left off.
- Fully functional Syntax Highlighting.

### Changed

- Codeblock styling changed to Hackermode while we wait for Syntax Highlighting

### Fixed

- Editor no longer flashes for a split second after reloading the app.

## v0.1.2-beta - Editor help & fixed Exports

### Added

- Helptexts for Editor functions

### Fixed

- Table Action Icons are no longer mixed up.
- A Document Export with a period in its name will no longer have all the text after the period duplicated upon export and the .pdf file extension removed, instead exporting normally.
- Styling in Exports is no longer slightly different from within the app.

## v0.1.1-beta - Many Bug Fixes & small Improvements

### Added

- Dedicated Notebook Icon
- New Submenu for Links which makes removing them a lot easier.
- Folders are now prioritized in Sidebar rendering.
- Proper error handling across all file operations.
- Enter Key functions as confirmation for Input Modals.

### Fixed

- No Pointer Cursor for borderless Buttons.
- Discard Warning Modal no longer appears when closing a saved editor.
- Closing a saved Editor no longer logs out "Changes Discarded.".
- `.json` is no longer at the end of every file.
- Creating a File with the same name as a file which is already present no longer overwrites it.
- Too long Names gave out a (500) at times and other times they went past the sidebar, not allowing themselves to be deleted until renamed because the button was in the Backrooms.
- Renaming a Folder now carries over its current name into the renaming field.
- When a prompt modal is created, the Input Field is automatically focused.

## v0.1.0-beta - First Release

### Added

- New planned feature added to `README`.
- Pointer Cursor when hovering over a Link inside the Editor.

### Changed

- New Issues discovered and documented inside the `README`.
