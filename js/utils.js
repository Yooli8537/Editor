// Utilities

import { buildSidebar } from "./sidebar";
import { getState, setState } from "./state";

// Modals
export function createConfirmModal(
  prompt,
  cancel,
  confirm,
  onCancel,
  onSubmit,
) {
  const clickable = document.createElement("div");
  clickable.classList.add("clickable");
  clickable.addEventListener("click", () => {
    destroyModal();
  });

  const modal = document.createElement("div");
  modal.classList.add("modal");

  const text = document.createElement("p");
  text.textContent = prompt;

  const modalButtons = document.createElement("div");
  modalButtons.classList.add("modalButtons");

  const cancelButton = document.createElement("div");
  cancelButton.classList.add("modalTextButton");
  cancelButton.textContent = cancel;

  cancelButton.addEventListener("click", () => {
    onCancel();
    destroyModal();
  });

  const submitButton = document.createElement("div");
  submitButton.classList.add("modalTextButton");
  submitButton.textContent = confirm;

  submitButton.addEventListener("click", () => {
    onSubmit();
    destroyModal();
  });

  modalButtons.appendChild(cancelButton);
  modalButtons.appendChild(submitButton);
  modal.appendChild(text);
  modal.appendChild(modalButtons);
  document.body.appendChild(clickable);
  document.body.appendChild(modal);
}

function verifyInput(inputField, onSubmit, prevValue) {
  if (!inputField.value) {
    destroyModal();
    createErrorModal("The Input is empty. Try again.");
  } else if (inputField.value === prevValue) {
    destroyModal();
    createErrorModal("The Input and Output are the same. Try again.");
  } else {
    onSubmit(inputField.value);
    destroyModal();
  }
}

export function createPromptModal(prompt, inputContent, onSubmit) {
  const clickable = document.createElement("div");
  clickable.classList.add("clickable");
  clickable.addEventListener("click", () => {
    destroyModal();
  });

  const modal = document.createElement("div");
  modal.classList.add("modal");

  const text = document.createElement("p");
  text.textContent = prompt;

  const inputField = document.createElement("input");
  inputField.classList.add("inputField");
  inputField.type = "text";
  inputField.maxLength = 30;
  inputField.value = inputContent;

  inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      verifyInput(inputField, onSubmit, inputContent);
    }
  });

  const modalButtons = document.createElement("div");
  modalButtons.classList.add("modalButtons");

  const cancelButton = document.createElement("img");
  cancelButton.classList.add("modalButton");
  cancelButton.src = "../assets/function/cancel.svg";

  cancelButton.addEventListener("click", () => {
    destroyModal();
  });

  const submitButton = document.createElement("img");
  submitButton.classList.add("modalButton");
  submitButton.classList.add("highlight");
  submitButton.src = "../assets/function/checkmark.svg";

  submitButton.addEventListener("click", () => {
    verifyInput(inputField, onSubmit, inputContent);
  });

  modalButtons.appendChild(cancelButton);
  modalButtons.appendChild(submitButton);
  modal.appendChild(text);
  modal.appendChild(inputField);
  modal.appendChild(modalButtons);
  document.body.appendChild(clickable);
  document.body.appendChild(modal);

  inputField.focus();
}

export function createErrorModal(errorMsg) {
  const clickable = document.createElement("div");
  clickable.classList.add("clickable");
  clickable.addEventListener("click", () => {
    destroyModal();
  });

  const modal = document.createElement("div");
  modal.classList.add("errorMsg");
  modal.textContent = errorMsg;
  modal.classList.add("modal");

  const modalButtons = document.createElement("div");
  modalButtons.classList.add("modalButtons");

  const okButton = document.createElement("div");
  okButton.classList.add("modalTextButton");
  okButton.textContent = "Ok";

  okButton.addEventListener("click", () => {
    destroyModal();
  });

  modalButtons.appendChild(okButton);
  modal.appendChild(modalButtons);
  document.body.appendChild(clickable);
  document.body.appendChild(modal);
}

export function createInfoModal(msg) {
  const clickable = document.createElement("div");
  clickable.classList.add("clickable");
  clickable.addEventListener("click", () => {
    destroyModal();
  });

  const modal = document.createElement("div");
  modal.textContent = msg;
  modal.classList.add("modal");

  const modalButtons = document.createElement("div");
  modalButtons.classList.add("modalButtons");

  const okButton = document.createElement("div");
  okButton.classList.add("modalTextButton");
  okButton.textContent = "Ok";

  okButton.addEventListener("click", () => {
    destroyModal();
  });

  modalButtons.appendChild(okButton);
  modal.appendChild(modalButtons);
  document.body.appendChild(clickable);
  document.body.appendChild(modal);
}

export function destroyModal() {
  document.querySelectorAll(".modal").forEach((modal) => modal.remove());
  document
    .querySelectorAll(".clickable")
    .forEach((clickable) => clickable.remove());
}

// Submenus (mainly for Editor Toolbar)
export function createSubmenu(triggerButton, items) {
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

    // Setting Helptext for Submenu Items
    setHelpText(button, items[i].helpText);

    button.addEventListener("click", items[i].action);

    button.appendChild(buttonIcon);
    selector.appendChild(button);
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

export function removeSubmenus() {
  document.querySelectorAll(".selectMenu").forEach((menu) => menu.remove());
  document
    .querySelectorAll(".activeButton")
    .forEach((el) => el.classList.remove("activeButton"));
  removeHelpTexts();
}

// Removes all helptexts
function removeHelpTexts() {
  document
    .querySelectorAll(".helpText")
    .forEach((helpText) => helpText.remove());
}

// Function descriptions (when hovering)
// Creates the Help Text after 2s
export function setHelpText(hoverButton, helpText) {
  let time = 0;
  let hoverInterval = null;

  function createHelpText() {
    // Stops an empty helptext from generating
    if (helpText === undefined) {
      return;
    }

    time = 0;

    hoverInterval = setInterval(() => {
      if (time >= 1) {
        clearInterval(hoverInterval);
        hoverInterval = null;

        const boundingBox = document.createElement("div");
        boundingBox.classList.add("helpText");
        boundingBox.textContent = helpText;
        const position = hoverButton.getBoundingClientRect();
        boundingBox.style.position = "absolute";
        boundingBox.style.top = position.bottom + "px"; // position.top - (position.top - position.bottom) / 2 + "px"; alternative position which leads to bugs
        boundingBox.style.left = position.left + "px"; // position.left + (position.left - position.right) / 2 + "px";

        document.body.appendChild(boundingBox);
      } else {
        time++;
      }
    }, 1000);
  }

  hoverButton.addEventListener("mouseenter", createHelpText);

  hoverButton.addEventListener("mouseleave", (e) => {
    clearInterval(hoverInterval);
    hoverInterval = null;
    removeHelpTexts();
  });
}

// Loads data from master.json and returns it as useable JSON.
export async function getMaster() {
  const rawMasterFile = await fetch("api/getMaster", {
    method: "GET",
  });

  if (rawMasterFile.ok) {
    const masterData = await rawMasterFile.json();
    for (const key in masterData) {
      setState(key, masterData[key]);
    }
  } else {
    createErrorModal(`Couldn't get Master File. Error ${rawMasterFile.status}`);
  }
}
