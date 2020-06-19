import { Reducer, Dispatch } from "react";
import { wrapReducer } from "../../logger";
import immer, { Draft } from "immer";
import {
  parseStringError,
  StringyErrorPayload,
  NOTHING_TO_SAVE_WARNING_MESSAGE,
  FORM_CONTAINS_ERRORS_MESSAGE,
  GENERIC_SERVER_ERROR,
  CommonErrorsState,
  FieldError,
} from "../../utils/common-errors";
import { scrollIntoView } from "../../utils/scroll-into-view";
import {
  StateValue,
  InActiveVal,
  WarningVal,
  ValidVal,
  InvalidVal,
  InitialVal,
  UnChangedVal,
  ChangedVal,
  SubmissionVal,
  SuccessVal,
} from "../../utils/types";
import {
  GenericGeneralEffect,
  getGeneralEffects,
  GenericEffectDefinition,
  GenericHasEffect,
} from "../../utils/effects";
import { CreateTodoMutationType } from "./create-todo.injectables";
import { AppChildProps, ActionType as AppActionType } from "../App/app.utils";
import { unstable_batchedUpdates } from "react-dom";

export enum ActionType {
  SUBMISSION = "@create-todo/submission",
  SERVER_ERRORS = "@create-todo/server-errors",
  COMMON_ERROR = "@create-todo/on-common-error",
  CLOSE_SUBMIT_NOTIFICATION = "@create-todo/close-submit-notification",
  FORM_CHANGED = "@create-todo/form-changed",
  ENTRY_CREATE_SUCCESS = "@create-todo/entry-create-success",
}

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, (proxy) => {
        proxy.effects.general.value = StateValue.noEffect;
        delete proxy.effects.general[StateValue.hasEffects];

        switch (type) {
          case ActionType.FORM_CHANGED:
            handleFormChangedAction(proxy, payload as FormChangedPayload);
            break;

          case ActionType.SUBMISSION:
            handleSubmissionAction(proxy);
            break;

          case ActionType.COMMON_ERROR:
            handleCommonErrorAction(proxy, payload as StringyErrorPayload);
            break;

          case ActionType.CLOSE_SUBMIT_NOTIFICATION:
            proxy.states.submission.value = StateValue.inactive;
            break;

          case ActionType.ENTRY_CREATE_SUCCESS:
            handleResetFormFieldsAction(proxy);
            break;

          case ActionType.SERVER_ERRORS:
            handleServerErrorsAction(proxy, payload as ServerErrorPayload);
            break;
        }
      });
    }

    // true
  );

////////////////////////// STATE UPDATE SECTION /////////////////

export function initState(): StateMachine {
  return {
    effects: {
      general: {
        value: StateValue.noEffect,
      },
    },
    states: {
      submission: { value: StateValue.inactive },
      form: {
        fields: {
          text: {
            states: {
              value: StateValue.unchanged,
            },
          },
        },
        validity: {
          value: "initial",
        },
      },
    },
  };
}

function handleFormChangedAction(
  proxy: DraftState,
  payload: FormChangedPayload
) {
  const { value: text, fieldName } = payload;
  const {
    states: {
      form: { fields },
    },
  } = proxy;

  const field = fields[fieldName] as FormField;
  const state = field.states as Draft<ChangedState>;
  state.value = StateValue.changed;
  state.changed = state.changed || {
    context: { formValue: text },
    states: {
      value: StateValue.initial,
    },
  };

  state.changed.context.formValue = text;
}

function handleSubmissionAction(proxy: DraftState) {
  const {
    states: { submission },
  } = proxy;

  const effects = getGeneralEffects<EffectType, DraftState>(proxy);
  submission.value = StateValue.inactive;

  const input = validateForm(proxy);
  const submissionErrorsState = submission as CommonErrorsState;
  const submissionWarningState = submission as SubmissionWarning;

  if (
    submissionErrorsState.value === StateValue.commonErrors ||
    submissionWarningState.value === StateValue.warning
  ) {
    effects.push({
      key: "scrollIntoViewEffect",
      ownArgs: {},
    });
    return;
  }

  submission.value = StateValue.submitting;

  effects.push({
    key: "createTodoEffect",
    ownArgs: { input },
  });
}

