# Changelog

## v1.2.0-beta - Autosaves

### Added

- Deprecated Properties are automatically removed from `master.json`.

### Changed

- Made adjustments to Syntax Highlighting.

### Fixed

- Discard Icon now shows up correctly when the Document is unsaved.

## v1.1.0-beta - So many Bug Fixes & minor Improvements

### Added

- File renaming can be confirmed with `Enter`.
- Search Key stays in the Search field after searching.

### Changed

- Saving a Document instantly updates the Save Icons.

### Fixed

- Renaming a File to an identical name no longer sends a request to the Server, instead giving out an Error.
- Renaming a Document keeps its Highlight on the Sidebar.
- The Remove Link button now actually removes links instead of just toggling it.
- Font sizes for the Export are now consistent with the Editor. May still be different, it's obviously hard to tell.
- Fixed A4 size not being A4 because it wasn't defined in the `export-content` class.
- Task Lists are now vertically aligned with their counterparts.
- If the selected Document shows up in Search Results, it's now highlighted. Same thing when the search is closed. Apparently I fixed that at some point. Cool.
- The Search is now case-insensitive.
- Image Drag & Drop now works.

### Notes

- "Exported Documents show up inside the Assets???" nah my dumbass was just saving them to that location and didn't notice.

## v1.0.0-beta - Refactored User Data architecture

### Changed

- User Data architecture reworked. All user Data now lives inside of the `data` folder instead of being separated into different folders. Adjusted Operations across Files accordingly.

### Fixed

- Deleting an opened document now closes the Editor.
- Renaming a File now updates the URL.

### Notes

- As the version number implies, this is a data-changing update. Previous data will not be functional in the new release.

## v0.2.1-beta - `master.json`-related fixes

### Fixed

- `master.json` no longer shows up on the Sidebar.
- `master.json` is no longer included in the Search function, thus fixing it.

## v0.2.0-beta - URLs, Syntax Highlighting and Bug fixes

### Added

- Full URL support, you can now continue from where you left off.
- Fully functional Syntax Highlighting.
- Currently opened Document is highlighted on the Sidebar.
- Added new Icon for a saved editor.

### Fixed

- Editor no longer flashes for a split second after reloading the app.
- Fixed Toggle Lists not working.
- Renaming a Folder but not making any changes no longer sends a request to make an update.
- Bloated Image widths
- Images can be inserted into the Editor via Copy & Paste and are saved on the Server.
- Saving a saved Editor does nothing.

### Notes

- Images are technically supported, but I wouldn't use them just yet as there's no easy way to delete them from the server storage.

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
