// Importing Required functions
import {
  createConfirmModal,
  destroyModal,
  createPromptModal,
  createErrorModal,
} from "./utils";
import { checkForAutosave, closeEditor, loadAutosave } from "./editor";
import { getState, setState } from "./state";

const sidebar = document.querySelector("#sidebar");
const folderStructure = document.querySelector("#folderStructure");
const rootButton = document.querySelector("#rootButton");

let searchIsOpen = false;

// Creates the wrapper for sidebar elements.
function createWrapper() {
  const wrapper = document.createElement("div");
  wrapper.classList.add("wrapper");
  return wrapper;
}

// Searching
let key = "";
// Gets search results from the server and applies them to the sidebar.
async function doSearch(input) {
  key = input.value;
  if (!key) return;
  const search = await fetch(`api/documents/search?key=${key}`, {
    method: "GET",
  });

  if (search.ok) {
    const results = await search.json();
    searchIsOpen = true;

    folderStructure.innerHTML = "";
    folderStructure.appendChild(createSearch());

    // Replacing Sidebar with Results
    results.forEach((result) => {
      const wrapper = createWrapper();
      const file = createFile(
        { name: result.name, isFolder: false },
        result.folderPath + "/",
      );
      file.appendChild(createFileActions(result.name, result.folderPath + "/"));
      wrapper.appendChild(setIcon("../assets/function/file.svg"));
      wrapper.appendChild(file);
      folderStructure.appendChild(wrapper);
    });
  }
}

// Creating search field & operations
function createSearch() {
  const searchWrapper = document.createElement("div");
  searchWrapper.classList.add("wrapper");
  searchWrapper.style.gap = "10px";

  const input = document.createElement("input");
  input.classList.add("searchField");
  input.type = "text";

  // Sets the search key into the search bar after a search.
  if (searchIsOpen) {
    input.value = key;
  }

  const icon = document.createElement("img");
  icon.classList.add("sidebarButton");
  icon.src = "../assets/function/search.svg";

  // When the search icon is clicked, the search is activated.
  icon.addEventListener("click", () => {
    doSearch(input);
  });

  // Enter activates search.
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doSearch(input);
    }
  });

  if (searchIsOpen) {
    // Creating close button to close the search.
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

// Creating Folder to be rendered on the Sidebar
function createFolder(entry) {
  const folder = document.createElement("div");
  folder.classList.add("folder");
  folder.textContent = entry.name;
  return folder;
}

// Creating File to be rendered on the Sidebar
function createFile(entry, previousEntry) {
  const file = document.createElement("div");
  file.classList.add("file");
  file.textContent = entry.name.slice(0, -5);

  file.addEventListener("click", async (e) => {
    const response = await fetch(
      `api/documents/getFile?folderPath=${previousEntry}&name=${entry.name}`,
      {
        method: "GET",
      },
    );
    if (response.ok) {
      history.pushState(
        null,
        "",
        `?path=${previousEntry}&document=${entry.name}`,
      ); // Sets the Query Parameters into the URL
      const fileData = await response.json(); // Data from GET request
      loadAutosave(fileData, entry.name, previousEntry); // Checks for an Autosave, which then loads the document.
      setState("currentDocument", previousEntry + entry.name);
    } else if (response.status === 404) {
      createErrorModal("Couldn't find the File you were looking for.");
    } else {
      createErrorModal("Something went wrong.");
    }
    checkForSelectedFile(previousEntry + entry.name, file);
  });

  // Checks for the selected file on startup.
  checkForSelectedFile(previousEntry + entry.name, file);

  return file;
}

// Creating an icon for the sidebar
function setIcon(iconPath) {
  const icon = document.createElement("img");
  icon.classList.add("sidebarIcon");
  icon.src = iconPath;
  return icon;
}

// Action Buttons (Delete, Rename, Create)
// Path is saved for API call
function createFolderActions(path, previousEntry) {
  const buttons = document.createElement("div");
  buttons.classList.add("hoverField");

  const createButton = document.createElement("img");
  createButton.classList.add("hoverButton", "sidebarIcon");
  createButton.src = "../assets/function/plus.svg";

  // Dropdown to give choice between Folder & File.
  createButton.addEventListener("click", (e) => {
    e.stopPropagation();
    buttons.appendChild(createCreationDropdown(buttons, path, previousEntry));
  });

  document.addEventListener("click", () => {
    // Removes the creationDropdown when clicking anywhere.
    document
      .querySelectorAll(".creationDropdown")
      .forEach((creationDropdown) => creationDropdown.remove());
  });

  const renameButton = document.createElement("img");
  renameButton.classList.add("hoverButton", "sidebarIcon");
  renameButton.src = "../assets/function/edit.svg";
  renameButton.addEventListener("click", async (e) => {
    createPromptModal(
      "Please Input the new Folder Name.",
      path,
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
        } else if (response.status === 404) {
          createErrorModal("Couldn't find Folder to be renamed.");
        } else {
          createErrorModal("Something went wrong.");
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
      () => {},
      async () => {
        const response = await fetch("api/documents/deletePath", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folderPath: previousEntry + path,
          }),
        });

        if (response.ok) {
          console.log("Successfully deleted Folder.");
          buildSidebar();
        } else if (response.status === 404) {
          createErrorModal("Couldn't find Folder to delete.");
        } else {
          createErrorModal("Something went wrong.");
        }
      },
    );
  });

  buttons.appendChild(deleteButton);
  buttons.appendChild(renameButton);
  buttons.appendChild(createButton);
  return buttons;
}

