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
} from "./utils";
import { buildSidebar } from "./sidebar";
import { setState } from "./state";

const wrapper = document.querySelector("#wrapper");
const documentTitle = document.querySelector("#documentTitle");
const editTitleButton = document.querySelector("#editTitleButton");
let editorIsSaved;

// Defining and configuring extensions
const extensions = [
  StarterKit.configure({
    codeBlock: false,
  }),
  TableKit,
  ListKit,
  Image.configure({
    allowBase64: true,
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
        editor
          .chain()
          .insertContentAt(pos, {
            type: "Image",
            attrs: {
              src: url,
            },
          })
          .run();
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

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject("Failed to load File.");
    reader.readAsDataURL(file);
  });
}

// Warns before unloading
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

// Applying File Data
export function loadDocument(data, entry, previousEntry) {
  document.title = entry.name.slice(0, -5);
  function continueLoading() {
    currentDocument = data;
    currentEntry = entry;
    currentPreviousEntry = previousEntry;
    editorView.classList.remove("hidden");
    editTitleButton.classList.remove("hidden");
    editTitleButton.removeEventListener("click", renameHandler);
    editTitleButton.style.display = "flex";

    documentTitle.textContent = data[0].title;

    editor.commands.setContent(
      data[0].content || "<p>Content failed to load.</p>",
    );

    editTitleButton.addEventListener("click", renameHandler);

    editorIsSaved = true;
  }

  if (editorIsSaved === false) {
    createConfirmModal(
      "Leaving this Document will discard Changes!",
      "Back",
      "Discard Changes & Continue",
      () => {
        continueLoading();
      },
    );
  } else {
    continueLoading();
  }
}

setHelpText(editTitleButton, "Rename Document");
async function renameHandler() {
  documentTitle.innerHTML = "";
  editTitleButton.style.display = "none";

  const div = document.createElement("div");

  const titleRenameInput = document.createElement("input");
  titleRenameInput.classList.add("renameInput");
  titleRenameInput.value = currentDocument[0].title;
  titleRenameInput.type = "text";
  titleRenameInput.maxLength = 30;

  const confirmButton = document.createElement("img");
  confirmButton.src = "../assets/function/checkmark.svg";
  confirmButton.classList.add("borderlessButton");

  confirmButton.addEventListener("click", async () => {
    const response = await fetch("api/documents/renameFile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newName: titleRenameInput.value,
        folderPath: currentPreviousEntry,
        name: currentEntry.name,
      }),
    });

    // Resetting after successful rename
    if (response.ok) {
      console.log("Current Entry: ", currentEntry);
      console.log("Current Document: ", currentDocument);
      console.log("Current previous Entry: ", currentPreviousEntry);
      currentDocument[0].title = titleRenameInput.value;
      currentEntry = {
        ...currentEntry,
        name: currentDocument[0].title + ".json",
      };
      documentTitle.textContent = currentDocument[0].title;
      buildSidebar();
      div.remove();
      editTitleButton.style.display = "flex";
      loadDocument(currentDocument, currentEntry, currentPreviousEntry);

      console.log("Current Entry: ", currentEntry);
      console.log("Current Document: ", currentDocument);
      console.log("Current previous Entry: ", currentPreviousEntry);
    } else if (response.status === 409) {
      createErrorModal(
        "A File with that name already exists within the same Directory!",
      );
    } else if (response.status === 404) {
      createErrorModal("File wasn't found.");
    } else {
      createErrorModal("Something went wrong.");
    }
  });

  const cancelButton = document.createElement("img");
  cancelButton.src = "../assets/function/cancel.svg";
  cancelButton.classList.add("borderlessButton");

  cancelButton.addEventListener("click", () => {
    div.remove();
    editTitleButton.style.display = "flex";
    documentTitle.textContent = currentDocument[0].title;
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
  e.stopPropagation();

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
    action: () => editor.chain().focus().toggleLink().run(),
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
  const exportDocument = editorLocation[0].outerHTML; // Selects the first result, which should always be the Editor if things are working properly.
  console.log(exportDocument);

  createConfirmModal(
    `Are you sure you want to Export the current Document?`,
    "Back to Editor",
    "Export as PDF",
    async () => {
      const response = await fetch("api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exportDocument: exportDocument,
          name: currentEntry.name.replace(".json", ""),
        }),
      });

      if (response.ok) {
        const blobResponse = await response.blob();
        let downloadElement = document.createElement("a");
        let downloadURL = await URL.createObjectURL(blobResponse);
        downloadElement.href = downloadURL;
        downloadElement.download = currentEntry.name.replace(".json", ".pdf");
        downloadElement.click();
        URL.revokeObjectURL(downloadURL);
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
  const saveData = editor.getJSON();

  const response = await fetch("api/documents/updateFile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      saveData: saveData,
      name: currentEntry.name,
      folderPath: currentPreviousEntry,
    }),
  });

  if (response.ok) {
    console.log("Successfully saved Document.");
    editorIsSaved = true;
  } else if (response.status === 404) {
    createErrorModal("Couldn't find File to save.");
  } else if (response.status === 413) {
    createErrorModal("Save File too large.");
  } else {
    createErrorModal("Something went wrong.");
  }
});

function closeEditor() {
  editorView.classList.add("hidden");
  console.log("Editor Closed.");
  editorIsSaved = true; // True because you're closing the editor so it's technically saved. Either way the logic relies on it.
}

// Discard Button's helptext is set within the autosave.
discardButton.addEventListener("click", (e) => {
  e.preventDefault();

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
let isDiscardIcon = true;

// Autosaving including swapping Discard Button for Close Button
setInterval(async () => {
  const saveData = editor.getJSON();

  if (editorIsSaved === false) {
    if (!isDiscardIcon) {
      discardIcon.src = discardIconPath;
      setHelpText(discardButton, "Discard Changes");
      isDiscardIcon = true;
    }
    //console.log(saveData);
    /*
    const autosave = await fetch("api/documents/autosave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        saveData: saveData,
        name: currentEntry.name,
        folderPath: currentPreviousEntry,
      }),
    });

    if (autosave.ok) {
      console.log("SUCCESS");
    }*/
  } else {
    if (isDiscardIcon) {
      discardIcon.src = closeIconPath;
      setHelpText(discardButton, "Close Document");
      isDiscardIcon = false;
    }
  }
}, 1000);

// Opens Document from URL if one is present.
async function onFirstStart() {
  const params = new URLSearchParams(window.location.search);
  const path = params.get("path");
  const document = params.get("document");

  // Stops auto-open if the URL is the base URL.
  if (document === null) {
    console.log("Editor ready!");
    return;
  } else {
    const response = await fetch(
      `api/documents/getFile?folderPath=${path}&name=${document}`,
      {
        method: "GET",
      },
    );

    if (response.ok) {
      // Mimics the data expected by the loadDocument function
      const adjustedName = {
        name: document,
        isFolder: false,
      };
      const fileData = await response.json();
      setState("currentDocument", path + document);
      loadDocument(fileData, adjustedName, path);
    } else if (response.status === 404) {
      createErrorModal("Couldn't find the File you were looking for.");
    } else {
      createErrorModal(`${response.status}; Something went wrong.`);
    }
  }
  console.log("Editor ready!");
}

onFirstStart();
