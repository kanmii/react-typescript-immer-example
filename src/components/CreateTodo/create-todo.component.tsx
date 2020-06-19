import React, { useReducer, useCallback, MouseEvent } from "react";
import Header from "../Header/header.component";
import "./styles.scss";
import {
  Props,
  effectFunctions,
  reducer,
  initState,
  ActionType,
  CallerProps,
  FormField,
} from "./create-todo.utils";
import { FieldError } from "../../utils/common-errors";
import FormCtrlError from "../FormCtrlError/form-ctrl-error.component";
import {
  textInputId,
  textErrorId,
  submitId,
  notificationId,
  textFieldId,
} from "./create-todo.dom";
import makeClassNames from "classnames";
import { warningClassName, errorClassName } from "../../utils/utils.dom";
import { StateValue, InputChangeEvent } from "../../utils/types";
import { useRunEffects } from "../../utils/use-run-effects";
import { formFieldErrorClass } from "../../utils/utils.dom";
import { createTodoMutation } from "./create-todo.injectables";

export function CreateTodo(props: Props) {
  const [stateMachine, dispatch] = useReducer(reducer, undefined, initState);

  const {
    states: {
      submission: submissionState,
      form: {
        fields: { text: textState },
      },
    },
    effects: { general: generalEffects },
  } = stateMachine;

  useRunEffects(generalEffects, effectFunctions, props, { dispatch });

  const onSubmit = useCallback((e: MouseEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch({
      type: ActionType.SUBMISSION,
    });
  }, []);

  const onCloseNotification = useCallback(() => {
    dispatch({
      type: ActionType.CLOSE_SUBMIT_NOTIFICATION,
    });
  }, []);

  const onTextChanged = useCallback((e: InputChangeEvent) => {
    const node = e.currentTarget;
    dispatch({
      type: ActionType.FORM_CHANGED,
      value: node.value,
      fieldName: "text",
    });
  }, []);

  let warningText = "";

  if (submissionState.value === StateValue.warning) {
    warningText = submissionState.warning.context.warning;
  }

  let errorText = "";
  if (submissionState.value === StateValue.commonErrors) {
    errorText = submissionState.commonErrors.context.errors;
  }

  return (
    <>
      <Header />

      <form onSubmit={onSubmit} className="todo-component form">
        {(warningText || errorText) && (
          <div
            id={notificationId}
            className={makeClassNames({
              notification: true,
              [warningClassName]: !!warningText,
              [errorClassName]: !!errorText,
            })}
          >
            <button
              type="button"
              className="delete"
              onClick={onCloseNotification}
            />
            {warningText || errorText}
          </div>
        )}

        <Todo state={textState} onFieldChanged={onTextChanged} />
      </form>
    </>
  );
}

function Todo(props: FieldComponentProps) {
  const { state, onFieldChanged } = props;

  let textValue = "";
  let textErrors: null | FieldError = null;

  if (state.states.value === StateValue.changed) {
    const {
      context: { formValue },
      states,
    } = state.states.changed;
    textValue = formValue;

    if (states.value === StateValue.invalid) {
      textErrors = states.invalid.context.errors;
    }
  }

  return (
    <div
      className={makeClassNames({
        field: true,
        [textFieldId]: true,
        [formFieldErrorClass]: !!textErrors,
      })}
    >
      <label htmlFor={textInputId} className="label form__label">
        Enter text
      </label>

      <div
        className={makeClassNames({
          "field form__field has-addons": true,
        })}
      >
        <div className="control form__control-wrapper">
          <input
            className="input"
            type="text"
            id={textInputId}
            value={textValue}
            onChange={onFieldChanged}
            autoComplete="off"
          />
        </div>

        <div className="control">
          <button
            type="submit"
            id={submitId}
            className={makeClassNames({
              button: true,
              "is-primary": !textErrors,
              "is-danger": !!textErrors,
            })}
          >
            Create
          </button>
        </div>
      </div>

      {textErrors && (
        <FormCtrlError id={textErrorId}>
          {textErrors.map((errorText, index) => {
            return (
              <div key={index}>
                <span>{errorText}</span>
              </div>
            );
          })}
        </FormCtrlError>
      )}
    </div>
  );
}

// istanbul ignore next:
export default (props: CallerProps) => {
  return <CreateTodo {...props} createEntry={createTodoMutation} />;
};

interface FieldComponentProps {
  state: FormField;
  onFieldChanged: (e: InputChangeEvent) => void;
}
