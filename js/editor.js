// Importing TipTap Extensions
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import { ListKit } from "@tiptap/extension-list";
import Image from "@tiptap/extension-image";
import FileHandler from "@tiptap/extension-file-handler";
import Emoji from "@tiptap/extension-emoji";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, all } from "lowlight";
import Highlight from "@tiptap/extension-highlight";

// Setting up lowlight extension for Syntax Highlighting
const lowlight = createLowlight(all);
const lowlightLanguages = lowlight.listLanguages();
// Specifically supported languages:
/*
cpp,
css,
dockerfile,
java,
javascript,
lua,
markdown
plaintext
python,
*/
// Example Import so that I can check if a certain language is supported easily.
//import language from "highlight.js/lib/languages/language";

// Importing custom functions
import {
  createConfirmModal,
  destroyModal,
  createSubmenu,
  removeSubmenus,
  createErrorModal,
  setHelpText,
  createInfoModal,
  getMaster,
} from "./utils";
import { buildSidebar, createCollapsedFoldersUpdateInterval } from "./sidebar";
import { addState, checkState, getState, rmState, setState } from "./state";

// HTML Elements
const wrapper = document.querySelector("#wrapper");
const documentTitle = document.querySelector("#documentTitle");
const editTitleButton = document.querySelector("#editTitleButton");
let editorIsSaved;

// Defining and configuring extensions
const extensions = [
  StarterKit.configure({
    codeBlock: false, // Disabling codeBlock so that Syntax Highlighting works properly
  }),
  TableKit.configure({
    table: {
      resizable: true,
      renderWrapper: true,
      handleWidth: 5,
      cellMinWidth: 25,
    },
  }),
  ListKit,
  Image.configure({
    inline: true,
    resize: {
      enabled: true,
      directions: ["top", "bottom", "left", "right"], // can be any direction or diagonal combination
      minWidth: 50,
      minHeight: 50,
      alwaysPreserveAspectRatio: true,
    },
  }),
  FileHandler.configure({
    allowedMimeTypes: ["image/png", "image/jpg", "image/gif"],
    consumePasteEvent: true,
    onPaste: async (editor, files, htmlContent) => {
      for (const file of files) {
        const url = await uploadImage(file);
        editor.chain().setImage({ src: url }).run();
      }
    },
  }),
  Emoji,
  CodeBlockLowlight.configure({
    lowlight,
    enableTabIndentation: true,
    tabSize: 2,
  }),
  Highlight.configure({
    multicolor: true,
  }),
];

// Creating the TipTap Editor
const editor = new Editor({
  element: wrapper, // Parent Element
  extensions: extensions,
  content: "<p></p>",
  autofocus: true,
  injectCSS: true,
  onUpdate: () => {
    editorIsSaved = false;
  },
});

