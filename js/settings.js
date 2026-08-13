// Settings Menu
// Different tabs
const keybindsTab = document.querySelector("#keybindsTab");
const manageTab = document.querySelector("#manageTab");

let settingsChanged = false;

// Warns before reloading / closing a Tab
window.addEventListener("beforeunload", (e) => {
  if (settingsChanged == true) {
    e.preventDefault();
    e.returnValue = "";
    console.log("WARN");
  }
});

// Array of every tab
const allTabs = [
  { name: "keybinds", element: keybindsTab },
  { name: "manage", element: manageTab },
];

manageTab.addEventListener("click", (e) => {
  hideAllPages();
});

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

addTabListeners();
