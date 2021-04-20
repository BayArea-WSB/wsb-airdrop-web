import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import Volunteer from "./Volunteer";
import reportWebVitals from "./reportWebVitals";
import { HashRouter as Router, Route } from "react-router-dom";

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Router>
        <Route path="/volunteer" component={Volunteer}></Route>
        <Route path="/" component={App}></Route>
      </Router>
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// dummy line
reportWebVitals();