// Uploading Images to the Server.
async function uploadImage(file) {
  const response = await fetch("/api/uploadImageFile", {
    method: "POST",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  const { url } = await response.json();
  return url;
}

// Warns before reloading / closing a Tab
window.addEventListener("beforeunload", (e) => {
  if (editorIsSaved == false) {
    e.preventDefault();
    e.returnValue = "";
    console.log("WARN");
  }
});

let currentDocument;
let currentEntry;
let currentPreviousEntry;

// Checks for an autosave
export function checkForAutosave(document) {
  if (getState("unsavedFiles").indexOf(document) > -1) {
    return true;
  } else {
    return false;
  }
}

// Prompts the user to restore the autosave
export async function loadAutosave(fileData, document, path) {
  if (checkForAutosave(document)) {
    createConfirmModal(
      "It appears that you left this document without saving. Would you like to restore the autosave?",
      "Continue without restoring",
      "Restore autosave & continue to editor",
      () => {
        // Loads document with Data from the file if restoration is cancelled.
        loadDocument(fileData, document, path);
        removeAutosave();
      },
      async () => {
        // Gets the Autosave
        const autosave = await fetch(`api/getAutosave?name=${document}`, {
          method: "GET",
        });

        if (autosave.ok) {
          const autosaveData = await autosave.json();
          loadDocument(autosaveData, document, path); // Loads document with autosave data.
          // Unsaves the editor so that saveEditor() saves the autosave the actual file instead of saying that no changes were made.
          editorIsSaved = false;
          saveEditor(true); // Saves editor which also deletes autosaves.
        } else {
          createErrorModal(`Something went wrong. ${autosave.status}`);
        }
      },
    );
  } else {
    loadDocument(fileData, document, path);
  }
}

// Unhides editor and inserts a document's data.
function loadEditor(documentData, entry, previousEntry) {
  currentDocument = documentData;
  currentEntry = entry;
  currentPreviousEntry = previousEntry;

  editorView.classList.remove("hidden");
  editTitleButton.classList.remove("hidden");
  editTitleButton.style.display = "flex";

  // Sets the Title of the Page
  document.title = currentEntry.slice(0, -5);
  documentTitle.textContent = currentEntry.slice(0, -5);

  // Inserts the content of the document into the editor.
  editor.commands.setContent(
    documentData[0].content || "<p>Content failed to load.</p>",
  );

  // Rename Button Event listener
  editTitleButton.addEventListener("click", (e) => {
    e.stopPropagation();
    renameHandler();
  });

  editorIsSaved = true;
}

// Loads Document into the Editor
function loadDocument(documentData, entry, previousEntry) {
  // When loading another Document (by clicking it on the sidebar), the action must be confirmed.
  if (editorIsSaved === false) {
    createConfirmModal(
      "Leaving this Document will discard Changes!",
      "Back",
      "Discard Changes & Continue",
      () => {},
      () => {
        loadEditor(documentData, entry, previousEntry);
      },
    );
  } else {
    loadEditor(documentData, entry, previousEntry);
  }
}

// Handles the rename request
async function renameFile(newName, div) {
  const folderPath = currentPreviousEntry;
  const oldName = currentEntry;

  // Prevents Server Requests for identical Names. Slice removes .json
  if (newName === oldName.slice(0, -5)) {
    createErrorModal("Current and previous File names are identical.");
    return;
  }

  const response = await fetch("api/documents/renameFile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      newName: newName,
      folderPath: folderPath,
      name: oldName,
    }),
  });

  // Resetting after successful rename
  if (response.ok) {
    if (checkForAutosave(currentEntry)) {
      removeAutosave();
    }

    currentEntry = `${newName}.json`;
    currentDocument[0].title = newName;
    documentTitle.textContent = newName;
    div.remove();
    setState("currentDocument", folderPath + newName + ".json");
    buildSidebar();
    editTitleButton.style.display = "flex";
    loadDocument(currentDocument, currentEntry, folderPath);
    history.pushState(null, "", `?path=${folderPath}&document=${newName}.json`);
  } else if (response.status === 409) {
    createErrorModal(
      "A File with that name already exists within the same Directory!",
    );
  } else if (response.status === 404) {
    createErrorModal("File wasn't found.");
  } else {
    createErrorModal("Something went wrong.");
  }
}

setHelpText(editTitleButton, "Rename Document");
// Creates the buttons to cancel / confirm and hides the initial one.
async function renameHandler() {
  documentTitle.innerHTML = ""; // Removing this will stack rename fields after switching between tabs.
  editTitleButton.style.display = "none";

  const div = document.createElement("div");

  // Input Field
  const titleRenameInput = document.createElement("input");
  titleRenameInput.classList.add("renameInput");
  titleRenameInput.value = currentDocument[0].title;
  titleRenameInput.type = "text";
  titleRenameInput.maxLength = getState("maxCharacterLength");

  titleRenameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      renameFile(titleRenameInput.value, div);
    }
  });

  // Confirm Rename
  const confirmButton = document.createElement("img");
  confirmButton.src = "../assets/function/checkmark.svg";
  confirmButton.classList.add("borderlessButton");

  confirmButton.addEventListener("click", (e) => {
    e.stopPropagation();
    renameFile(titleRenameInput.value, div);
  });

  // Cancel Rename
  const cancelButton = document.createElement("img");
  cancelButton.src = "../assets/function/cancel.svg";
  cancelButton.classList.add("borderlessButton");

  cancelButton.addEventListener("click", () => {
    div.remove();
    editTitleButton.style.display = "flex";
    documentTitle.textContent = currentDocument[0].title; // Updates Document Title
  });

  div.appendChild(titleRenameInput);
  div.appendChild(confirmButton);
  div.appendChild(cancelButton);
  documentTitle.appendChild(div);

  titleRenameInput.focus();
}

