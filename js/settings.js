// Settings Menu
// Imports
import { createErrorModal, createInfoModal } from "./utils";

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

// Sends updated settings to the masterfile.
async function updateMasterfile(updateData) {
  const masterUpdate = await fetch("../api/updateMaster", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: updateData,
    }),
  });

  if (masterUpdate.ok) {
    console.log("Successfully updated settings.");
    createInfoModal("Successfully updated settings.");
  } else {
    console.error("Failed to update settings.");
    createErrorModal(`Failed to update settings. ${masterUpdate.status}`);
  }
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
const allSettings = [autosaveInterval];

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

// Loads settings data before anything else is shown.
// Without this, values which weren't loaded are set to 0 / null.
function preLoadSettingsData() {
  // Applies values into the settings as preview values.
  for (let i = 0; i < allSettings.length; i++) {
    allSettings[i].value = master[allSettings[i].id];
  }
}

// Shows a given page.
function showPage(pageName) {
  document.querySelector(`#${pageName}`).classList.remove("hidden");
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
  // Sends the updated data to the server.
  updateMasterfile([master]);
});

// Buttons
const clearImagesButton = document.querySelector("#clearImagesButton");
clearImagesButton.addEventListener("click", async (e) => {
  const clear = await fetch("../api/cleanImages", {
    method: "DELETE",
  });
});

// Waits for the masterfile before adding the event listeners for the tabs.
if (await getMasterfile()) {
  console.log(master);
  preLoadSettingsData();
  addTabListeners();
}
