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

// Setting up lowlight extension for Syntax Highlighting
const lowlight = createLowlight(all);
const lowlightLanguages = lowlight.listLanguages();

// Importing custom functions
import {
  createConfirmModal,
  destroyModal,
  createSubmenu,
  removeSubmenus,
  createErrorModal,
  setHelpText,
  createInfoModal,
} from "./utils";
import { buildSidebar } from "./sidebar";
import { getState, getMaster, setState } from "./state";

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
  TableKit,
  ListKit,
  Image.configure({
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
    onDrop: async (editor, files, pos) => {
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

// Loads Document into the Editor
export function loadDocument(documentData, entry, previousEntry) {
  function loadEditor() {
    currentDocument = documentData;
    currentEntry = entry;
    currentPreviousEntry = previousEntry;

    editorView.classList.remove("hidden");
    editTitleButton.classList.remove("hidden");
    editTitleButton.style.display = "flex";

    // Sets the Title of the Page
    document.title = currentEntry.slice(0, -5);
    documentTitle.textContent = currentEntry.slice(0, -5);

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

  // When loading another Document (by clicking it on the sidebar), the action must be confirmed.
  if (editorIsSaved === false) {
    createConfirmModal(
      "Leaving this Document will discard Changes!",
      "Back",
      "Discard Changes & Continue",
      () => {
        loadEditor();
      },
    );
  } else {
    loadEditor();
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
  titleRenameInput.maxLength = 30;

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
    icon: "heading-1.svg",
    action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    helpText: "Heading 1",
  },
  {
    icon: "heading-2.svg",
    action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    helpText: "Heading 2",
  },
  {
    icon: "heading-3.svg",
    action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    helpText: "Heading 3",
  },
];

setHelpText(headings, "Headings");
headingsButton.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation(); // Stops Submenu from disappearing instantly
  createSubmenu(headingsButton, headingItems);
});

// Items for the Lists Submenu
const listItems = [
  {
    icon: "list-unordered.svg",
    action: () => editor.chain().focus().toggleBulletList().run(),
    helpText: "Bullet List",
  },
  {
    icon: "list-ordered.svg",
    action: () => editor.chain().focus().toggleOrderedList().run(),
    helpText: "Ordered List",
  },
  {
    icon: "list-task.svg",
    action: () => editor.chain().focus().toggleTaskList().run(),
    helpText: "Task List",
  },
];

setHelpText(listsButton, "Lists");
listsButton.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  createSubmenu(listsButton, listItems);
});

setHelpText(codeBlockButton, "Code Block");
codeBlockButton.addEventListener("click", (e) => {
  e.preventDefault();
  editor.chain().focus().toggleCodeBlock().run();
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

setHelpText(inlineCodeButton, "Inline Code");
inlineCodeButton.addEventListener("click", (e) => {
  e.preventDefault();
  editor.chain().focus().toggleCode().run();
});

const tableCreateItems = [
  {
    icon: "table-create.svg",
    action: () =>
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
    helpText: "Create Table",
  },
  {
    icon: "column-before.svg",
    action: () => editor.chain().focus().addColumnBefore().run(),
    helpText: "Add column before current",
  },
  {
    icon: "column-after.svg",
    action: () => editor.chain().focus().addColumnAfter().run(),
    helpText: "Add column after current",
  },
  {
    icon: "row-before.svg",
    action: () => editor.chain().focus().addRowBefore().run(),
    helpText: "Add row before current",
  },
  {
    icon: "row-after.svg",
    action: () => editor.chain().focus().addRowAfter().run(),
    helpText: "Add row after current",
  },
];

setHelpText(tableCreateButton, "Table Actions");
tableCreateButton.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  createSubmenu(tableCreateButton, tableCreateItems);
});

const tableDeleteItems = [
  {
    icon: "table-delete.svg",
    action: () => editor.chain().focus().deleteTable().run(),
    helpText: "Delete full table",
  },
  {
    icon: "columns.svg",
    action: () => editor.chain().focus().deleteColumn().run(),
    helpText: "Delete current column",
  },
  {
    icon: "rows.svg",
    action: () => editor.chain().focus().deleteRow().run(),
    helpText: "Delete current row",
  },
];

