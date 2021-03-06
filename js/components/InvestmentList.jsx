'use strict';

var InvestmentItem = require('./InvestmentItem');
var React = require('react');

var InvestmentList = React.createClass({
  getOrderedInvestments: function() {
    var comparator = this.getInvestmentComparator();
    return this.props.investments.concat().sort(comparator);
  },

  getInvestmentComparator: function() {
    return function(a, b) {
      var percentageA = Math.floor(a.dividend / a.amount*100);
      var percentageB = Math.floor(b.dividend / b.amount*100);
      if (percentageA > percentageB) {
        return -1;
      }
      if (percentageA < percentageB) {
        return 1;
      }
      return 0;
    }
  },

  render: function() {
    var investmentList = this.getOrderedInvestments()
    return (
        <ul>
          {investmentList.map(function(investment) {
            return <InvestmentItem key={investment.timeStamp} investment={investment} />;
         })}
      </ul>
    );
  }
});

module.exports = InvestmentList;