// Toolbar Buttons
const undoButton = document.querySelector("#undo");
const redoButton = document.querySelector("#redo");
const headingsButton = document.querySelector("#headings");
const listsButton = document.querySelector("#lists");
const codeBlockButton = document.querySelector("#codeBlock");
const boldButton = document.querySelector("#bold");
const italicButton = document.querySelector("#italic");
const underlineButton = document.querySelector("#underline");
const highlightButton = document.querySelector("#highlight");
const inlineCodeButton = document.querySelector("#code");
const tableCreateButton = document.querySelector("#tableCreate");
const tableDeleteButton = document.querySelector("#tableDelete");
const linkButton = document.querySelector("#link");
const exportButton = document.querySelector("#export");
const saveButton = document.querySelector("#save");
const discardButton = document.querySelector("#discard");

// Setting different Button functions, including Helptexts
// Format Buttons
setHelpText(undoButton, "Undo");
undoButton.addEventListener("click", (e) => {
  e.preventDefault();
  editor.chain().focus().undo().run();
});

setHelpText(redoButton, "Redo");
redoButton.addEventListener("click", (e) => {
  e.preventDefault();
  editor.chain().focus().redo().run();
});

// Items for the Headings Submenu
const headingItems = [
  {
    icon: "format/heading-1.svg",
    action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    helpText: "Heading 1",
  },
  {
    icon: "format/heading-2.svg",
    action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    helpText: "Heading 2",
  },
  {
    icon: "format/heading-3.svg",
    action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    helpText: "Heading 3",
  },
];

setHelpText(headings, "Headings");
headingsButton.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation(); // Stops Submenu from disappearing instantly
  createSubmenu(headingsButton, headingItems, 1);
});

// Items for the Lists submenu
const listItems = [
  {
    icon: "format/list-unordered.svg",
    action: () => editor.chain().focus().toggleBulletList().run(),
    helpText: "Bullet List",
  },
  {
    icon: "format/list-ordered.svg",
    action: () => editor.chain().focus().toggleOrderedList().run(),
    helpText: "Ordered List",
  },
  {
    icon: "format/list-task.svg",
    action: () => editor.chain().focus().toggleTaskList().run(),
    helpText: "Task List",
  },
];

setHelpText(listsButton, "Lists");
listsButton.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  createSubmenu(listsButton, listItems, 1);
});

// Items for the Codeblock subemnu.
const codeItems = [
  {
    icon: "format/code-off.svg",
    action: () => editor.chain().focus().setParagraph().run(),
    helpText: "Unset Codeblock",
  },
  {
    icon: "function/cpu.svg",
    action: () => editor.chain().focus().setCodeBlock().run(),
    helpText: "Auto detect (supports unlisted languages)",
  },
  {
    icon: "code-languages/cpp.svg",
    action: () =>
      editor
        .chain()
        .focus()
        .setCodeBlock()
        .updateAttributes("codeBlock", {
          language: "cpp",
        })
        .run(),
    helpText: "C++",
  },
  {
    icon: "code-languages/css.svg",
    action: () =>
      editor
        .chain()
        .focus()
        .setCodeBlock()
        .updateAttributes("codeBlock", {
          language: "css",
        })
        .run(),
    helpText: "CSS",
  },
  {
    icon: "code-languages/docker.svg",
    action: () =>
      editor
        .chain()
        .focus()
        .setCodeBlock()
        .updateAttributes("codeBlock", {
          language: "dockerfile",
        })
        .run(),
    helpText: "Dockerfile",
  },
  {
    icon: "code-languages/java.svg",
    action: () =>
      editor
        .chain()
        .focus()
        .setCodeBlock()
        .updateAttributes("codeBlock", {
          language: "java",
        })
        .run(),
    helpText: "Java",
  },
  {
    icon: "code-languages/javascript.svg",
    action: () =>
      editor
        .chain()
        .focus()
        .setCodeBlock()
        .updateAttributes("codeBlock", {
          language: "javaScript",
        })
        .run(),
    helpText: "JavaScript",
  },
  {
    icon: "code-languages/lua.svg",
    action: () =>
      editor
        .chain()
        .focus()
        .setCodeBlock()
        .updateAttributes("codeBlock", {
          language: "lua",
        })
        .run(),
    helpText: "Lua",
  },
  {
    icon: "code-languages/markdown.svg",
    action: () =>
      editor
        .chain()
        .focus()
        .setCodeBlock()
        .updateAttributes("codeBlock", {
          language: "markdown",
        })
        .run(),
    helpText: "Markdown",
  },
  {
    icon: "code-languages/plaintext.svg",
    action: () =>
      editor
        .chain()
        .focus()
        .setCodeBlock()
        .updateAttributes("codeBlock", {
          language: "plaintext",
        })
        .run(),
    helpText: "Plaintext",
  },
  {
    icon: "code-languages/python.svg",
    action: () =>
      editor
        .chain()
        .focus()
        .setCodeBlock()
        .updateAttributes("codeBlock", {
          language: "python",
        })
        .run(),
    helpText: "Python",
  },
];