// Creating Actions for Files
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
      () => {},
      async () => {
        const response = await fetch("api/documents/deletePath", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folderPath: previousEntry + path,
          }),
        });

        if (response.ok) {
          console.log("Successfully deleted File.");
          if (getState("currentDocument") === previousEntry + path) {
            setState("currentDocument", null);
            closeEditor();
          }
          buildSidebar();
        } else if (response.status === 404) {
          createErrorModal("Couldn't find File to be deleted.");
        } else {
          createErrorModal("Something went wrong.");
        }
      },
    );
  });

  buttons.appendChild(deleteButton);
  return buttons;
}

// Rendering items
function renderEntries(entries, indentlevel, previousEntry) {
  // Sorts entires alphabetically whilst prioritizing Folders
  entries.sort((a, b) => {
    const boolDiff = Number(b.isFolder) - Number(a.isFolder);

    if (boolDiff !== 0) {
      return boolDiff;
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  for (let i = 0; i < entries.length; i++) {
    if (entries[i].isFolder === true) {
      // Creating Folder view
      const wrapper = createWrapper();
      const folder = createFolder(entries[i]);
      folder.appendChild(createFolderActions(entries[i].name, previousEntry));

      if (indentlevel === 0) {
        wrapper.appendChild(setIcon("../assets/function/notebook.svg"));
      } else {
        wrapper.appendChild(setIcon("../assets/function/folder.svg"));
      }

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
      wrapper.appendChild(setIcon("../assets/function/file.svg"));
      wrapper.appendChild(file);
      wrapper.style.marginLeft = 5 + indentlevel * 10 + "px";
      folderStructure.appendChild(wrapper);
    }
  }
}

export async function buildSidebar() {
  // Getting data
  const response = await fetch("api/documents", {
    method: "GET",
  });
  const data = await response.json();

  // Clearing Sidebar
  folderStructure.innerHTML = "";
  folderStructure.appendChild(createSearch());

  renderEntries(data, 0, "");
  console.log("Sidebar ready!");
}

// Checks if the current file is selected and highlights it if true.
export function checkForSelectedFile(file, sidebarFile) {
  if (getState("currentDocument") === file) {
    console.log();
    const selectedDocs = document.querySelectorAll(".selected");
    for (let i = 0; i < selectedDocs.length; i++) {
      selectedDocs[i].classList.remove("selected");
    }
    sidebarFile.classList.add("selected");
  }
}

// creationDropdown to choose between File & Folder
function createCreationDropdown(parent, path, previousEntry) {
  const creationDropdown = document.createElement("div");
  creationDropdown.classList.add("creationDropdown");

  const fileButton = document.createElement("div");
  fileButton.classList.add("creationDropdownOption");
  fileButton.textContent = "Create File";

  fileButton.addEventListener("click", () => {
    createPromptModal("Please Name your File.", "", async (name) => {
      const response = await fetch("api/documents/newFile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          folderPath: previousEntry + path,
        }),
      });
      if (response.ok) {
        console.log("Successfully created File.");
        buildSidebar();
      } else if (response.status === 409) {
        createErrorModal(
          "A file with that name already exists in the current directory!",
        );
      } else {
        createErrorModal("Something went wrong.");
      }
    });
  });

  const folderButton = document.createElement("div");
  folderButton.classList.add("creationDropdownOption");
  folderButton.textContent = "Create Folder";

  folderButton.addEventListener("click", () => {
    createPromptModal("Please Name your Folder.", "", async (name) => {
      const response = await fetch("api/documents/newFolder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          folderPath: previousEntry + path,
        }),
      });
      if (response.ok) {
        buildSidebar();
        console.log("Folder added successfully.");
      } else if (response.status === 409) {
        createErrorModal(
          "A Folder with that name already exists in the current Directory!",
        );
      } else {
        createErrorModal("Something went wrong.");
      }
    });
  });

  creationDropdown.appendChild(fileButton);
  creationDropdown.appendChild(folderButton);

  const position = parent.getBoundingClientRect();
  creationDropdown.style.position = "absolute";
  creationDropdown.style.top = position.top + "px";
  creationDropdown.style.left = position.right + "px";

  return creationDropdown;
}

// Creating a new notebook
rootButton.addEventListener("click", async (e) => {
  e.preventDefault();

  createPromptModal("Please name your Notebook.", "", async (notebookName) => {
    const response = await fetch("api/documents/newNotebook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: notebookName }),
    });

    if (response.ok) {
      buildSidebar();
    } else if (response.status === 409) {
      createErrorModal("A Notebook with that name already exists!");
    } else {
      createErrorModal("Something went wrong.");
    }
  });
});
