/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import { render, cleanup, wait } from "@testing-library/react";
import { App } from "../components/App/app.component";
import {
  Props,
  ServerResponse,
  initState,
  effectFunctions,
  StateMachine,
  EffectState,
  EffectArgs,
  reducer,
  TodosSuccess,
  ActionType,
} from "../components/App/app.utils";
import { fetchTodosFn } from "../components/App/app.injectables";
import { scrollIntoView } from "../utils/scroll-into-view";
import { StateValue } from "../utils/types";
import { CommonErrorsState } from "../utils/common-errors";
import { Todo } from "../components/CreateTodo/create-todo.utils";

const mockLoadingId = "a";
jest.mock("../components/Loading/loading.component", () => {
  return () => <div id={mockLoadingId} />;
});

const mockCreateTodoId = "b";
jest.mock("../components/CreateTodo/create-todo.component", () => {
  return () => <div id={mockCreateTodoId} />;
});

jest.mock("../components/ListTodos/list-todos.components", () => {
  return () => null;
});

jest.mock("../components/App/app.injectables");
const mockFetchTodosFn = fetchTodosFn as jest.Mock;

jest.mock("../utils/scroll-into-view");
const mockScrollIntoView = scrollIntoView as jest.Mock;

let mockState = (null as unknown) as StateMachine;
let mockDispatch = (null as unknown) as jest.Mock;

afterEach(() => {
  cleanup();
  jest.resetAllMocks();
  mockState = null as any;
});

describe("components", () => {
  it("fetch error", async () => {
    mockFetchTodosFn.mockRejectedValue(new Error("a"));

    const { ui } = makeComp();

    render(ui);
    expect(document.getElementById(mockLoadingId)).not.toBeNull();
    expect(document.getElementById(mockCreateTodoId)).toBeNull();
    expect(mockScrollIntoView).not.toHaveBeenCalled();

    await wait(() => true);

    expect(document.getElementById(mockLoadingId)).toBeNull();
    expect(document.getElementById(mockCreateTodoId)).not.toBeNull();
    expect(mockScrollIntoView).toHaveBeenCalled();
  });

  it("shows loading indicator when fetching/ empty fetch", async () => {
    mockFetchTodosFn.mockResolvedValue({
      data: [],
    } as ServerResponse);

    const { ui } = makeComp();

    render(ui);
    expect(document.getElementById(mockLoadingId)).not.toBeNull();
    expect(document.getElementById(mockCreateTodoId)).toBeNull();

    await wait(() => true);

    expect(document.getElementById(mockLoadingId)).toBeNull();
    expect(document.getElementById(mockCreateTodoId)).not.toBeNull();
  });
});

describe("reducer", () => {
  const props = {
    fetchTodos: mockFetchTodosFn,
  } as Props;

  let effectArgs = (null as unknown) as EffectArgs;

  beforeEach(() => {
    mockDispatch = jest.fn((action) => {
      if (!mockState) {
        mockState = initState();
      }

      mockState = reducer(mockState, action);
    });

    effectArgs = {
      dispatch: mockDispatch as any,
    };
  });

  it("fetch success", async () => {
    mockFetchTodosFn.mockResolvedValue({
      data: [
        {
          id: "1",
          text: "a",
        },
      ],
    } as ServerResponse);

    mockState = initState();

    const { key, ownArgs } = getEffects(mockState)[0];
    const func = effectFunctions[key];

    let todosState = mockState.states.todos;
    expect(todosState.value).toBe(StateValue.fetching);

    await func(ownArgs as any, props, effectArgs);

    const success = [
      {
        id: "1",
        text: "a",
      },
    ];

    expect(mockDispatch.mock.calls[0][0].todos).toEqual(success);

    todosState = mockState.states.todos;
    expect(todosState.value).toBe(StateValue.success);

    expect((todosState as TodosSuccess).success.context.todos).toEqual(
      success,
    );
  });

  it("fetch invalid data", async () => {
    mockFetchTodosFn.mockResolvedValue({} as ServerResponse);

    mockState = initState();

    const { key, ownArgs } = getEffects(mockState)[0];
    const func = effectFunctions[key];

    let todosState = mockState.states.todos;
    expect(todosState.value).toBe(StateValue.fetching);

    await func(ownArgs as any, props, effectArgs);

    expect(mockDispatch.mock.calls[0][0].type).toEqual(ActionType.COMMON_ERROR);

    todosState = mockState.states.todos;
    expect(todosState.value).toBe(StateValue.commonErrors);

    expect(
      (todosState as CommonErrorsState).commonErrors.context.errors,
    ).toBeDefined();
  });

  it("create todo success", async () => {
    mockState = initState();

    expect(mockState.states.todos.value).toBe(StateValue.fetching);

    const todo1 = {
      id: "a",
      text: "a",
    } as Todo;

    mockState = reducer(mockState, {
      type: ActionType.CREATE_TODO_SUCCESS,
      todo: todo1,
    });

    expect(mockState.states.todos.value).toBe(StateValue.success);

    expect(
      (mockState.states.todos as TodosSuccess).success.context.todos,
    ).toEqual([todo1]);

    const todo2 = {
      id: "b",
      text: "b",
    } as Todo;

    mockState = reducer(mockState, {
      type: ActionType.CREATE_TODO_SUCCESS,
      todo: todo2,
    });

    expect(
      (mockState.states.todos as TodosSuccess).success.context.todos,
    ).toEqual([todo2, todo1]);
  });
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const AppP = App as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  return {
    ui: <AppP {...props} fetchTodos={mockFetchTodosFn}></AppP>,
  };
}

function getEffects(state: StateMachine) {
  return (state.effects.general as EffectState).hasEffects.context.effects;
}
