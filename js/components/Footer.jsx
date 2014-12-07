/** @jsx React.DOM */
"use strict";

var React = require('react');
var Router = require('react-router');
var Link = Router.Link;

var Footer = React.createClass({
  render: function() {
    return (
<div className="footer navbar navbar-default btn-group navbar-fixed-bottom" role="navigation">
        <div className="container-fluid">
          <ul className="nav navbar-nav navbar-right">
            <li><Link to="home">Home</Link></li>
            <li><Link to="categories">Categories</Link></li>
            <li><Link to="about">About</Link></li>
            <li><Link to="contactUs">Contact Us</Link></li>
          </ul>
        </div>
      </div>
    );
  }
});

module.exports = Footer;
