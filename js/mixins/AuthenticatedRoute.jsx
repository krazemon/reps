"use strict";
var auth = require('../auth.jsx');
var React = require('react');
var Router = require('react-router');

var AuthenticatedRoute = {
  statics: {
    willTransitionTo: function (transition) {
      if (!auth.loggedIn()) {
        transition.redirect('/login');
      }
    }
  }
};

module.exports = AuthenticatedRoute;
