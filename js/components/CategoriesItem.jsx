/** @jsx React.DOM */
"use strict";

var React = require('react');
var ScoreBar = require('./ScoreBar.jsx');

var CategoriesItem = React.createClass({
  getDefaultProps: function() {
    return {
      reps: -1
    };
  },

  render: function() {
    var reps = this.props.reps >= 0 ? <td>{this.props.reps}</td> : '';
    return (
      <tr className="categoriesItem">
        <td>{this.props.category}</td>
        <td><ScoreBar directRep={this.props.directRep} prevDirectRep={this.props.prevDirectRep} category={this.props.category}/></td>
        {reps}
      </tr>
    );
  }
});

module.exports = CategoriesItem;
