// Utilities
import { getState, setState, sendState } from "./state";

// Modals
// Deletes the modal and creates no further actions.
export function destroyModal() {
  document.querySelectorAll(".modal").forEach((modal) => modal.remove());
  document
    .querySelectorAll(".clickable")
    .forEach((clickable) => clickable.remove());
}

// "Background" of the modal. Clicking it destroys the modal.
function createClickable() {
  const clickable = document.createElement("div");
  clickable.classList.add("clickable");
  clickable.addEventListener("click", () => {
    destroyModal();
  });
  return clickable;
}

// Creates the modal body.
function createModalBody() {
  const modal = document.createElement("div");
  modal.classList.add("modal");
  return modal;
}

// Creates the div element for the buttons to live in.
function createModalButtonsDiv() {
  const modalButtons = document.createElement("div");
  modalButtons.classList.add("modalButtons");
  return modalButtons;
}

// Creating a Modal for the user to confirm an action.
export function createConfirmModal(
  prompt,
  cancel,
  confirm,
  onCancel,
  onSubmit,
) {
  const clickable = createClickable();
  const modal = createModalBody();
  const modalButtons = createModalButtonsDiv();
  // Abortcontroller allows a modal to only be destroyed if the pressed key was enter.
  const controller = new AbortController();

  const text = document.createElement("p");
  text.textContent = prompt;

  const cancelButton = document.createElement("div");
  cancelButton.classList.add("modalTextButton");
  cancelButton.textContent = cancel;

  cancelButton.addEventListener("click", () => {
    onCancel();
    destroyModal();
  });

  const submitButton = document.createElement("div");
  submitButton.classList.add("modalTextButton");
  submitButton.classList.add("highlight");
  submitButton.textContent = confirm;

  submitButton.addEventListener("click", () => {
    onSubmit();
    destroyModal();
  });

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit();
        destroyModal();
        controller.abort();
      }
    },
    { signal: controller.signal },
  );

  modalButtons.appendChild(cancelButton);
  modalButtons.appendChild(submitButton);
  modal.appendChild(text);
  modal.appendChild(modalButtons);
  document.body.appendChild(clickable);
  document.body.appendChild(modal);
}

// Verifies user input for prompt modals.
function verifyInput(inputField, onSubmit, prevValue) {
  if (!inputField.value) {
    destroyModal();
    createErrorModal("The input is empty. Try again.");
  } else if (inputField.value === prevValue) {
    destroyModal();
    createErrorModal("The input and output are the same. Try again.");
  } else {
    onSubmit(inputField.value);
    destroyModal();
  }
}

// Creates a prompt for the user to fill out.
export function createPromptModal(prompt, inputContent, onSubmit) {
  const clickable = createClickable();
  const modal = createModalBody();
  const modalButtons = createModalButtonsDiv();

  const text = document.createElement("p");
  text.textContent = prompt;

  const inputField = document.createElement("input");
  inputField.classList.add("inputField");
  inputField.type = "text";
  inputField.maxLength = getState("maxCharacterLength");
  inputField.value = inputContent; // Adds the previous value to the input field.

  // Confirm with enter key
  inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      verifyInput(inputField, onSubmit, inputContent);
    }
  });

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

// Creates a modal when an error happens.
export function createErrorModal(errorMsg) {
  const clickable = createClickable();
  const modal = createModalBody();
  const modalButtons = createModalButtonsDiv();
  // Abortcontroller allows a modal to only be destroyed if the pressed key was enter.
  const controller = new AbortController();

  // Adds error message directly to modal.
  modal.classList.add("errorMsg");
  modal.textContent = errorMsg;

  // Confirm button
  const okButton = document.createElement("div");
  okButton.classList.add("modalTextButton");
  okButton.textContent = "Ok";

  okButton.addEventListener("click", () => {
    destroyModal();
  });

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        destroyModal();
        controller.abort();
      }
    },
    { signal: controller.signal },
  );

  modalButtons.appendChild(okButton);
  modal.appendChild(modalButtons);
  document.body.appendChild(clickable);
  document.body.appendChild(modal);
}

// Creates a modal to give the user a bit of information.
export function createInfoModal(msg) {
  const clickable = createClickable();
  const modal = createModalBody();
  const modalButtons = createModalButtonsDiv();
  // Abortcontroller allows a modal to only be destroyed if the pressed key was enter.
  const controller = new AbortController();

  // Adds message directly to modal.
  modal.textContent = msg;

  // Confirm button
  const okButton = document.createElement("div");
  okButton.classList.add("modalTextButton");
  okButton.classList.add("highlight");
  okButton.textContent = "Ok";

  okButton.addEventListener("click", () => {
    destroyModal();
  });

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        destroyModal();
        controller.abort();
      }
    },
    { signal: controller.signal },
  );

  modalButtons.appendChild(okButton);
  modal.appendChild(modalButtons);
  document.body.appendChild(clickable);
  document.body.appendChild(modal);
}

