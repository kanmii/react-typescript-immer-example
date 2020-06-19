/* istanbul ignore file */
import { FormInput, ServerResponse } from "./create-todo.utils";
import { getBackendUrls } from "../../utils/get-backend-urls";
import { createTodo } from "../../todos-backend";

export async function createTodoMutation(
  input: FormInput,
): Promise<ServerResponse> {
  const url = getBackendUrls().apiUrl;
  return createTodo(input, url);
}

export type CreateTodoMutationType = {
  createEntry: typeof createTodoMutation;
};