setHelpText(codeBlockButton, "Codeblock");
codeBlockButton.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  createSubmenu(codeBlockButton, codeItems, 2);
});

setHelpText(boldButton, "Bold");
boldButton.addEventListener("click", (e) => {
  e.preventDefault();
  editor.chain().focus().toggleBold().run();
});

setHelpText(italicButton, "Italic");
italicButton.addEventListener("click", (e) => {
  e.preventDefault();
  editor.chain().focus().toggleItalic().run();
});

setHelpText(underlineButton, "Underline");
underlineButton.addEventListener("click", (e) => {
  e.preventDefault();
  editor.chain().focus().toggleUnderline().run();
});

const highlightItems = [
  {
    icon: "color/yellow.svg",
    action: () =>
      editor.chain().focus().toggleHighlight({ color: "#ffff00" }).run(),
    helpText: "Yellow",
  },
  {
    icon: "color/orange.svg",
    action: () =>
      editor.chain().focus().toggleHighlight({ color: "#ff6600" }).run(),
    helpText: "Orange",
  },
  {
    icon: "color/red.svg",
    action: () =>
      editor.chain().focus().toggleHighlight({ color: "#ff0000" }).run(),
    helpText: "Red",
  },
  {
    icon: "color/pink.svg",
    action: () =>
      editor.chain().focus().toggleHighlight({ color: "#ff70f3" }).run(),
    helpText: "Pink",
  },
  {
    icon: "color/magenta.svg",
    action: () =>
      editor.chain().focus().toggleHighlight({ color: "#ff00ea" }).run(),
    helpText: "Magenta",
  },
  {
    icon: "color/purple.svg",
    action: () =>
      editor.chain().focus().toggleHighlight({ color: "#8000ff" }).run(),
    helpText: "Purple",
  },
  {
    icon: "color/blue.svg",
    action: () =>
      editor.chain().focus().toggleHighlight({ color: "#0000ff" }).run(),
    helpText: "Blue",
  },
  {
    icon: "color/light-blue.svg",
    action: () =>
      editor.chain().focus().toggleHighlight({ color: "#007bff" }).run(),
    helpText: "Light Blue",
  },
  {
    icon: "color/aqua.svg",
    action: () =>
      editor.chain().focus().toggleHighlight({ color: "#00ffd5" }).run(),
    helpText: "Aqua",
  },
  {
    icon: "color/lime.svg",
    action: () =>
      editor.chain().focus().toggleHighlight({ color: "#00ff4c" }).run(),
    helpText: "Lime",
  },
  {
    icon: "color/dark-green.svg",
    action: () =>
      editor.chain().focus().toggleHighlight({ color: "#026b00" }).run(),
    helpText: "Dark Green",
  },
  {
    icon: "color/brown.svg",
    action: () =>
      editor.chain().focus().toggleHighlight({ color: "#803900" }).run(),
    helpText: "Brown",
  },
];

setHelpText(highlightButton, "Highlight");
highlightButton.addEventListener("click", (e) => {
  e.stopPropagation();
  createSubmenu(highlightButton, highlightItems, 4);
});

setHelpText(inlineCodeButton, "Inline Code");
inlineCodeButton.addEventListener("click", (e) => {
  e.preventDefault();
  editor.chain().focus().toggleCode().run();
});

const tableCreateItems = [
  {
    icon: "format/table-create.svg",
    action: () =>
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
    helpText: "Create Table",
  },
  {
    icon: "format/column-before.svg",
    action: () => editor.chain().focus().addColumnBefore().run(),
    helpText: "Add column before current",
  },
  {
    icon: "format/column-after.svg",
    action: () => editor.chain().focus().addColumnAfter().run(),
    helpText: "Add column after current",
  },
  {
    icon: "format/row-before.svg",
    action: () => editor.chain().focus().addRowBefore().run(),
    helpText: "Add row before current",
  },
  {
    icon: "format/row-after.svg",
    action: () => editor.chain().focus().addRowAfter().run(),
    helpText: "Add row after current",
  },
];

