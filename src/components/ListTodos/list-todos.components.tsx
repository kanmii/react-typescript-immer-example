import React from "react";
import "./styles.scss";
import { CallerProps, Props } from "./list-todos.utils";
import { StateValue } from "../../utils/types";
import {
  emptyTodosSelector,
  fetchTodosErrorSelector,
  deleteTodoSelector,
} from "./list-todos.dom";

export function ListTodos(props: Props) {
  const { todos } = props;

  switch (todos.value) {
    case StateValue.success: {
      return (
        <div>
          <div className="message subscribers-message">
            <div className="message-header">
              <p>See our cool subscribers</p>
            </div>
          </div>

          {todos.success.context.todos.map(({ text, id }, index) => {
            return (
              <div key={id} className="box">
                <div className="media">
                  <div className="media-left">
                    <button
                      className="button is-primary is-small is-light"
                      style={{
                        fontWeight: 700,
                      }}
                    >
                      Update
                    </button>
                  </div>

                  <div className="media-content">
                    <div className="content">{text}</div>
                  </div>

                  <div className="media-right">
                    <button className={`delete ${deleteTodoSelector}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    case StateValue.empty: {
      return (
        <div className={emptyTodosSelector}>
          You have no todos yet. Add one now.
        </div>
      );
    }

    case StateValue.commonErrors: {
      return (
        <div className={fetchTodosErrorSelector}>
          <div className="message is-danger">
            <div className="message-header">
              <p>Error while fetching todos</p>
            </div>
            <div className="message-body">
              <div>Error message:</div>
              {todos.commonErrors.context.errors}
            </div>
          </div>
        </div>
      );
    }

    // istanbul ignore next:
    default:
      throw new Error("not all cases handled");
  }
}

// istanbul ignore next:
export default (props: CallerProps) => {
  return (
    <div className="list-todos-component">
      <ListTodos {...props} />
    </div>
  );
};
