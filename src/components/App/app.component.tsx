import React, { useReducer } from "react";
import { hot } from "react-hot-loader/root";
import "./app.scss";
import Loading from "../Loading/loading.component";
import CreateTodo from "../CreateTodo/create-todo.component";
import {
  reducer,
  initState,
  effectFunctions,
  Props,
  StateMachine,
  DispatchType,
} from "./app.utils";
import { useRunEffects } from "../../utils/use-run-effects";
import { StateValue } from "../../utils/types";
import { fetchTodosFn } from "./app.injectables";
import ListTodos from "../ListTodos/list-todos.components";

export function App(props: Props) {
  const [stateMachine, dispatch] = useReducer(reducer, undefined, initState);

  const {
    states: { todos: todosState },
    effects: { general: generalEffects },
  } = stateMachine;

  useRunEffects(generalEffects, effectFunctions, props, { dispatch });

  return todosState.value === StateValue.fetching ? (
    <Loading />
  ) : (
    <AppChild state={stateMachine} dispatch={dispatch} />
  );
}

function AppChild(props: { state: StateMachine; dispatch: DispatchType }) {
  const {
    state: {
      states: { todos: todosState },
    },
    dispatch,
  } = props;

  return (
    <div className="app-component">
      <CreateTodo callerProp={true} appDispatch={dispatch} />

      <ListTodos todos={todosState} />
    </div>
  );
}

// istanbul ignore next:
function DefaultApp() {
  return <App fetchTodos={fetchTodosFn} />;
}

// istanbul ignore next:
export default process.env.NODE_ENV !== "production"
  ? hot(DefaultApp)
  : DefaultApp;