setHelpText(tableDeleteButton, "Table delete Actions");
tableDeleteButton.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  createSubmenu(tableDeleteButton, tableDeleteItems);
});

const linkEditButtons = [
  {
    icon: "link.svg",
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
    icon: "unlink.svg",
    action: () => editor.chain().focus().unsetLink().run(),
    helpText: "Delete Link",
  },
];

setHelpText(linkButton, "Links");
linkButton.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  createSubmenu(linkButton, linkEditButtons);
});

// Functional Buttons
setHelpText(exportButton, "Export Document as PDF");
exportButton.addEventListener("click", async (e) => {
  e.preventDefault();
  // Location of the Editor within the Webapp
  const editorLocation = document.querySelectorAll(".ProseMirror");
  // Selects the first result, which should always be the Editor if things are working properly. The HTML is used to Export the Document.
  const exportDocument = editorLocation[0].outerHTML;

  createConfirmModal(
    "Are you sure you want to Export the current Document?",
    "Back to Editor",
    "Export as PDF",
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
  }
}

async function saveEditor() {
  if (!editorIsSaved) {
    const saveData = editor.getJSON();
    createConfirmModal(
      "Are you sure you want to save this File?",
      "Back to Editor",
      "Save File",
      async () => {
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
          removeAutosave();
          editorIsSaved = true;
          updateSaveIcons();
        } else if (response.status === 404) {
          createErrorModal("Couldn't find File to save.");
        } else if (response.status === 413) {
          createErrorModal("Save File too large.");
        } else {
          createErrorModal("Something went wrong.");
        }
      },
    );
  } else {
    // No changes = no need to update
    createInfoModal("No changes were made.");
  }
}

setHelpText(saveButton, "Save Document");
saveButton.addEventListener("click", async (e) => {
  e.preventDefault();
  e.stopPropagation();
  saveEditor();
});

// Closes the Editor
export function closeEditor() {
  editorView.classList.add("hidden");
  console.log("Editor Closed.");
  editorIsSaved = true; // True because you're closing the editor so it's technically saved. Either way the logic relies on it.
}

// Discard Button's helptext is set within the autosave.
discardButton.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (!editorIsSaved) {
    createConfirmModal(
      "Discard Changes? This cannot be undone.",
      "Cancel",
      "Discard Changes",
      () => {
        closeEditor();
        console.log("Changes Discarded.");
        setState("currentDocument", null);
        buildSidebar();
        history.pushState(null, "", "/");
      },
    );
  } else {
    closeEditor();
    setState("currentDocument", null);
    buildSidebar();
    history.pushState(null, "", "/");
  }
});

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

// Requests a new autosave every 10s.
setInterval(async () => {
  const saveData = editor.getJSON();

  if (editorIsSaved === false) {
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
}, 10000);

// Opens Document from URL if one is present.
async function onFirstStart() {
  // Loads Data from master.json into state.js
  const masterData = await getMaster();
  console.log(masterData.unsavedFiles);

  const params = new URLSearchParams(window.location.search);
  const path = params.get("path");
  const document = params.get("document");

  // Stops auto-open if no document is provided.
  if (document === null) {
    console.log("App ready!");
    return;
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
      loadDocument(fileData, document, path);

      if (masterData.unsavedFiles.indexOf(document) > -1) {
        createConfirmModal(
          "It appears that you left this document without saving. Would you like to restore the autosave?",
          "Continue without restoring",
          "Restore autosave & continue to editor",
          async () => {
            restoredAutosave = true;
            console.log("hmmm");
          },
        );
      }
    } else if (response.status === 404) {
      createErrorModal("Couldn't find the File you were looking for.");
    } else {
      createErrorModal(`${response.status}; Something went wrong.`);
    }
  }
  console.log("Editor ready!");
}

onFirstStart();
