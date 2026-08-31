# Changelog

## Unreleased

### Added

- There's now an option to save server logs to a `.log` file ([Issue #65](https://github.com/Yooli8537/Editor/issues/65)).
- Just like for images, there's an option to clear out all log files (except for the one that's currently in use).
- Documented some API Endpoints, not all because it kinda takes forever.
- Exports no longer have to be confirmed, can be changed in settings ([Issue #66](https://github.com/Yooli8537/Editor/issues/66)).
- The Settings page now has URLs ([Issue #61](https://github.com/Yooli8537/Editor/issues/61)).

### Removed

- Removed highlight from error modal because it's ugly.

### Fixed

- Server logs now show the correct time + show the current date ([Issue #51](https://github.com/Yooli8537/Editor/issues/51)).

## v1.5.2 - Minor improvements & Bug fixes

### Added

- New Settings to configure server logging.
- Server-side logging improved.
- JSON langauge support.
- C# language support.
- Modals of all kinds can be confirmed with the enter key.

### Removed

- Client-side logging.

### Fixed

- When clicking on a document with an unsaved document open, it no longer highlights the incorrect one if you click "back".
- Submenus are now closed when closing a document ([Issue 58](https://github.com/Yooli8537/Editor/issues/58)).
- Renaming an unsaved document now no longer triggers an unsaved file modal ([Issue 57](https://github.com/Yooli8537/Editor/issues/57)).

## v1.5.1 - Codeblock improvements

### Added

- Codeblock now has a list of specific languages which can be selected to skip the rather unreliable auto detection. Auto detection is still available for unsupported languages.
  - C++
  - CSS
  - Dockerfile
  - HTML
  - Java
  - JavaScript
  - Lua
  - Markdown
  - Plaintext
  - Python

### Removed

- Removed unsaved changes warning for settings.

### Fixed

- The buttons under Settings -> Info now work when pressing the edges as well, not just text.

## v1.5.0 - Bug Fixes & New Settings

### Added

- Long file & folder names are now shortened after 20 characters. This can be adjusted in the settings.
- The maximum length of names can now be adjusted in settings.
- The time it takes for a helptext to appear is now adjustable in settings.
- "Server" section under settings.

### Changed

- "Manage" Tab renamed to "Storage & Traffic" in settings.

### Fixed

- If an integer setting's value is 0 or below, it will not save to the master.
- Submenu helptexts will no longer appear in the top left corner if their parent was clicked before they appeared.
- Boolean settings are now preloaded & saved correctly.
- If you click on a document which is already open and unsaved, it won't produce any modals warning you to not leave and won't overwrite your changes.

## v1.4.1 - Table resizing & new Setting

### Added

- Settings
  - Update collapsed Folders: How long the delay between updates to the master property "collapsedFolders" is.
- Tables can now be resized

## v.1.4.0 - Folder Collapsing & Improvements

### Added

- Settings
  - Confirm Save: The modal prompting the user to confirm a save can now be turned off.
- Search is activated when pressing the enter key.
- Collapse & Expand Folders.

### Changed

- To remove a highlight, the user now simply has to click on the same color as the text is highlighted in, making it more intuitive.

### Fixed

- After freshly cloning a repository, the masterfile is now correctly configured after one server start, not requiring two.

## v1.3.1 - Full release

### Added

- Contribution tab under info in the settings.

### Fixed

- Missing `master.json` properties are no longer added when nothing was actually missing.

## v1.3.0-beta - Highlighting, Settings and Improvements

### Added

- Text Highlighting! It's pretty! I guess.
- Settings Menu - Explore a new tab full of configuration! Well, not yet, but in the future. Current settings:
  - Autosave Interval
  - Clear unused Images - Automatically clears all unused images from the server storage! It's pretty quick too.
- Many Settings sections are still under construction and will roll out over time. The reason I implemented the settings I did is because autosaveInterval was a good start to get all the code working, and the image clear was deeply necessary.

### Changed

- Images are now styled as inline.
- Cleaned up the code for all files to make sure it can all be easily read & understood (except for `sidebar.js`).
- Corrected license.
- Updated Tab Icons.

### Removed

- Removed Image Drag & Drop due to issues with duplicating images.

### Fixed

- Saving a file no longer sends unnecessary `DELETE` request to the server.
- Helptexts within submenus do now disappear when you click on the function.
- Images now render correctly when a Document is exported. This is the fix btw:
`documentImages[i].src = documentImages[i].src;`
- Image resize now works.
- When reloading the editor, the selected file is now highlighted again.
- When closing the editor, the Tab title adjusts.

## v1.2.0-beta - Autosaves

### Added

- Deprecated Properties are automatically removed from `master.json`.
- Autosaving. Every 10s, an autosave is created. If a document is left without saving, the user is prompted to restore it upon reopening.

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
