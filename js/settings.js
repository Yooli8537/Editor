// Settings Menu
// Imports
import { createErrorModal } from "./utils";

// Getting the master file
let master;
async function getMasterfile() {
  const rawMasterFile = await fetch("../api/getMaster", {
    method: "GET",
  });

  if (rawMasterFile.ok) {
    const masterData = await rawMasterFile.json();
    master = masterData;
    return true;
  } else {
    createErrorModal(`Couldn't get Master File. Error ${rawMasterFile.status}`);
    return false;
  }
}

// Save button
const saveSettingsButton = document.querySelector("#saveSettingsButton");
// Different tabs
const keybindsTab = document.querySelector("#keybindsTab");
const manageTab = document.querySelector("#manageTab");

// Array of every tab
const allTabs = [
  { name: "keybinds", element: keybindsTab },
  { name: "manage", element: manageTab },
];

// Loops through all to give them event listeners.
function addTabListeners() {
  for (let i = 0; i < allTabs.length; i++) {
    allTabs[i].element.addEventListener("click", (e) => {
      hideAllPages();
      showPage(allTabs[i].name);
    });
  }
}

// Hides all the settings pages.
function hideAllPages() {
  for (let i = 0; i < allTabs.length; i++) {
    document.querySelector(`#${allTabs[i].name}`).classList.add("hidden");
  }
}

// Shows a given page.
function showPage(pageName) {
  document.querySelector(`#${pageName}`).classList.remove("hidden");
}

// Waits for the masterfile before adding the event listeners for the tabs.
if (await getMasterfile()) {
  console.log(master);
  addTabListeners();
}
