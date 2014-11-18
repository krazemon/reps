/** @jsx React.DOM */
"use strict";
var $ = require('jquery');
var React = require('react');
var Router = require('react-router');
var Navigation = Router.Navigation;

var auth = {
  mixins: [Navigation],

  logIn: function(email, password, cb) {
    return $.ajax({
      type: 'POST',
      url: '/api/login',
      data: {
        email: email,
        password: password
      },
      success: function(user) {
        window.localStorage.setItem('currentUser', JSON.stringify(user));
        // Add token to localStorage that just stores the login response
        cb(true);
        return true;
      },
      error: function(xhr, status, err) {
        console.log(err);
        cb(false);
        return false;
      }
    });
  },

  storeCurrentUser: function(user, cb) {
    window.localStorage.setItem('currentUser', JSON.stringify(user));
    cb(user);
  }, 

  getCurrentUser: function(cb) {
    function getCurrentUserLocal(cb) {
      if (typeof window.localStorage === "undefined") {
        return false;
      }
      var currentUser = JSON.parse(window.localStorage.getItem('currentUser'));
      if (!currentUser) {
        return false;
      } else {
        cb(currentUser);
        return true;
      }
    }

    function getCurrentUserRemote(cb) {
      $.ajax({
        url:  '/api/user',
        success: function(user) {
          window.localStorage.setItem('currentUser', JSON.stringify(user));
          cb(user);
        },
        error: function(xhr, status, err) {
          console.error(this.props.userId, status, err.toString());
          cb(null);
        }
      });
    }
    if (!getCurrentUserLocal(cb)) {
      getCurrentUserRemote(cb);
    }
  },

  loggedIn: function() {
    return !!window.localStorage.getItem('currentUser'); 
  },

  logOut: function(cb) {
    return $.ajax({
      url: 'api/logout',
      type: 'POST',
      error: function(xhr, status, err) {
        console.error(err);
        if (cb) {
          cb(true);
        }
      }.bind(this),
      success: function(user) {
        window.localStorage.removeItem('currentUser', JSON.stringify(user));
        if (cb) {
          cb(false);
        }
      }.bind(this),
    });
  }
};

module.exports = auth;
