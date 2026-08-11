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

// Checks State Array for a certain value, then returns true / false
export function checkState(parameter, value) {
  const stateArray = getState(parameter); // Gets the Array Data
  const findIndex = stateArray.indexOf(value);
  // Searches for the Data to remove
  if (findIndex > -1) {
    return true;
  }
  return false;
}

// Adds to a State Array
export function addState(parameter, value) {
  state[parameter].push(value);
}

// Removes from a State Array
export function rmState(parameter, value) {
  const stateArray = getState(parameter); // Gets the Array Data
  const rmIndex = stateArray.indexOf(value);
  // Searches for the Data to remove
  if (rmIndex > -1) {
    stateArray.splice(rmIndex, 1);
  }
  // Updates Data
  setState(parameter, stateArray);
}
