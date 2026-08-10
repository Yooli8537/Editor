let state = {
  currentDocument: null,
  unsavedFiles: [],
};

// Gets the given state
export function getState(parameter) {
  return state.parameter;
}

// Overwrites a State with the passed value
export function setState(parameter, value) {
  state.parameter = value;
}

// Adds to a State, reserved for Arrays
export function addState(parameter, value) {
  state.parameter;
}

// Loads data from master.json into the state.
export async function loadMaster() {
  const rawMasterFile = await fetch("api/getMaster", {
    method: "GET",
  });

  if (rawMasterFile.ok) {
    const masterData = await rawMasterFile.json();
    console.log(masterData);
  }
}
