// Utilities

import { buildSidebar } from "./sidebar";

// Modals
export function createConfirmModal(prompt, cancel, confirm, onSubmit) {
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

function verifyInput(inputField, onSubmit) {
  if (!inputField.value) {
    destroyModal();
    createErrorModal("The Input is empty. Try again.");
  } else {
    onSubmit(inputField.value);
    destroyModal();
  }
}

export function createPromptModal(prompt, onSubmit, inputContent) {
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
      verifyInput(inputField, onSubmit);
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
    verifyInput(inputField, onSubmit);
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
  modal.classList.add("modal");

  const text = document.createElement("p");
  text.classList.add("errorMsg");
  text.textContent = errorMsg;

  const modalButtons = document.createElement("div");
  modalButtons.classList.add("modalButtons");

  const okButton = document.createElement("div");
  okButton.classList.add("modalTextButton");
  okButton.textContent = "Ok";

  okButton.addEventListener("click", () => {
    destroyModal();
  });

  modalButtons.appendChild(okButton);
  modal.appendChild(text);
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

export function removeSubmenus() {
  document.querySelectorAll(".selectMenu").forEach((menu) => menu.remove());
  document
    .querySelectorAll(".activeButton")
    .forEach((el) => el.classList.remove("activeButton"));
}

// Function descriptions (when hovering)
// Creates the Help Text after 3s
export function setHelpText(hoverButton, helpText) {
  let time = 0;
  let hoverInterval = null;

  function createHelpText() {
    time = 0;

    hoverInterval = setInterval(() => {
      if (time >= 2) {
        clearInterval(hoverInterval);
        hoverInterval = null;

        const boundingBox = document.createElement("div");
        boundingBox.classList.add("helpText");

        const text = document.createElement("p");
        text.textContent = helpText;

        const position = hoverButton.getBoundingClientRect();
        boundingBox.style.position = "absolute";
        boundingBox.style.top = (position.top - position.bottom) / 2 + "px";
        boundingBox.style.left = (position.left - position.right) / 2 + "px";

        boundingBox.appendChild(text);
        document.body.appendChild(boundingBox);
      } else {
        time++;
        console.log(time);
      }
    }, 1000);
  }

  hoverButton.addEventListener("mouseenter", createHelpText);

  hoverButton.addEventListener("mouseleave", (e) => {
    clearInterval(hoverInterval);
    hoverInterval = null;
  });
}
