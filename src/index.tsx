/* istanbul ignore file */
import React from "react";
import ReactDOM from "react-dom";
import "./styles/globals.scss";
import App from "./components/App/app.component";
import * as serviceWorker from "./register-service-worker";

ReactDOM.render(<App />, document.getElementById("root"));

serviceWorker.register();
