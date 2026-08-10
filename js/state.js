import { createErrorModal } from "./utils";

let state = {
  currentDocument: null,
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
export async function loadMaster() {
  const rawMasterFile = await fetch("api/getMaster", {
    method: "GET",
  });

  if (rawMasterFile.ok) {
    const masterData = await rawMasterFile.json();
    // Loops through all the properties in master.json and adds them into the state variable.
    for (const key in masterData) {
      setState(key, masterData[key]);
    }
  } else {
    createErrorModal(`Couldn't get Master File. Error ${rawMasterFile.status}`);
  }
}
