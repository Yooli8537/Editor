import { createErrorModal } from "./utils";

let state = {
  currentDocument: null,
  unsavedDocuments: [],
};

// Gets the given state
export function getState(parameter) {
  return state[parameter];
}

// Overwrites a State with the passed value
export function setState(parameter, value) {
  state[parameter] = value;
}

// Adds to a State, reserved for Arrays
export function addState(parameter, value) {}