setHelpText(tableCreateButton, "Table Actions");
tableCreateButton.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  createSubmenu(tableCreateButton, tableCreateItems, 2);
});

const tableDeleteItems = [
  {
    icon: "format/table-delete.svg",
    action: () => editor.chain().focus().deleteTable().run(),
    helpText: "Delete full table",
  },
  {
    icon: "format/columns.svg",
    action: () => editor.chain().focus().deleteColumn().run(),
    helpText: "Delete current column",
  },
  {
    icon: "format/rows.svg",
    action: () => editor.chain().focus().deleteRow().run(),
    helpText: "Delete current row",
  },
];

setHelpText(tableDeleteButton, "Table delete Actions");
tableDeleteButton.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  createSubmenu(tableDeleteButton, tableDeleteItems, 1);
});

const linkEditButtons = [
  {
    icon: "format/link.svg",
    action: () =>
      editor
        .chain()
        .focus()
        .toggleLink({
          href: prompt(
            'Please Input your Link below. Make sure it begins with "http://" or "https://", otherwise it will not work.',
          ),
        })
        .run(),
    helpText: "Add new Link",
  },
  {
    icon: "format/unlink.svg",
    action: () => editor.chain().focus().unsetLink().run(),
    helpText: "Delete Link",
  },
];

setHelpText(linkButton, "Links");
linkButton.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  createSubmenu(linkButton, linkEditButtons, 1);
});

// Functional Buttons
setHelpText(exportButton, "Export Document as PDF");
exportButton.addEventListener("click", async (e) => {
  e.preventDefault();
  // Location of the Editor within the Webapp
  const editorLocation = document.querySelectorAll(".ProseMirror");

  // Getting raw HTML to process images (change src).
  // Selects the first result, which should always be the Editor if things are working properly.
  const rawDocHTML = editorLocation[0].cloneNode(true);
  const documentImages = rawDocHTML.querySelectorAll("img");
  for (let i = 0; i < documentImages.length; i++) {
    documentImages[i].src = documentImages[i].src;
  }

  const exportDocument = rawDocHTML.outerHTML;

  createConfirmModal(
    "Are you sure you want to Export the current Document?",
    "Back to Editor",
    "Export as PDF",
    () => {},
    async () => {
      const response = await fetch("api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exportDocument: exportDocument,
          name: currentEntry.replace(".json", ""),
        }),
      });

      if (response.ok) {
        // Sends the response to the client, which then downloads it automatically.
        const blobResponse = await response.blob();
        let downloadURL = await URL.createObjectURL(blobResponse);

        let downloadElement = document.createElement("a");
        downloadElement.href = downloadURL;
        downloadElement.download = currentEntry.replace(".json", ".pdf");
        downloadElement.click();
        URL.revokeObjectURL(downloadURL); // Deletes download Element
        console.log("Succsessfully exported File.");
      } else {
        createErrorModal("Something went wrong.");
      }
    },
  );
});

setHelpText(saveButton, "Save Document");
saveButton.addEventListener("click", async (e) => {
  e.preventDefault();
  e.stopPropagation();
  saveEditor(false);
});

// Discard Button's helptext is set within the autosave.
discardButton.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (!editorIsSaved) {
    createConfirmModal(
      "Discard Changes? This cannot be undone.",
      "Cancel",
      "Discard Changes",
      () => {},
      () => {
        closeEditor();
        console.log("Changes Discarded.");
        setState("currentDocument", null);
        buildSidebar();
      },
    );
  } else {
    closeEditor();
    buildSidebar();
  }
});

async function pushSaveData() {
  const response = await fetch("api/documents/updateFile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      saveData: saveData,
      name: currentEntry,
      folderPath: currentPreviousEntry,
    }),
  });

  // Error handling
  if (response.ok) {
    console.log("Successfully saved Document.");
    editorIsSaved = true;
    if (checkForAutosave(currentEntry)) {
      removeAutosave();
    }
    updateSaveIcons();
  } else if (response.status === 404) {
    createErrorModal("Couldn't find File to save.");
  } else if (response.status === 413) {
    createErrorModal("Save File too large.");
  } else {
    createErrorModal("Something went wrong.");
  }
}

