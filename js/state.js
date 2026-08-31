// Basically RAM for the app.
let state = {
  currentDocument: null,
  editorIsSaved: true,
};

// Gets the given state's value.
export function getState(parameter) {
  return state[parameter];
}

// Overwrites a state with the passed value.
export function setState(parameter, value) {
  state[parameter] = value;
}

// Checks a state array for a certain value, then returns true / false.
export function checkState(parameter, value) {
  const stateArray = getState(parameter); // Gets the Array Data
  const findIndex = stateArray.indexOf(value);
  // Searches for the Data to remove
  if (findIndex > -1) {
    return true;
  }
  return false;
}

// Adds to a state array.
export function addState(parameter, value) {
  state[parameter].push(value);
}

// Removes from a state array
export function rmState(parameter, value) {
  console.log(value);
  const stateArray = getState(parameter); // Gets the Array Data
  const rmIndex = stateArray.indexOf(value);
  // Searches for the Data to remove
  if (rmIndex > -1) {
    stateArray.splice(rmIndex, 1);
  }
  // Updates Data
  setState(parameter, stateArray);
}

// Sends a certain state to be updated in the master.
export async function sendState(parameter) {
  const stateValue = getState(parameter);
  const masterUpdate = await fetch("/api/updateMasterProperty", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      property: parameter,
      newValue: stateValue,
    }),
  });

  if (masterUpdate.ok) {
    return true;
  } else {
    return false;
  }
}