function validateForm(proxy: DraftState): FormInput {
  const {
    states: {
      submission,
      form: { fields },
    },
  } = proxy;

  const {
    text: { states: todoState },
  } = fields;

  const submissionErrorState = submission as CommonErrorsState;
  const submissionWarningState = submission as Draft<SubmissionWarning>;

  const input = {} as FormInput;
  let formUpdated = false;

  if (todoState.value === StateValue.changed) {
    const {
      changed: {
        context: { formValue },
        states: validityState0,
      },
    } = todoState;

    const value = formValue.trim();
    formUpdated = true;

    if (value.length < 2) {
      validateFormPutFieldErrorHelper(submissionErrorState, validityState0, [
        "must be at least two chars",
      ]);
    } else {
      input.text = value;
      validityState0.value = StateValue.valid;
    }
  }

  if (!formUpdated) {
    submissionWarningState.value = StateValue.warning;
    submissionWarningState.warning = {
      context: {
        warning: NOTHING_TO_SAVE_WARNING_MESSAGE,
      },
    };
  }

  return input;
}

function validateFormPutFieldErrorHelper(
  submissionErrorState: Draft<CommonErrorsState>,
  fieldState: ChangedState["changed"]["states"],
  errors: FieldError
) {
  submissionErrorState.value = StateValue.commonErrors;

  submissionErrorState.commonErrors = {
    context: {
      errors: FORM_CONTAINS_ERRORS_MESSAGE,
    },
  };

  const validityState = fieldState as Draft<FieldInValid>;
  validityState.value = StateValue.invalid;
  validityState.invalid = {
    context: {
      errors,
    },
  };
}

function handleCommonErrorAction(
  proxy: DraftState,
  payload: StringyErrorPayload
) {
  const errors = parseStringError(payload.error);

  const commonErrorsState = {
    value: StateValue.commonErrors,
    commonErrors: {
      context: {
        errors,
      },
    },
  } as Submission;

  proxy.states.submission = {
    ...proxy.states.submission,
    ...commonErrorsState,
  };

  const effects = getGeneralEffects(proxy);

  effects.push({
    key: "scrollIntoViewEffect",
    ownArgs: {},
  });
}

function handleResetFormFieldsAction(proxy: DraftState) {
  const {
    states: {
      submission,
      form: { fields },
    },
  } = proxy;

  submission.value = StateValue.inactive;

  Object.values(fields).forEach(({ states }) => {
    states.value = StateValue.unchanged;
    delete states[StateValue.changed];
  });
}

function handleServerErrorsAction(
  proxy: DraftState,
  payload: ServerErrorPayload
) {
  const {
    states: {
      form: {
        fields: { text: todo },
      },
      submission,
    },
  } = proxy;

  const {
    errors: { text: textErrors },
  } = payload;

  const submissionErrorState = submission as CommonErrorsState;
  let hasErrors = false;

  // istanbul ignore else:
  if (textErrors) {
    const {
      changed: { states },
    } = todo.states as Draft<ChangedState>;

    validateFormPutFieldErrorHelper(submissionErrorState, states, textErrors);
    hasErrors = true;
  }

  // istanbul ignore else:
  if (hasErrors) {
    const effects = getGeneralEffects(proxy);

    effects.push({
      key: "scrollIntoViewEffect",
      ownArgs: {},
    });
  }
}

////////////////////////// END STATE UPDATE SECTION ////////////

////////////////////////// EFFECTS SECTION /////////////////////////

const scrollIntoViewEffect: DefScrollToTopEffect["func"] = () => {
  scrollIntoView("");
};

type DefScrollToTopEffect = EffectDefinition<"scrollIntoViewEffect", {}>;

const createTodoEffect: DefCreateTodoEffect["func"] = async (
  ownArgs,
  props,
  effectArgs
) => {
  const { createEntry, appDispatch } = props;
  const { input } = ownArgs;
  const { dispatch } = effectArgs;

  try {
    const response = await createEntry(input);

    const validResponse = response && response.data && response.data;

    if (!validResponse) {
      dispatch({
        type: ActionType.COMMON_ERROR,
        error: GENERIC_SERVER_ERROR,
      });

      return;
    }

    if (validResponse.__typename === "errors") {
      dispatch({
        type: ActionType.SERVER_ERRORS,
        errors: validResponse.errors,
      });

      return;
    } else {
      const { todo } = validResponse;

      unstable_batchedUpdates(() => {
        appDispatch({
          type: AppActionType.CREATE_TODO_SUCCESS,
          todo: todo,
        });

        dispatch({
          type: ActionType.ENTRY_CREATE_SUCCESS,
        });
      });
    }
  } catch (error) {
    dispatch({
      type: ActionType.COMMON_ERROR,
      error,
    });
  }
};

