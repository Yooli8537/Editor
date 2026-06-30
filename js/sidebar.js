// Importing Required functions
import { createConfirmModal, destroyModal, createPromptModal } from "./utils";
import { loadDocument } from "./editor";

const sidebar = document.querySelector("#sidebar");
const folderStructure = document.querySelector("#folderStructure");
const rootButton = document.querySelector("#rootButton");
const editorView = document.querySelector("#editorView");

let searchIsOpen;

export async function buildSidebar() {
  // Getting data
  const response = await fetch("api/documents", {
    method: "GET",
  });
  const data = await response.json();

  // Creating Elements
  function createWrapper() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("wrapper");
    return wrapper;
  }

  function createSearch() {
    const searchWrapper = document.createElement("div");
    searchWrapper.classList.add("wrapper");
    searchWrapper.style.gap = "10px";

    const input = document.createElement("input");
    input.classList.add("searchField");

    const icon = document.createElement("img");
    icon.classList.add("sidebarButton");
    icon.src = "../assets/function/search.svg";

    icon.addEventListener("click", async () => {
      if (!input.value) return;
      const search = await fetch(`api/documents/search?key=${input.value}`, {
        method: "GET",
      });

      if (search.ok) {
        const results = await search.json();
        searchIsOpen = true;

        // Replacing Sidebar with Results
        folderStructure.innerHTML = "";
        folderStructure.appendChild(createSearch());

        results.forEach((result) => {
          const wrapper = createWrapper();
          const file = createFile(
            { name: result.name, isFolder: false },
            result.folderPath + "/",
          );
          file.appendChild(
            createFileActions(result.name, result.folderPath + "/"),
          );
          wrapper.appendChild(createIcon("../assets/function/file.svg"));
          wrapper.appendChild(file);
          folderStructure.appendChild(wrapper);
        });
      }
    });

    if (searchIsOpen) {
      const closeButton = document.createElement("img");
      closeButton.classList.add("sidebarButton");
      closeButton.src = "../assets/function/cancel.svg";

      closeButton.addEventListener("click", () => {
        searchIsOpen = false;
        buildSidebar();
      });

      searchWrapper.appendChild(icon);
      searchWrapper.appendChild(input);
      searchWrapper.appendChild(closeButton);
      return searchWrapper;
    } else {
      searchWrapper.appendChild(icon);
      searchWrapper.appendChild(input);
      return searchWrapper;
    }
  }

  function createFolder(entry) {
    const folder = document.createElement("div");
    folder.classList.add("folder");
    folder.textContent = entry.name;
    return folder;
  }

  function createFile(entry, previousEntry) {
    const file = document.createElement("div");
    file.classList.add("file");
    file.textContent = entry.name;

    file.addEventListener("click", async (e) => {
      const response = await fetch(
        `api/documents/getFile?folderPath=${previousEntry}&name=${entry.name}`,
        {
          method: "GET",
        },
      );
      if (response.ok) {
        const fileData = await response.json();
        loadDocument(fileData, entry, previousEntry);
      }
    });

    return file;
  }

  function createIcon(iconPath) {
    const icon = document.createElement("img");
    icon.classList.add("sidebarIcon");
    icon.src = iconPath;
    return icon;
  }

  // Action Buttons (Delete, Rename, Create)
  // Path is saved for API call
  function createActions(path, previousEntry) {
    const buttons = document.createElement("div");
    buttons.classList.add("hoverField");

    const createButton = document.createElement("img");
    createButton.classList.add("hoverButton", "sidebarIcon");
    createButton.src = "../assets/function/plus.svg";

    // Dropdown
    createButton.addEventListener("click", (e) => {
      e.stopPropagation();
      buttons.appendChild(createFileDropdown(buttons, path, previousEntry));
    });

    document.addEventListener("click", () => {
      removeDropdowns();
    });

    const renameButton = document.createElement("img");
    renameButton.classList.add("hoverButton", "sidebarIcon");
    renameButton.src = "../assets/function/edit.svg";

    renameButton.addEventListener("click", async (e) => {
      createPromptModal(
        "Please Input the new Folder Name.",
        async (newName) => {
          const response = await fetch("api/documents/renameFolder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              newName: newName,
              folderPath: previousEntry,
              name: path,
            }),
          });

          if (response.ok) {
            console.log("Successfully renamed Folder.");
            buildSidebar();
          }
        },
      );
    });

    const deleteButton = document.createElement("img");
    deleteButton.classList.add("hoverButton", "sidebarIcon");
    deleteButton.src = "../assets/function/trash.svg";

    deleteButton.addEventListener("click", (e) => {
      e.stopPropagation();
      createConfirmModal(
        "Are you sure you want to delete this Folder?",
        "Cancel",
        "Confirm",
        async () => {
          const response = await fetch("api/documents/deletePath", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: path,
              folderPath: previousEntry + path,
            }),
          });

          if (response.ok) {
            console.log("Successfully deleted Folder.");
            buildSidebar();
          }
        },
      );
    });

    buttons.appendChild(deleteButton);
    buttons.appendChild(renameButton);
    buttons.appendChild(createButton);
    return buttons;
  }

  function createFileActions(path, previousEntry) {
    const buttons = document.createElement("div");
    buttons.classList.add("hoverField");

    const deleteButton = document.createElement("img");
    deleteButton.classList.add("hoverButton", "sidebarIcon");
    deleteButton.src = "../assets/function/trash.svg";

    deleteButton.addEventListener("click", (e) => {
      e.stopPropagation();
      createConfirmModal(
        "Are you sure you want to delete this File?",
        "Cancel",
        "Confirm",
        async () => {
          const response = await fetch("api/documents/deletePath", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: path,
              folderPath: previousEntry + path,
            }),
          });

          if (response.ok) {
            console.log("Successfully deleted File.");
            buildSidebar();
          }
        },
      );
    });

    buttons.appendChild(deleteButton);
    return buttons;
  }

  // Clearing Sidebar
  folderStructure.innerHTML = "";
  folderStructure.appendChild(createSearch());

  // Rendering items
  function renderEntries(entries, indentlevel, previousEntry) {
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].isFolder === true) {
        // Creating Folder view
        const wrapper = createWrapper();
        const folder = createFolder(entries[i]);
        folder.appendChild(createActions(entries[i].name, previousEntry));
        wrapper.appendChild(createIcon("../assets/function/folder.svg"));
        wrapper.appendChild(folder);
        wrapper.style.marginLeft = 5 + indentlevel * 10 + "px";
        folderStructure.appendChild(wrapper);

        if (entries[i].children.length > 0) {
          renderEntries(
            entries[i].children,
            indentlevel + 1,
            previousEntry + entries[i].name + "/", // Building Path
          );
        }
      } else {
        // Creating File
        const wrapper = createWrapper();
        const file = createFile(entries[i], previousEntry);
        file.appendChild(createFileActions(entries[i].name, previousEntry));
        wrapper.appendChild(createIcon("../assets/function/file.svg"));
        wrapper.appendChild(file);
        wrapper.style.marginLeft = 5 + indentlevel * 10 + "px";
        folderStructure.appendChild(wrapper);
      }
    }
  }

  renderEntries(data, 0, "");
}

