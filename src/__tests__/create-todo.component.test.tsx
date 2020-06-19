/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import { render, cleanup, waitForElement, wait } from "@testing-library/react";
import { CreateTodo } from "../components/CreateTodo/create-todo.component";
import {
  textInputId,
  textErrorId,
  submitId,
  notificationId,
  textFieldId,
} from "../components/CreateTodo/create-todo.dom";
import {
  Props, //
  initState,
  reducer,
  ActionType,
  StateMachine,
  EffectState,
  effectFunctions,
  EffectArgs,
  Action,
  ServerResponse,
  FormInput,
} from "../components/CreateTodo/create-todo.utils";
import { CommonErrorsState } from "../utils/common-errors";
import { fillField } from "../tests.utils";
import {
  warningClassName,
  errorClassName, //
} from "../utils/utils.dom";
import { scrollIntoView } from "../utils/scroll-into-view";
import { formFieldErrorClass } from "../utils/utils.dom";
import { getParentFieldEl } from "../tests.utils";
import { createTodoMutation } from "../components/CreateTodo/create-todo.injectables";

jest.mock("../components/Header/header.component", () => () => null);

jest.mock("../utils/scroll-into-view");
const mockScrollIntoView = scrollIntoView as jest.Mock;

jest.mock("../components/CreateTodo/create-todo.injectables");
const mockCreateTodoMutation = createTodoMutation as jest.Mock;

const mockAppDispatch = jest.fn();

let stateMachine = (null as unknown) as StateMachine;

afterEach(() => {
  cleanup();
  jest.resetAllMocks();
  (stateMachine as any) = null;
});

describe("components", () => {
  it("reset/form errors/create todo success", async () => {
    const { ui } = makeComp();
    render(ui);

    // submit without completing any form input
    const submitEl = getSubmit();
    expect(mockScrollIntoView).not.toHaveBeenCalled();
    submitEl.click();

    let notificationEl = await waitForElement(getNotification);
    // we get warning
    expect(notificationEl.classList).toContain(warningClassName);
    expect(mockScrollIntoView).toHaveBeenCalled();

    closeNotification(notificationEl);
    expect(getNotification()).toBeNull();

    const textInputEl = getTextInput();
    const invalidTextVal = "a";
    fillField(textInputEl, invalidTextVal);

    expect(getTextErrorEl()).toBeNull();

    submitEl.click();

    notificationEl = await waitForElement(getNotification);
    // we get error
    expect(notificationEl.classList).toContain(errorClassName);
    expect(getTextErrorEl()).not.toBeNull();

    const textInputParentFieldEl = getParentFieldEl(
      textInputEl,
      textFieldId,
    );

    expect(textInputParentFieldEl.classList).toContain(formFieldErrorClass);

    const validTextVal = "a@b.com";
    fillField(textInputEl, validTextVal);

    const createdTodo = {
      id: "1",
      text: "a",
    };

    mockCreateTodoMutation.mockResolvedValueOnce({
      data: {
        __typename: "success",
        todo: createdTodo,
      },
    } as ServerResponse);

    submitEl.click();

    await wait(() => true);

    const calls = mockCreateTodoMutation.mock.calls[0][0] as FormInput;

    expect(calls).toEqual({
      text: validTextVal,
    } as FormInput);

    expect(mockAppDispatch.mock.calls[0][0].todo).toEqual(createdTodo);
  });

  it("reset/server errors", async () => {
    const { ui } = makeComp();
    render(ui);

    // submit without completing any form input
    const submitEl = getSubmit();
    expect(mockScrollIntoView).not.toHaveBeenCalled();

    const textInputEl = getTextInput();
    const textVal = "a@b.com";
    fillField(textInputEl, textVal);

    mockCreateTodoMutation.mockResolvedValue({
      data: {
        __typename: "errors",
        errors: {
          text: ["a"],
        },
      },
    } as ServerResponse);

    expect(getNotification()).toBeNull();
    expect(getTextErrorEl()).toBeNull();
    expect(mockScrollIntoView).not.toHaveBeenCalled();

    submitEl.click();
    await waitForElement(getNotification);

    expect(getTextErrorEl()).not.toBeNull();
    expect(mockScrollIntoView).toHaveBeenCalled();
  });
});

describe("reducer", () => {
  const props = ({
    createEntry: mockCreateTodoMutation,
  } as unknown) as Props;

  const effectArgs = {
    dispatch: mockDispatch as any,
  } as EffectArgs;

  it("submission/invalid response", async () => {
    mockCreateTodoMutation.mockResolvedValue({});
    await submitAndRunEffect();

    expect(
      (stateMachine.states.submission as CommonErrorsState).commonErrors.context
        .errors,
    ).toBeDefined();
  });

  it("submission/exception", async () => {
    mockCreateTodoMutation.mockRejectedValue(new Error("a"));
    await submitAndRunEffect();

    expect(
      (stateMachine.states.submission as CommonErrorsState).commonErrors.context
        .errors,
    ).toBeDefined();
  });

  function completeFormInStateMachine(state?: StateMachine) {
    if (!state) {
      state = initState();
    }

    return reducer(state, {
      type: ActionType.FORM_CHANGED,
      value: "a@b.com",
      fieldName: "text",
    });
  }

  function submitAndRunEffect() {
    stateMachine = completeFormInStateMachine();

    stateMachine = reducer(stateMachine, {
      type: ActionType.SUBMISSION,
    });

    expect(
      (stateMachine.states.submission as CommonErrorsState).commonErrors,
    ).toBeUndefined();

    const { key, ownArgs } = getEffects(stateMachine)[0];
    const func = effectFunctions[key];

    return func(ownArgs as any, props, effectArgs);
  }

  function mockDispatch(action: Action) {
    stateMachine = reducer(stateMachine, action);
  }
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const CreateTodoP = CreateTodo as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<{}> } = {}) {
  return {
    ui: (
      <CreateTodoP
        {...props}
        createEntry={mockCreateTodoMutation}
        appDispatch={mockAppDispatch}
      />
    ),
  };
}

function getTextInput() {
  return document.getElementById(textInputId) as HTMLInputElement;
}

function getSubmit() {
  return document.getElementById(submitId) as HTMLElement;
}

function getNotification() {
  return document.getElementById(notificationId) as HTMLElement;
}

function closeNotification(notificationEl: HTMLElement) {
  (notificationEl
    .getElementsByClassName("delete")
    .item(0) as HTMLElement).click();
}

function getTextErrorEl() {
  return document.getElementById(textErrorId) as HTMLElement;
}

function getEffects(state: StateMachine) {
  return (state.effects.general as EffectState).hasEffects.context.effects;
}
