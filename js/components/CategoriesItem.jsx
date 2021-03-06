'use strict';

var InvestorList = require('./InvestorList.jsx');
var React = require('react');
var Router = require('react-router');
var Link = Router.Link;

var CategoriesItem = React.createClass({
  getInitialState: function() {
    return { investors: [] };
  },

  componentDidMount: function() {
    this.getInvestors(this.props);
  },

  // Check to see if investors need to be refreshed
  componentWillReceiveProps: function(props) {
    if (props.userId !== this.props.userId) {
      this.getInvestors(props);
    }
  },

  handleClick: function() {
    this.props.showDeleteBox(this.props.category);
  },

  getInvestors: function(props) {
    var category = props.category
    var idList = [];
    var length = category.investors.length;
    if (length === 0) {
      return;
    }

    for (var i = 0; i < length; i++) {
      idList.push(category.investors[i].id);
    }
    var url = '/api/users/list/byids';
    var data = { idList: idList };
    $.ajax({
      url: url,
      data: data,
      success: function(investors) {
        this.setState({ investors: investors });
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(xhr.responseText, err.toString());
      }.bind(this)
    });
  },

  render: function() {
    var deleteBtn = ''; // The delete option that pops up on hover

    if (this.props.deleteMode) {
      deleteBtn = <div onClick={this.handleClick}>
        <button className="btn btn-danger del-expert-cat-btn">Delete</button>
      </div>;
    }

    var rank = '';
    if (this.props.size) {
      rank = this.props.category.rank + ' / ' + this.props.size;
    }
    return (
      <tr>
        <tr className="categoriesItem">
          <td>
            <Link to="category" params={{category: this.props.category.name}}>{this.props.category.name}</Link>
            {deleteBtn}
          </td>
          <td>{rank}</td>
          <td>{this.props.category.reps}</td>
          <td>
            <InvestorList category={this.props.category} investors={this.state.investors} />
          </td>
        </tr>
      </tr>
    );
  }
});

module.exports = CategoriesItem;