buildSidebar();

// Dropdown
function createFileDropdown(parent, path, previousEntry) {
  const dropdown = document.createElement("div");
  dropdown.classList.add("dropdown");

  const fileButton = document.createElement("div");
  fileButton.classList.add("dropdownOption");
  fileButton.textContent = "Create File";

  fileButton.addEventListener("click", () => {
    createPromptModal("Please Name your File.", async (name) => {
      const response = await fetch("api/documents/newFile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, folderPath: previousEntry + path }),
      });
      if (response.ok) {
        console.log("Successfully created File.");
        buildSidebar();
      }
    });
  });

  const folderButton = document.createElement("div");
  folderButton.classList.add("dropdownOption");
  folderButton.textContent = "Create Folder";

  folderButton.addEventListener("click", () => {
    createPromptModal("Please Name your Folder.", async (name) => {
      const response = await fetch("api/documents/newFolder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, folderPath: previousEntry + path }),
      });
      if (response.ok) {
        buildSidebar();
        console.log("Folder added successfully.");
      }
    });
  });

  dropdown.appendChild(fileButton);
  dropdown.appendChild(folderButton);

  const position = parent.getBoundingClientRect();
  dropdown.style.position = "absolute";
  dropdown.style.top = position.top + "px";
  dropdown.style.left = position.right + "px";

  return dropdown;
}

function removeDropdowns() {
  document
    .querySelectorAll(".dropdown")
    .forEach((dropdown) => dropdown.remove());
}

// Creating new Notebook
rootButton.addEventListener("click", async (e) => {
  e.preventDefault();

  createPromptModal("Please name your Notebook.", async (notebookName) => {
    const response = await fetch("api/documents/newNotebook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: notebookName }),
    });
    if (response.ok) {
      buildSidebar();
    } else if (response.status === 409) {
      alert("A Notebook with that name already exists!");
    }
  });
});
