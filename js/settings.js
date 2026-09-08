// Settings Menu
import {
  checkForUpdate,
  createErrorModal,
  createInfoModal,
  handleServerErrors,
} from "./utils";

// Save button
const saveSettingsButton = document.querySelector("#saveSettingsButton");
// Different tabs
const generalTab = document.querySelector("#generalTab");
const displayTab = document.querySelector("#displayTab");
const formatsTab = document.querySelector("#formatsTab");
const keybindsTab = document.querySelector("#keybindsTab");
const storageTrafficTab = document.querySelector("#storageTrafficTab");
const serverTab = document.querySelector("#serverTab");
const developerTab = document.querySelector("#developerTab");
const infoTab = document.querySelector("#infoTab");

// Array of every tab
const allTabs = [
  { name: "general", element: generalTab },
  { name: "display", element: displayTab },
  { name: "formats", element: formatsTab },
  { name: "keybinds", element: keybindsTab },
  { name: "storageTraffic", element: storageTrafficTab },
  { name: "server", element: serverTab },
  { name: "developer", element: developerTab },
  { name: "info", element: infoTab },
];

// All the settings
const autosaveInterval = document.querySelector("#autosaveInterval");
const confirmSave = document.querySelector("#confirmSave");
const updateCollapsedFolders = document.querySelector(
  "#updateCollapsedFolders",
);
const sliceIndex = document.querySelector("#sliceIndex");
const maxCharacterLength = document.querySelector("#maxCharacterLength");
const helpTextHoverTime = document.querySelector("#helpTextHoverTime");
const warningLogs = document.querySelector("#warningLogs");
const successLogs = document.querySelector("#successLogs");
const detailLogs = document.querySelector("#detailLogs");
const saveLogs = document.querySelector("#saveLogs");
const confirmExport = document.querySelector("#confirmExport");
const logErrorDetails = document.querySelector("#logErrorDetails");
//const clientActionLogging = document.querySelector("#clientActionLogging");

// Array of every setting which can be set (so it excludes one-time actions like the image clear).
const allSettings = [
  autosaveInterval,
  confirmSave,
  updateCollapsedFolders,
  sliceIndex,
  maxCharacterLength,
  helpTextHoverTime,
  warningLogs,
  successLogs,
  detailLogs,
  saveLogs,
  confirmExport,
  logErrorDetails,
  // clientActionLogging,
];
// All the settings which only accept full numbers.
const intSettings = [updateCollapsedFolders, sliceIndex, maxCharacterLength];
// All the settings which accept any positive number.
const decimalSettings = [autosaveInterval, helpTextHoverTime];
// All the settings which are a string value.
const stringSettings = [];
// All the settings which are a boolean value.
const boolSettings = [
  confirmSave,
  warningLogs,
  successLogs,
  detailLogs,
  saveLogs,
  confirmExport,
  logErrorDetails,
  //clientActionLogging,
];

// Getting the master file
let master;
async function getMasterfile() {
  const rawMasterFile = await fetch("/api/getMaster", {
    method: "GET",
  });

  if (rawMasterFile.ok) {
    const masterData = await rawMasterFile.json();
    master = masterData;
    return true;
  } else {
    const rawMasterFileJSON = await rawMasterFile.json();
    handleServerErrors(rawMasterFileJSON, rawMasterFile.status);
    return false;
  }
}

// Sends updated settings to the masterfile.
async function updateMasterfile(updateData) {
  const masterUpdate = await fetch("/api/updateMaster", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: updateData,
    }),
  });

  if (masterUpdate.ok) {
    createInfoModal(
      "Successfully updated settings. Reload the Editor to apply.",
    );
  } else {
    const masterUpdateJSON = await masterUpdate.json();
    handleServerErrors(masterUpdateJSON, masterUpdate.status);
  }
}

// Loops through all to give them event listeners.
function addTabListeners() {
  for (let i = 0; i < allTabs.length; i++) {
    allTabs[i].element.addEventListener("click", (e) => {
      hideAllPages();
      showPage(allTabs[i].name);
      history.pushState(null, "", `?tab=${allTabs[i].name}`);
    });
  }
}

// Hides all the settings pages.
function hideAllPages() {
  for (let i = 0; i < allTabs.length; i++) {
    document.querySelector(`#${allTabs[i].name}`).classList.add("hidden");
    document
      .querySelector(`#${allTabs[i].name}Tab`)
      .classList.remove("tabHighlight");
  }
}

