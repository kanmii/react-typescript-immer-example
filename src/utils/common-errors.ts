import { CommonError, CommonErrorsVal } from "./types";

export function parseStringError(error: string | Error): string {
  if (error instanceof Error) {
    return error.message;
  } else {
    return error;
  }
}

export const FORM_CONTAINS_ERRORS_MESSAGE =
  "Form contains errors. Please correct them and save again.";

export const GENERIC_SERVER_ERROR = "Something went wrong - please try again.";

export const NOTHING_TO_SAVE_WARNING_MESSAGE =
  "Please make changes before saving.";

export interface StringyErrorPayload {
  error: CommonError;
}

type ErrorField = string;
type ErrorText = string;
export type FieldError = ErrorText[];

export type CommonErrorsState = Readonly<{
  value: CommonErrorsVal;
  commonErrors: Readonly<{
    context: {
      errors: string;
    };
  }>;
}>;
