// Importing TipTap Components
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import FileHandler from "@tiptap/extension-file-handler";
import Emoji from "@tiptap/extension-emoji";
import { ListKit } from "@tiptap/extension-list";

import { createConfirmModal, destroyModal } from "./utils";
import { buildSidebar } from "./sidebar";

const wrapper = document.querySelector("#wrapper");
const documentTitle = document.querySelector("#documentTitle");
const editTitleButton = document.querySelector("#editTitleButton");
let editorIsSaved;

// Creating new TipTap Editor
const editor = new Editor({
  element: wrapper,
  extensions: [StarterKit, TableKit, Image, FileHandler, Emoji, ListKit],
  content: "<p></p>",
  autofocus: true,
  injectCSS: true,
  onUpdate: () => {
    editorIsSaved = false;
  },
});

// Config
Image.configure({
  allowBase64: true,
  resize: {
    enabled: true,
    directions: ["top", "bottom", "left", "right"], // can be any direction or diagonal combination
    minWidth: 50,
    minHeight: 50,
    alwaysPreserveAspectRatio: true,
  },
});

FileHandler.configure({
  onPaste: async (editor, files, htmlContent) => {
    const base64 = await toBase64(files[0]);
    editor.commands.setImage({ src: base64 });
  },
  onDrop: async (editor, files, pos) => {
    const base64 = await toBase64(files[0]);
    editor.commands.setImage({ src: base64 });
  },
});

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject("Failed to load File.");
    reader.readAsDataURL(file);
  });
}

// Function to create Submenus
function createSubmenu(triggerButton, items) {
  const isOpen = triggerButton.classList.contains("activeButton");

  removeSubmenus();

  const selector = document.createElement("div");
  selector.classList.add("selectMenu");

  for (let i = 0; i < items.length; i++) {
    const button = document.createElement("button");
    button.classList.add("toolbarButton");
    const buttonIcon = document.createElement("img");
    buttonIcon.classList.add("toolbarIcon");
    buttonIcon.src = `assets/format/${items[i].icon}`;
    button.appendChild(buttonIcon);
    selector.appendChild(button);

    button.addEventListener("click", items[i].action);
  }

  if (!isOpen) {
    triggerButton.classList.add("activeButton");

    const position = triggerButton.getBoundingClientRect();
    selector.style.position = "absolute";
    selector.style.top = position.bottom + "px";
    selector.style.left = position.left - 6 + "px";

    document.body.appendChild(selector);

    document.addEventListener("click", () => {
      removeSubmenus();
    });
  } else {
    removeSubmenus();
  }
}

function removeSubmenus() {
  document.querySelectorAll(".selectMenu").forEach((menu) => menu.remove());
  document
    .querySelectorAll(".activeButton")
    .forEach((el) => el.classList.remove("activeButton"));
}

let currentDocument;
let currentEntry;
let currentPreviousEntry;

// Applying File Data
export function loadDocument(data, entry, previousEntry) {
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

async function renameHandler() {
  documentTitle.innerHTML = "";
  editTitleButton.style.display = "none";

  const div = document.createElement("div");

  const titleRenameInput = document.createElement("input");
  titleRenameInput.classList.add("renameInput");
  titleRenameInput.value = currentDocument[0].title;

  const confirmButton = document.createElement("img");
  confirmButton.src = "../assets/function/checkmark.svg";
  confirmButton.classList.add("renameButton");

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
    }
  });

  const cancelButton = document.createElement("img");
  cancelButton.src = "../assets/function/cancel.svg";
  cancelButton.classList.add("renameButton");

  cancelButton.addEventListener("click", () => {
    div.remove();
    editTitleButton.style.display = "flex";
    documentTitle.textContent = currentDocument[0].title;
  });

  div.appendChild(titleRenameInput);
  div.appendChild(confirmButton);
  div.appendChild(cancelButton);
  documentTitle.appendChild(div);
}

// Toolbar Buttons
document.querySelector("#undo").addEventListener("click", (e) => {
  e.preventDefault();
  editor.chain().focus().undo().run();
});

document.querySelector("#redo").addEventListener("click", (e) => {
  e.preventDefault();
  editor.chain().focus().redo().run();
});