function doesIncludeSettingInSettingsArray(setting) {
  if (
    intSettings.includes(setting) ||
    decimalSettings.includes(setting) ||
    stringSettings.includes(setting)
  ) {
    return true;
  } else {
    return false;
  }
}

// Loads settings data before anything else is shown.
// Without this, values which weren't loaded are set to 0 / null.
function preLoadSettingsData() {
  // Applies values into the settings as preview values.
  for (let i = 0; i < allSettings.length; i++) {
    const setting = allSettings[i];
    if (doesIncludeSettingInSettingsArray(setting)) {
      setting.value = master[setting.id];
    } else {
      // Value of a boolean setting within the master.
      let settingMasterValue = master[setting.id];
      if (settingMasterValue === true) {
        setting.value = "True";
      } else {
        setting.value = "False";
      }
    }
  }
}

// Shows a given page.
function showPage(pageName) {
  document.querySelector(`#${pageName}`).classList.remove("hidden");
  document.querySelector(`#${pageName}Tab`).classList.add("tabHighlight");
}

// Saving the settings
saveSettingsButton.addEventListener("click", async (e) => {
  // Looping through all the number settings and saving them to the master variable.
  for (let i = 0; i < intSettings.length; i++) {
    // .value returns a string, so it has to be converted into a number first.
    // Rounds to next highest number to get rid of decimals.
    const intValue = Math.ceil(Number(intSettings[i].value));
    if (intValue <= 0) {
      createErrorModal(
        `${intSettings[i].id} has a value of 0 or below. Cancelling save.`,
      );
      return;
    } else {
      master[intSettings[i].id] = intValue;
    }
  }

  for (let i = 0; i < decimalSettings.length; i++) {
    // .value returns a string, so it has to be converted into a number first.
    const decValue = Number(decimalSettings[i].value);
    if (decValue <= 0) {
      createErrorModal(
        `${decimalSettings[i].id} has a value of 0 or below. Cancelling save.`,
      );
      return;
    } else {
      master[decimalSettings[i].id] = decValue;
    }
  }

  // Looping through all the string settings and saving them to the master variable.
  for (let j = 0; j < stringSettings.length; j++) {
    master[stringSettings[j].id] = stringSettings[j].value;
  }

  // Looping through all the boolean settings and saving them to the master variable.
  for (let k = 0; k < boolSettings.length; k++) {
    if (boolSettings[k].value == "True") {
      master[boolSettings[k].id] = true;
    } else {
      master[boolSettings[k].id] = false;
    }
  }
  // Sends the updated data to the server.
  updateMasterfile([master]);
});

// Buttons
const clearImagesButton = document.querySelector("#clearImagesButton");
clearImagesButton.addEventListener("click", async (e) => {
  const clear = await fetch("/api/cleanImages", {
    method: "DELETE",
  });

  const clearJSON = await clear.json();
  if (clear.ok) {
    if (clearJSON.amount <= 0) {
      createInfoModal("No unused images found.");
    } else if (clearJSON.amount === 1) {
      createInfoModal(
        "Successfully cleared an unused image from Server storage.",
      );
    } else {
      createInfoModal(
        `Successfully cleared ${clearJSON.amount} images from Server storage.`,
      );
    }
  } else {
    handleServerErrors(clearJSON, clear.status);
  }
});

const clearLogsButton = document.querySelector("#clearLogsButton");
clearLogsButton.addEventListener("click", async (e) => {
  const clear = await fetch("/api/clearLogs", {
    method: "DELETE",
  });

  const clearJSON = await clear.json();
  if (clear.ok) {
    if (clearJSON.amount <= 0) {
      createInfoModal("No logs found.");
    } else if (clearJSON.amount === 1) {
      createInfoModal("Successfully cleared a log file from Server storage.");
    } else {
      createInfoModal(
        `Successfully cleared ${clearJSON.amount} log files from Server storage.`,
      );
    }
  } else {
    handleServerErrors(clearJSON, clear.status);
  }
});

const versionCheckButton = document.querySelector("#versionCheckButton");
versionCheckButton.addEventListener("click", () => {
  checkForUpdate(true);
});

// Waits for the masterfile before adding the event listeners for the tabs.
if (await getMasterfile()) {
  preLoadSettingsData();
  addTabListeners();
}

// Checks for a tab query parameter and shows the corresponding tab if one is found.
function checkForTabQueryParameter() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  if (tab) {
    showPage(tab);
  }
}

checkForTabQueryParameter();
