/* istanbul ignore file */
import { ServerResponse } from "./app.utils";
import { getBackendUrls } from "../../utils/get-backend-urls";
import { fetchTodos } from "../../todos-backend";

export async function fetchTodosFn(): Promise<ServerResponse> {
  const url = getBackendUrls().apiUrl;
  return fetchTodos(url);
}

export type FetchTodosType = {
  fetchTodos: typeof fetchTodosFn;
};
