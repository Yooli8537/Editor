export function createConfirmModal(prompt, cancel, confirm, onSubmit) {
  const clickable = document.createElement("div");
  clickable.classList.add("clickable");
  clickable.addEventListener("click", () => {
    destroyModal();
  });

  const modal = document.createElement("div");
  modal.classList.add("modal");

  const text = document.createElement("p");
  text.classList.add("modalText");
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

export function createPromptModal(prompt, onSubmit) {
  const clickable = document.createElement("div");
  clickable.classList.add("clickable");
  clickable.addEventListener("click", () => {
    destroyModal();
  });

  const modal = document.createElement("div");
  modal.classList.add("modal");

  const text = document.createElement("p");
  text.classList.add("modalText");
  text.textContent = prompt;

  const inputField = document.createElement("input");
  inputField.classList.add("inputField");

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
  submitButton.src = "../assets/function/checkmark.svg";

  submitButton.addEventListener("click", () => {
    onSubmit(inputField.value);
    destroyModal();
  });

  modalButtons.appendChild(cancelButton);
  modalButtons.appendChild(submitButton);
  modal.appendChild(text);
  modal.appendChild(inputField);
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