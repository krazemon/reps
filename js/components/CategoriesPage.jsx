'use strict';

var $ = require('jquery');
var AuthenticatedRoute = require('../mixins/AuthenticatedRoute.jsx');
var CategoriesList = require('./CategoriesList.jsx');
var CategoriesPageFilter = require('./CategoriesPageFilter.jsx');
var Footer = require('./Footer.jsx');
var React = require('react');
var Toolbar = require('./Toolbar.jsx');

var CategoriesPage = React.createClass({
  mixins: [AuthenticatedRoute],

  getInitialState: function() {
    return {
      categories : [],
      sortedCategories: [],
    };
  },

  componentDidMount: function() {
    $.ajax({
      url : '/api/categories',
      dataType : 'json',
      success: function(categories) {
        this.setState({ categories : categories, sortedCategories: categories });
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  sortResults: function(selected) {
    var comparator;
    switch(selected) {
      case 'Alphabetical':
        comparator = this.getAlphabeticalComparator();
        break;
      case 'Market Size (High to Low)':
        comparator = this.getMarketComparator(true);
        break;
      case 'Market Size (Low to High)':
        comparator = this.getMarketComparator(false);
        break;
      default:
        comparator = this.getAlphabeticalComparator();
        break;
    }
    this.setState({ sortedCategories: this.state.sortedCategories.sort(comparator) });
  },

  getAlphabeticalComparator: function() {
    return function(a, b) {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    }
  },

  getMarketComparator: function(high) {
    return function(a, b) {
      if (high) {
        return b.reps - a.reps;
      }
      return a.reps - b.reps;
    }
  },

  render: function() {
    return (
      <div className="categoriesPage">
        <div className="row">
          <Toolbar />
        </div>
        <div className="row">
          <h1 className="col-md-8 categories-page-title">Check out all of the existing categories on Repcoin.</h1>
          <div className="col-md-3 cat-page-filter">
            <CategoriesPageFilter sortResults={this.sortResults}/>
          </div>
        </div>
        <div className="row">
          <CategoriesList categories={this.state.sortedCategories} />
        </div>
        <div className="row footerrow">
          <Footer />
        </div>
      </div>
    );
  }
});

module.exports = CategoriesPage;
