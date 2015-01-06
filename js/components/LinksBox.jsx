'use strict';

var $ = require('jquery');
var auth = require('../auth.jsx');
var LinkInput = require('./LinkInput.jsx');
var LinkItem = require('./LinkItem.jsx');
var React = require('react');

var LinksBox = React.createClass({
  getInitialState: function() {
    return { showEdit: false, showInput : false, user: null };
  },

  handleMouseOver: function() {
    if (!this.state.showInput) {
      this.setState({ showEdit: true });
    }
  },

  handleMouseLeave: function() {
    this.setState({ showEdit: false });
  },

  handleClick: function() {
    this.setState({ showInput: true });
  },

  closeInputBox: function() {
    this.setState({ showInput: false });
  },

  getLinkItems: function() {
    var links = this.props.user.links;
    var linkItems = [];
    var len = links.length;
    for (var i = 0; i < len; i++) {
      linkItems.push(this.makeLinkItem(i, links[i]));
    }
    return linkItems;
  },

  makeLinkItem: function(i, link) {
    return <li key={i} className="list-group-item"><LinkItem link={link} currentUser={this.props.currentUser} user={this.props.user}/></li>;
  },

  render: function() {
    var edit = '';
    var linkInput = '';
    if (this.props.currentUser._id == this.props.user._id) {
      if (this.state.showEdit) {
        edit = <div className="editBox" onClick={this.handleClick}>
                 <button className="btn btn-default btn-small">
                   <span className="glyphicon glyphicon-plus"></span>
                 </button>
               </div>;
      }

      if (this.state.showInput) {
        linkInput = <LinkInput user={this.props.user} reset={this.closeInputBox}/>;
      }
    }

    var linksList = '';
    if (!this.props.user.links || this.props.user.links.length === 0) {
      var text = 'You currently have no content displayed. Add some links so that users can check out your skills!';
      linksList = <p>{text}</p>;
    } else {
      linksList = <ul className="list-group">{this.getLinkItems()}</ul>;
    }

    return(
      <div className="linksBox" onMouseOver={this.handleMouseOver} onMouseLeave={this.handleMouseLeave}>
        <h4>Content</h4>
        {edit}
        {linkInput}
        {linksList}
      </div>
    );
  }
});

module.exports = LinksBox;