// Submenu to choose between different Headings
const headings = document.querySelector("#headings");
const headingItems = [
  {
    icon: "heading-1.svg",
    action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    icon: "heading-2.svg",
    action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    icon: "heading-3.svg",
    action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
];

window.addEventListener("beforeunload", (e) => {
  if (editorIsSaved == false) {
    e.preventDefault();
    e.returnValue = "";
  }
});

headings.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  createSubmenu(headings, headingItems);
});

// Submenu to choose between different Lists
const lists = document.querySelector("#lists");
const listItems = [
  {
    icon: "list-unordered.svg",
    action: () => editor.chain().focus().toggleBulletList().run(),
  },
  {
    icon: "list-ordered.svg",
    action: () => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    icon: "list-task.svg",
    action: () => editor.chain().focus().toggleTaskList().run(),
  },
];

lists.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  createSubmenu(lists, listItems);
});

document.querySelector("#codeBlock").addEventListener("click", (e) => {
  e.preventDefault();
  editor.chain().focus().toggleCodeBlock().run();
});

document.querySelector("#bold").addEventListener("click", (e) => {
  e.preventDefault();
  editor.chain().focus().toggleBold().run();
});

document.querySelector("#italic").addEventListener("click", (e) => {
  e.preventDefault();
  editor.chain().focus().toggleItalic().run();
});

document.querySelector("#underline").addEventListener("click", (e) => {
  e.preventDefault();
  editor.chain().focus().toggleUnderline().run();
});

document.querySelector("#code").addEventListener("click", (e) => {
  e.preventDefault();
  editor.chain().focus().toggleCode().run();
});

const tableCreate = document.querySelector("#tableCreate");
const tableCreateItems = [
  {
    icon: "table-create.svg",
    action: () =>
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    icon: "column-before.svg",
    action: () => editor.chain().focus().addColumnBefore().run(),
  },
  {
    icon: "column-after.svg",
    action: () => editor.chain().focus().addColumnAfter().run(),
  },
  {
    icon: "row-before.svg",
    action: () => editor.chain().focus().addRowBefore().run(),
  },
  {
    icon: "row-after.svg",
    action: () => editor.chain().focus().addRowAfter().run(),
  },
];

tableCreate.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  createSubmenu(tableCreate, tableCreateItems);
});

const tableDelete = document.querySelector("#tableDelete");
const tableDeleteItems = [
  {
    icon: "table-delete.svg",
    action: () => editor.chain().focus().deleteTable().run(),
  },
  {
    icon: "columns.svg",
    action: () => editor.chain().focus().deleteColumn().run(),
  },
  {
    icon: "rows.svg",
    action: () => editor.chain().focus().deleteRow().run(),
  },
];

tableDelete.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  createSubmenu(tableDelete, tableDeleteItems);
});

document.querySelector("#link").addEventListener("click", (e) => {
  e.preventDefault();
  editor
    .chain()
    .focus()
    .toggleLink({ href: prompt("Please Input your Link below.") })
    .run();
});

// Functional Buttons
document.querySelector("#export").addEventListener("click", async (e) => {
  e.preventDefault();
  const exportDocument = editor.getJSON();

  createConfirmModal(
    "You must save your Document before Exporting.",
    "Back to Editor",
    "Save Document & Export",
    async () => {
      const saveDocument = await fetch("api/documents/updateFile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saveData: exportDocument,
          name: currentEntry.name,
          folderPath: currentPreviousEntry,
        }),
      });

      if (saveDocument.ok) {
        editorIsSaved = true;
        console.log("Successfully saved File.");
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
          downloadElement.download = currentEntry.name.replace(".json", "");
          downloadElement.click();
          URL.revokeObjectURL(downloadURL);
          console.log("Succsessfully exported File.");
        }
      }
    },
  );
});

document.querySelector("#save").addEventListener("click", async (e) => {
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
  }
});

document.querySelector("#discard").addEventListener("click", (e) => {
  e.preventDefault();

  createConfirmModal(
    "Discard Changes? This cannot be undone.",
    "Cancel",
    "Discard Changes",
    () => {
      editorView.classList.add("hidden");
      console.log("Changes Discarded.");
      editorIsSaved = true; // True cus you're closing the editor so it's technically saved. Either way the logic relies on it.
    },
  );
});

function onFirstStart() {
  editorView.classList.add("hidden");
}

// Autosaving
setInterval(async () => {
  const saveData = editor.getJSON();

  if (editorIsSaved === false) {
    console.log(saveData);
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
  }
}, 1000);

onFirstStart();
