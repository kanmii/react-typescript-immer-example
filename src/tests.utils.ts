/* istanbul ignore file */
import { fireEvent } from "@testing-library/react";

export function fillField(element: Element, value: string) {
  fireEvent.change(element, {
    target: { value },
  });
}

export function getParentFieldEl(
  childEl: HTMLElement,
  fieldClassName = "field",
) {
  return childEl.closest(`.${fieldClassName}`) as HTMLElement;
}
