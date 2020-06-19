/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import { render, cleanup } from "@testing-library/react";
import { Header } from "../components/Header/header.component";
import { domPrefix } from "../components/Header/header.dom";

afterEach(() => {
  cleanup();
  jest.resetAllMocks();
});

const logoTextClassName = "js-logo-text";

it("renders", () => {
  const { ui } = makeComp();
  render(ui);
  const headerEl = document.getElementById(domPrefix) as HTMLElement;
  expect(headerEl.getElementsByClassName(logoTextClassName).length).toBe(1);
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const HeaderP = Header as ComponentType<Partial<{}>>;

function makeComp() {
  return {
    ui: <HeaderP />,
  };
}
