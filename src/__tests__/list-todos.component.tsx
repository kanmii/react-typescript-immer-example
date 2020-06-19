/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars*/
import React, { ComponentType } from "react";
import { render, cleanup } from "@testing-library/react";
import { ListTodos } from "../components/ListTodos/list-todos.components";
import { Props } from "../components/ListTodos/list-todos.utils";
import { StateValue } from "../utils/types";
import {
  emptyTodosSelector,
  fetchTodosErrorSelector,
  deleteTodoSelector
} from "../components/ListTodos/list-todos.dom";
import { Todo } from "../components/CreateTodo/create-todo.utils";

afterEach(() => {
  cleanup();
});

it("renders empty todos", () => {
  const { ui } = makeComp();

  render(ui);

  expect(
    document.getElementsByClassName(emptyTodosSelector).item(0),
  ).not.toBeNull();

  expect(
    document.getElementsByClassName(fetchTodosErrorSelector).item(0),
  ).toBeNull();


  expect(
    document.getElementsByClassName(deleteTodoSelector).item(0),
  ).toBeNull();
});

it("renders errors", () => {
  const { ui } = makeComp({
    props: {
      todos: {
        value: StateValue.commonErrors,
        commonErrors: {
          context: {
            errors: "",
          },
        },
      },
    },
  });

  render(ui);

  expect(
    document.getElementsByClassName(emptyTodosSelector).item(0),
  ).toBeNull();

  expect(
    document.getElementsByClassName(fetchTodosErrorSelector).item(0),
  ).not.toBeNull();

  expect(
    document.getElementsByClassName(deleteTodoSelector).item(0),
  ).toBeNull();
});

it("renders todos", () => {
  const { ui } = makeComp({
    props: {
      todos: {
        value: StateValue.success,
        success: {
          context: {
            todos: [
              {
                id: "a",
                text: "a",
              } as Todo,
            ],
          },
        },
      },
    },
  });

  render(ui);

  expect(
    document.getElementsByClassName(deleteTodoSelector).item(0),
  ).not.toBeNull();

  expect(
    document.getElementsByClassName(emptyTodosSelector).item(0),
  ).toBeNull();

  expect(
    document.getElementsByClassName(fetchTodosErrorSelector).item(0),
  ).toBeNull();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const ListTodosP = ListTodos as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  const todos = props.todos || {
    value: StateValue.empty,
  };

  return {
    ui: <ListTodosP {...props} todos={todos} />,
  };
}
