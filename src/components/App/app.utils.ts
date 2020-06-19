import { Reducer, Dispatch } from "react";
import { wrapReducer } from "../../logger";
import immer, { Draft } from "immer";
import {
  parseStringError,
  StringyErrorPayload,
  GENERIC_SERVER_ERROR,
  CommonErrorsState,
} from "../../utils/common-errors";
import {
  StateValue,
  SuccessVal,
  EmptyVal,
  FetchingVal,
} from "../../utils/types";
import {
  GenericGeneralEffect,
  getGeneralEffects,
  GenericEffectDefinition,
  GenericHasEffect,
} from "../../utils/effects";
import { FetchTodosType } from "./app.injectables";
import { scrollIntoView } from "../../utils/scroll-into-view";
import { Todo } from "../CreateTodo/create-todo.utils";

export enum ActionType {
  COMMON_ERROR = "@app/common-error",
  SERVER_SUCCESS = "@app/server-success",
  CREATE_TODO_SUCCESS = "@app/create-todo-success",
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
          case ActionType.COMMON_ERROR:
            handleCommonErrorAction(proxy, payload as StringyErrorPayload);
            break;

          case ActionType.SERVER_SUCCESS:
            handleServerSuccessAction(proxy, payload as ServerSuccessPayload);
            break;

          case ActionType.CREATE_TODO_SUCCESS:
            handleTodoCreatedAction(
              proxy,
              payload as CreateTodoSuccessPayload
            );
        }
      });
    }

    // true,
  );

////////////////////////// STATE UPDATE SECTION /////////////////

export function initState(): StateMachine {
  return {
    effects: {
      general: {
        value: StateValue.hasEffects,
        hasEffects: {
          context: {
            effects: [
              {
                key: "fetchTodosEffect",
                ownArgs: {},
              },
            ],
          },
        },
      },
    },
    states: {
      todos: {
        value: StateValue.fetching,
      },
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
  } as TodosState;

  proxy.states.todos = {
    ...proxy.states.todos,
    ...commonErrorsState,
  };

  const effects = getGeneralEffects(proxy);

  effects.push({
    key: "scrollIntoViewEffect",
    ownArgs: {},
  });
}

function handleServerSuccessAction(
  proxy: DraftState,
  payload: ServerSuccessPayload
) {
  const {
    states: { todos: success },
  } = proxy;

  const { todos } = payload;

  if (todos.length) {
    const todosState = success as Draft<TodosSuccess>;
    todosState.value = StateValue.success;
    todosState.success = {
      context: {
        todos,
      },
    };
  } else {
    (success as Draft<TodosEmpty>).value = StateValue.empty;
  }
}

function handleTodoCreatedAction(
  proxy: DraftState,
  payload: CreateTodoSuccessPayload
) {
  const {
    states: { todos },
  } = proxy;

  const { todo } = payload;
  const todosSuccess = todos as Draft<TodosSuccess>;

  switch (todos.value) {
    case StateValue.success:
      todos.success.context.todos.unshift(todo);
      break;

    default:
      todosSuccess.value = StateValue.success;
      todosSuccess.success = {
        context: {
          todos: [todo],
        },
      };
      break;
  }
}

////////////////////////// END STATE UPDATE SECTION ////////////

////////////////////////// EFFECTS SECTION /////////////////////////

const fetchTodosEffect: DefFetchTodosEffect["func"] = async (
  _,
  props,
  effectArgs
) => {
  const { fetchTodos} = props;
  const { dispatch } = effectArgs;

  try {
    const response = await fetchTodos();

    const validResponse = response && response.data && response.data;

    if (!validResponse) {
      dispatch({
        type: ActionType.COMMON_ERROR,
        error: GENERIC_SERVER_ERROR,
      });

      return;
    }

    dispatch({
      type: ActionType.SERVER_SUCCESS,
      todos: validResponse,
    });
  } catch (error) {
    dispatch({
      type: ActionType.COMMON_ERROR,
      error,
    });
  }
};

type DefFetchTodosEffect = EffectDefinition<"fetchTodosEffect">;

const scrollIntoViewEffect: DefScrollToTopEffect["func"] = () => {
  scrollIntoView("");
};

type DefScrollToTopEffect = EffectDefinition<"scrollIntoViewEffect", {}>;

export const effectFunctions = {
  fetchTodosEffect,
  scrollIntoViewEffect,
};

////////////////////////// END EFFECTS SECTION /////////////////////////

////////////////////////// TYPES SECTION ////////////////////

type DraftState = Draft<StateMachine>;

export type StateMachine = Readonly<GenericGeneralEffect<EffectType>> &
  Readonly<{
    states: Readonly<{
      todos: TodosState;
    }>;
  }>;

////////////////////////// STRINGY TYPES SECTION ///////////

export type TodosState =
  | TodosSuccess
  | CommonErrorsState
  | TodosEmpty
  | Readonly<{
      value: FetchingVal;
    }>;

type TodosEmpty = Readonly<{
  value: EmptyVal;
}>;

export type TodosSuccess = Readonly<{
  value: SuccessVal;
  success: {
    context: {
      todos: Todo[];
    };
  };
}>;

type ServerSuccessPayload = Readonly<{
  todos: ServerResponse["data"];
}>;

type CreateTodoSuccessPayload = Readonly<{
  todo: Todo;
}>;

export type Action =
  | ({
      type: ActionType.COMMON_ERROR;
    } & StringyErrorPayload)
  | ({
      type: ActionType.SERVER_SUCCESS;
    } & ServerSuccessPayload)
  | ({
      type: ActionType.CREATE_TODO_SUCCESS;
    } & CreateTodoSuccessPayload);

export interface EffectArgs {
  dispatch: DispatchType;
}

export type DispatchType = Dispatch<Action>;

export type AppChildProps = {
  appDispatch: DispatchType;
};

export type Props = FetchTodosType;

type EffectDefinition<
  Key extends keyof typeof effectFunctions,
  OwnArgs = {}
> = GenericEffectDefinition<EffectArgs, Props, Key, OwnArgs>;

type EffectType = DefFetchTodosEffect | DefScrollToTopEffect;
export type EffectState = GenericHasEffect<EffectType>;
type EffectList = EffectType[];

export interface FormInput {
  text: string;
}

export type ServerResponse = Readonly<{
  data: Todo[];
}>;
