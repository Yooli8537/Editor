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

// Loads data from master.json into the state.
export async function getMaster() {
  const rawMasterFile = await fetch("api/getMaster", {
    method: "GET",
  });

  if (rawMasterFile.ok) {
    return await rawMasterFile.json();
  } else {
    createErrorModal(`Couldn't get Master File. Error ${rawMasterFile.status}`);
  }
}
