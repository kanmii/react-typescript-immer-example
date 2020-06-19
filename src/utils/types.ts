/* eslint-disable @typescript-eslint/no-explicit-any*/
import { PropsWithChildren } from "react";
import { ChangeEvent } from "react";

export type CommonError = Error | string;

export type ComponentProps = any &
  PropsWithChildren<{}> & {
    className?: string;
    id?: string;
    value?: any;
    onChange?: any;
    name?: string;
  };

export type IEnum<T extends object> = T[keyof T];

export type InputChangeEvent = ChangeEvent<HTMLInputElement>;

export type NoEffectVal = "noEffect";
export type HasEffectsVal = "hasEffects";
export type ActiveVal = "active";
export type InActiveVal = "inactive";
export type SubmissionVal = "submitting";
export type SuccessVal = "success";
export type CommonErrorsVal = "commonErrors";
export type WarningVal = "warning";
export type ValidVal = "valid";
export type InvalidVal = "invalid";
export type InitialVal = "initial";
export type UnChangedVal = "unchanged";
export type ChangedVal = "changed";
export type ErrorsVal = "errors";
export type EmptyVal = "empty";
export type FetchingVal = "fetching";

export const StateValue = {
  noEffect: "noEffect" as NoEffectVal,
  hasEffects: "hasEffects" as HasEffectsVal,
  inactive: "inactive" as InActiveVal,
  unchanged: "unchanged" as UnChangedVal,
  commonErrors: "commonErrors" as CommonErrorsVal,
  warning: "warning" as WarningVal,
  active: "active" as ActiveVal,
  submitting: "submission" as SubmissionVal,
  changed: "changed" as ChangedVal,
  valid: "valid" as ValidVal,
  invalid: "invalid" as InvalidVal,
  initial: "initial" as InitialVal,
  errors: "errors" as ErrorsVal,
  empty: "empty" as EmptyVal,
  fetching: "fetching" as FetchingVal,
  success: "success" as SuccessVal,
} as const;
