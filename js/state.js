let state = {
  currentDocument: null,
};

export function getState(parameter) {
  return state.parameter;
}

export function setState(parameter, value) {
  state.parameter = value;
  console.log(state.parameter);
}
