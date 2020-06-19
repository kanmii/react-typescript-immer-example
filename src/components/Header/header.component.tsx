import React from "react";
import "./styles.scss";
import logo from "../../media/logo.png";
import { domPrefix } from "./header.dom";

export function Header() {
  return (
    <header id={domPrefix} className="app-header">
      <span className="js-logo-text">
        <img src={logo} alt="logo" className="logo" />
      </span>
    </header>
  );
}

// istanbul ignore next:
export default () => {
  return <Header />;
};