// Submenus (mainly for Editor Toolbar).
export function createSubmenu(triggerButton, items, width) {
  const isOpen = triggerButton.classList.contains("activeButton");
  // Destroys all other submenus when a new one is opened.
  removeSubmenus();

  const selector = document.createElement("div");
  selector.classList.add("submenu");
  // Sets the width. 2 = padding, 35 = toolbarButton width, 4 = toolbarButton margin
  selector.style.width = 2 + width * 35 + width * 4 + "px";

  // Loops through array to create all the buttons within the submenu.
  for (let i = 0; i < items.length; i++) {
    const button = document.createElement("button");
    button.classList.add("toolbarButton");
    const buttonIcon = document.createElement("img");
    buttonIcon.classList.add("toolbarIcon");
    buttonIcon.src = `assets/${items[i].icon}`;

    // Setting Helptext for Submenu Items
    setHelpText(button, items[i].helpText);

    button.addEventListener("click", items[i].action);

    button.appendChild(buttonIcon);
    selector.appendChild(button);
  }

  // Adds the submenu to the document.
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

// Deletes all submenus
export function removeSubmenus() {
  document.querySelectorAll(".submenu").forEach((menu) => menu.remove());
  document
    .querySelectorAll(".activeButton")
    .forEach((el) => el.classList.remove("activeButton"));
  removeHelpTexts();
}

// Function descriptions (when hovering)
// Creates the Help Text after 2s
export function setHelpText(hoverButton, helpText) {
  let time = 0;
  let hoverInterval = null;

  function createHelpText() {
    // Stops an empty helptext from generating
    if (helpText == undefined) {
      return;
    }

    time = 0;

    hoverInterval = setInterval(() => {
      if (time >= getState("helpTextHoverTime") * 10) {
        clearInterval(hoverInterval);
        hoverInterval = null;

        // Creates the box around the helptext
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
    }, 100);
  }

  hoverButton.addEventListener("mouseenter", createHelpText);

  hoverButton.addEventListener("click", (e) => {
    clearInterval(hoverInterval);
    hoverInterval = null;
    removeHelpTexts();
  });

  hoverButton.addEventListener("mouseleave", (e) => {
    clearInterval(hoverInterval);
    hoverInterval = null;
    removeHelpTexts();
  });
}

// Removes all helptexts
function removeHelpTexts() {
  document
    .querySelectorAll(".helpText")
    .forEach((helpText) => helpText.remove());
}

// Loads data from master.json and returns it as useable JSON.
export async function getMaster() {
  const rawMasterFile = await fetch("/api/getMaster", {
    method: "GET",
  });

  if (rawMasterFile.ok) {
    const masterData = await rawMasterFile.json();
    // Adds all the masterfile data into state.js
    for (const key in masterData) {
      setState(key, masterData[key]);
    }
    return true;
  } else {
    createErrorModal(`Couldn't get Master File. Error ${rawMasterFile.status}`);
    return false;
  }
}

// Checks for an update.
export async function checkForUpdate(manualCheck) {
  // Waits for the master.json to be loaded.
  if (await getMaster()) {
    if (!getState("deniedUpdate") || manualCheck) {
      const latest = await fetch(
        "https://api.github.com/repos/Yooli8537/Editor/releases/latest",
        { method: "GET" },
      );

      const release = await latest.json();

      if (release.tag_name !== getState("version")) {
        createConfirmModal(
          "An update is available. Would you like to install it?",
          "Don't install",
          "Install Update",
          () => {
            createInfoModal(
              "You can update the app at any time in the settings menu.",
            );
            setState("deniedVersion", release.tag_name);
            sendState("deniedVersion");
          },
          async () => {
            const response = await fetch("/api/applyAppUpdate", {
              method: "GET",
            });

            if (response.ok) {
              createInfoModal("Restart the app to apply update.");
              setState("deniedVersion", null);
              setState("version", release.tag_name);
              sendState("deniedVersion");
              sendState("version");
            }
          },
        );
      } else {
        if (manualCheck) {
          createInfoModal("You're on the newest release of Editor.");
        }
      }
    }
  }
}

// Handles errors from server responses.
export function handleServerErrors(responseJSON) {
  const clickable = createClickable();
  const modal = createModalBody();
  const modalButtons = createModalButtonsDiv();
  // Abortcontroller allows a modal to only be destroyed if the pressed key was enter.
  const controller = new AbortController();

  // Adds error message directly to modal.
  modal.classList.add("errorMsg");

  let titleParagraph = document.createElement("p");
  titleParagraph.textContent = `${responseJSON.operation}: ${responseJSON.errorMsg}`;

  const requestValues = responseJSON.requestValues;
  let hasValues = false;
  let valuesDiv;
  if (!isObjectEmpty(requestValues)) {
    hasValues = true;
    valuesDiv = document.createElement("div");
    console.log(requestValues);

    for (const key in requestValues) {
      const valueParagraph = document.createElement("p");
      valueParagraph.textContent = `${key}: ${requestValues[key]}`;
      valuesDiv.appendChild(valueParagraph);
    }
  }

  // Confirm button
  const okButton = document.createElement("div");
  okButton.classList.add("modalTextButton");
  okButton.textContent = "Ok";

  okButton.addEventListener("click", () => {
    destroyModal();
  });

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        destroyModal();
        controller.abort();
      }
    },
    { signal: controller.signal },
  );

  modal.appendChild(titleParagraph);
  if (hasValues) {
    modal.appendChild(valuesDiv);
  }
  modalButtons.appendChild(okButton);
  modal.appendChild(modalButtons);
  document.body.appendChild(clickable);
  document.body.appendChild(modal);
}

export function isObjectEmpty(object) {
  for (const prop in object) {
    if (Object.hasOwn(object, prop)) {
      return false;
    }
  }
  return true;
}
