/** @jsx React.DOM */
var React = require('react/addons');
var TestUtils = React.addons.TestUtils;

describe('Test log in and log out flow.', function() {
  $ = require('jquery');
  var auth = require('auth.jsx');

  beforeEach(function() {
    window.localStorage = (function() {
      store = {};
      return {
        getItem: function(key) {
          return store[key];
        },
        setItem: function(key, item) {
          store[key] = item;
        }
      };
    }());
    spyOn($, "ajax");
  });

  afterEach(function() {
    store = {};
  });

  it('logs in correctly', function() {
    auth.logIn("user", "password", function () {});
    expect($.ajax).toHaveBeenCalledWith({
      type: 'POST',
      url: '/api/login',
      data: {
        email: "user",
        password: "password"
      },
      success: jasmine.any(Function),
      error: jasmine.any(Function)
    });
  });

  it('logs out correctly', function() {
    auth.logOut();
    expect($.ajax).toHaveBeenCalledWith({
      type: 'POST',
      url: 'api/logout',
      success: jasmine.any(Function),
      error: jasmine.any(Function),
    });
  });
});

describe('Update and check current users', function() {
  var $ = require('jquery');
  var auth = require('auth.jsx');
  beforeEach(function() {
    window.localStorage = (function() {
      store = {};
      return {
        getItem: function(key) {
          return store[key];
        },
        setItem: function(key, item) {
          store[key] = item;
        }
      };
    }());
    spyOn($, "ajax");
  });

  afterEach(function() {
    store = {};
  });

  it('Gets a current user when one is in localStorage', function() {
    var storedUser = {
      username: "user",
      password: "$xerwe324"
    };
    window.localStorage.setItem(
      'currentUser',
      JSON.stringify(storedUser)
    );

    auth.getCurrentUser(function(currentUser) {
      expect(currentUser).toEqual(storedUser);
    });
    expect(auth.loggedIn()).toEqual(true);
  });

  it('Makes a call to the backend when there is no user in localStorage', function() {
    delete window.localStorage.currentUser;
    auth.getCurrentUser(function(currentUser) {});
    expect($.ajax).toHaveBeenCalledWith({
      url: '/api/user',
      success: jasmine.any(Function),
      error: jasmine.any(Function)
    });
  });
});