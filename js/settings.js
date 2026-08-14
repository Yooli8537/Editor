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

async function updateMasterfile(updateData) {
  const masterUpdate = await fetch("../api/updateMaster")
}

/*
// Warns before reloading / closing the settings.
window.addEventListener("beforeunload", (e) => {
  e.preventDefault();
  e.returnValue = "";
  console.log("WARN");
});
*/
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

// Array of every page that shows up when you click a tab.
const autosaveInterval = document.querySelector("#autosaveInterval");
const allPages = {
  manage: [autosaveInterval],
};

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
  // Gets all the settings from the current page.
  const currentPageSettings = allPages[pageName];
  // Applies values into the settings as preview values.
  for (let i = 0; i < currentPageSettings.length; i++) {
    currentPageSettings[i].value = master[currentPageSettings[i].id];
  }
}

// Saving the settings
// All the settings which are a number value.
const numberSettings = [autosaveInterval];
// All the settings which are a string value.
const stringSettings = [];

saveSettingsButton.addEventListener("click", async (e) => {
  // Looping through all the number settings and saving them to the master variable.
  for (let i = 0; i < numberSettings.length; i++) {
    // .value returns a string, so it has to be converted into a number first.
    master[numberSettings[i].id] = Number(numberSettings[i].value);
  }

  // Looping through all the string settings and saving them to the master variable.
  for (let j = 0; j < stringSettings.length; j++) {
    master[stringSettings[i].id] = stringSettings[i].value;
  }
  console.log(master);
});

// Waits for the masterfile before adding the event listeners for the tabs.
if (await getMasterfile()) {
  console.log(master);
  addTabListeners();
}
