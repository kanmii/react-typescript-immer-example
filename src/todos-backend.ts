/* istanbul ignore file */
import { uuid } from "uuidv4";
import { ServerResponse } from "./components/App/app.utils";
import { FormInput, Todo } from "./components/CreateTodo/create-todo.utils";

const KEY = "TODOS-ub+yfdP4TCdHp7rRotYpAP";

export function fetchTodos(url = KEY): ServerResponse {
  const data = JSON.parse(localStorage.getItem(KEY) || "[]");

  return {
    data,
  };
}

export function createTodo(input: FormInput, url = KEY) {
  const randomNum = Math.floor(Math.random() * 10);
  const should = randomNum % 2 === 1;

  if (should) {
    return {
      data: {
        __typename: "errors" as "errors",
        errors: {
          text: ["too short"],
        },
      },
    };
  }

  if (randomNum > 7) {
    throw new Error("random errors");
  }

  const { text } = input;

  const todo: Todo = {
    __typename: "Todo",
    id: uuid(),
    text,
  };

  const todos = fetchTodos(url).data;
  todos.push(todo);
  localStorage.setItem(KEY, JSON.stringify(todos));

  return {
    data: {
      __typename: "success" as "success",
      todo,
    },
  };
}
