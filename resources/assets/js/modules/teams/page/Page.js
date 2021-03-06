import React from "react";
import PropTypes from "prop-types";
import List from "./panels/list";
import Record from "./panels/record";

const Page = props => (
  <React.Fragment>
    <List {...props} />
    <Record dispatch={props.dispatch} />
  </React.Fragment>
);

Page.propTypes = {
  dispatch: PropTypes.func.isRequired,
  teams: PropTypes.array.isRequired,
  pagination: PropTypes.object.isRequired
};

export default Page;