let saveData;
function saveEditor(isRestoration) {
  if (!editorIsSaved) {
    saveData = editor.getJSON();
    // Directly pushes changes if it's an autosave restoration, without creating a prompt.
    if (isRestoration) {
      pushSaveData();
    } else {
      if (getState("confirmSave")) {
        createConfirmModal(
          "Are you sure you want to save this File?",
          "Back to Editor",
          "Save File",
          () => {},
          pushSaveData,
        );
      } else {
        pushSaveData();
      }
    }
  } else {
    // No changes = no need to update
    createInfoModal("No changes were made.");
  }
}

const discardIcon = document.querySelector("#discardIcon");
const discardIconPath = "assets/function/discard.svg";
const closeIconPath = "assets/function/cancel.svg";
let isDiscardIcon = false;

const saveIcon = document.querySelector("#saveIcon");
const saveIconPath = "assets/function/save.svg";
const savedIconPath = "assets/function/saved.svg";
let isSavedIcon = true;

// Updates the Save & Discard Icons to be correct with the current state.
function updateSaveIcons() {
  if (editorIsSaved) {
    if (isDiscardIcon) {
      discardIcon.src = closeIconPath;
      setHelpText(discardButton, "Close Document");
      isDiscardIcon = false;
    }
    if (!isSavedIcon) {
      saveIcon.src = savedIconPath;
      setHelpText(saveButton, "Changes Saved");
      isSavedIcon = true;
    }
  } else {
    if (!isDiscardIcon) {
      discardIcon.src = discardIconPath;
      setHelpText(discardButton, "Discard Changes");
      isDiscardIcon = true;
    }
    if (isSavedIcon) {
      saveIcon.src = saveIconPath;
      setHelpText(saveButton, "Save Changes");
      isSavedIcon = false;
    }
  }
}

// Updates the save Icons every second
setInterval(() => {
  updateSaveIcons();
}, 1000);

let autosave = null;
// Initializes the autosave.
async function initAutosave(autosaveInterval) {
  autosave = setInterval(async () => {
    const saveData = editor.getJSON();

    if (editorIsSaved === false) {
      // Checks if the unsaved File is already included in the Array. If not, the File is added to the array.
      if (!checkState("unsavedFiles", currentEntry)) {
        addState("unsavedFiles", currentEntry);
      }
      const autosave = await fetch("api/autosave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saveData: saveData,
          folderPath: currentPreviousEntry, // currentPreviousEntry in the path up to the file,
          name: currentEntry, // currentEntry is the file's name.
        }),
      });

      if (autosave.ok) {
        console.log(
          `Successfully created Autosave for document ${currentEntry}.`,
        );
      }
    }
  }, autosaveInterval);
}

// Removes any autosaves from the server.
async function removeAutosave() {
  const response = await fetch("api/removeAutosave", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: currentEntry,
    }),
  });

  if (response.ok) {
    console.log(`Removed Autosave for ${currentEntry}.`);
    // Removes Document from unsaved Files Array so that you aren't prompted to restore every time you open the file until reload.
    rmState("unsavedFiles", currentEntry);
  }
}

// Closes the Editor
export function closeEditor() {
  editorView.classList.add("hidden");
  console.log("Editor Closed.");
  setState("currentDocument", null);
  history.pushState(null, "", "/");
  document.title = "Editor";
  editorIsSaved = true; // True because you're closing the editor so it's technically saved. Either way the logic relies on it.
}

// Opens Document from URL if one is present.
export async function onFirstStart() {
  // Loads Data from master.json and activates autosave upon success.
  if (await getMaster()) {
    initAutosave(getState("autosaveInterval") * 1000);
  }

  const params = new URLSearchParams(window.location.search);
  const path = params.get("path");
  const document = params.get("document");

  // Stops auto-open if no document is provided.
  if (document === null) {
    console.log("App ready!");
  } else {
    // Getting the Document from the URL.
    const response = await fetch(
      `api/documents/getFile?folderPath=${path}&name=${document}`,
      {
        method: "GET",
      },
    );

    if (response.ok) {
      const fileData = await response.json();
      setState("currentDocument", path + document);
      loadAutosave(fileData, document, path);
    } else if (response.status === 404) {
      createErrorModal("Couldn't find the File you were looking for.");
    } else {
      createErrorModal(`${response.status}; Something went wrong.`);
    }
  }
  console.log("Editor ready!");

  buildSidebar();
  createCollapsedFoldersUpdateInterval();
}

onFirstStart();