type DefCreateTodoEffect = EffectDefinition<
  "createTodoEffect",
  {
    input: FormInput;
  }
>;

export const effectFunctions = {
  scrollIntoViewEffect,
  createTodoEffect,
};

////////////////////////// END EFFECTS SECTION /////////////////////////

////////////////////////// TYPES SECTION ////////////////////

type DraftState = Draft<StateMachine>;

export type StateMachine = Readonly<GenericGeneralEffect<EffectType>> &
  Readonly<{
    states: Readonly<{
      submission: Submission;
      form: Readonly<{
        validity: FormValidity;
        fields: Readonly<{
          text: FormField;
        }>;
      }>;
    }>;
  }>;

export type FormValidity = { value: InitialVal } | FormInValid;

interface FormInValid {
  value: InvalidVal;
  invalid: {
    context: {
      errors: FieldError;
    };
  };
}

type Submission =
  | Readonly<{
      value: InActiveVal;
    }>
  | Submitting
  | SubmissionSuccess
  | CommonErrorsState
  | SubmissionWarning;

type Submitting = Readonly<{
  value: SubmissionVal;
}>;

type SubmissionSuccess = Readonly<{
  value: SuccessVal;
}>;

type SubmissionWarning = Readonly<{
  value: WarningVal;
  warning: Readonly<{
    context: Readonly<{
      warning: string;
    }>;
  }>;
}>;

export type FormField<FormValue = string> = Readonly<{
  states:
    | Readonly<{
        value: UnChangedVal;
      }>
    | ChangedState<FormValue>;
}>;

type ChangedState<FormValue = string> = Readonly<{
  value: ChangedVal;
  changed: Readonly<{
    context: Readonly<{
      formValue: FormValue;
    }>;
    states:
      | Readonly<{
          value: InitialVal;
        }>
      | Readonly<{
          value: ValidVal;
        }>
      | FieldInValid;
  }>;
}>;

type FieldInValid = Readonly<{
  value: InvalidVal;
  invalid: Readonly<{
    context: {
      errors: FieldError;
    };
  }>;
}>;

interface FormChangedPayload {
  value: string;
  fieldName: keyof StateMachine["states"]["form"]["fields"];
}

interface ServerErrorPayload {
  errors: ServerResponseError["errors"];
}

export type Action =
  | {
      type: ActionType.CLOSE_SUBMIT_NOTIFICATION;
    }
  | ({
      type: ActionType.COMMON_ERROR;
    } & StringyErrorPayload)
  | {
      type: ActionType.SUBMISSION;
    }
  | ({
      type: ActionType.FORM_CHANGED;
    } & FormChangedPayload)
  | ({
      type: ActionType.SERVER_ERRORS;
    } & ServerErrorPayload)
  | {
      type: ActionType.ENTRY_CREATE_SUCCESS;
    };

export type CallerProps = AppChildProps & {
  callerProp: boolean;
};

export type Props = CallerProps & CreateTodoMutationType;

export interface EffectArgs {
  dispatch: Dispatch<Action>;
}

type EffectDefinition<
  Key extends keyof typeof effectFunctions,
  OwnArgs = {}
> = GenericEffectDefinition<EffectArgs, Props, Key, OwnArgs>;

type EffectType = DefCreateTodoEffect | DefScrollToTopEffect;
export type EffectState = GenericHasEffect<EffectType>;
type EffectList = EffectType[];

export interface FormInput {
  text: string;
}

export type ServerResponse = Readonly<{
  data: ServerResponseError | ServerResponseSuccess;
}>;

export type ServerResponseError = Readonly<{
  __typename: "errors";
  errors: Readonly<{
    text?: string[];
  }>;
}>;

export type Todo = Readonly<{
  __typename: "Todo";
  id: string;
  text: string;
}>;

export type ServerResponseSuccess = Readonly<{
  __typename: "success";
  todo: Todo;
}>;
