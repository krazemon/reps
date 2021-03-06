process.env.NODE_ENV = 'test';
var UserHandler = require('../api/handlers/user.js');

var Category = require('../api/models/Category.js');
var Transaction = require('../api/models/Transaction.js');
var User = require('../api/models/User.js');
var VerificationToken = require('../api/models/VerificationToken.js');

var transporter = require('../config/mailer.js').transporterFactory();
var winston = require('winston');
var utils = require('../api/routes/utils.js');

describe('UserHandler: ', function() {
  var req, res;
  beforeEach(function() {
    spyOn(winston, 'log').andCallFake(function(arg1, arg2, arg3, arg4) {
      return;
    });

    req = {
      query: {},
      params: {},
      body: {},
      session: {}
    };

    res = {
      status: jasmine.createSpy().andCallFake(function(msg) {
        return this;
      }),
      send: jasmine.createSpy().andCallFake(function(msg) {
        return this;
      }),
      login: jasmine.createSpy().andCallFake(function(user) {
        return user;
      }),
      end: jasmine.createSpy()
    };
  });

  afterEach(function() {
    expect(res.status.callCount).toEqual(1);
    expect(res.send.callCount).toEqual(1);
  });

  describe('verify: ', function() {
    describe('post: ', function() {
      it('handles no verification token', function() {
        UserHandler.verify.post(req, res);
        expect(res.status).toHaveBeenCalledWith(412);
        expect(res.send).toHaveBeenCalledWith('No verification token provided');
      });

      it('handles error finding verification token', function() {
          req.body = { verificationToken : '123' };
          spyOn(VerificationToken, 'findOne').andCallFake(function(query, cb) {
            return cb('Error', null);
          });
          UserHandler.verify.post(req, res);
          expect(res.status).toHaveBeenCalledWith(501);
          expect(res.send).toHaveBeenCalledWith('Error');
      });

      it('handles a null verification token', function() {
          req.body = { verificationToken : '123' };
          spyOn(VerificationToken, 'findOne').andCallFake(function(query, cb) {
            return cb(null, null);
          });
          UserHandler.verify.post(req, res);
          expect(res.status).toHaveBeenCalledWith(501);
          expect(res.send).toHaveBeenCalledWith('No verification token found');
      });

      it('handles a triggered verification token', function() {
          req.body = { verificationToken : '123' };
          spyOn(VerificationToken, 'findOne').andCallFake(function(query, cb) {
            return cb(null, { triggered: true });
          });
          UserHandler.verify.post(req, res);
          expect(res.status).toHaveBeenCalledWith(501);
          var msg = 'Verification token has already been used. Please return to the home page and log in.';
          expect(res.send).toHaveBeenCalledWith(msg);
      });

      it('handles error updating user', function() {
          req.body = { verificationToken : '123' };
          spyOn(VerificationToken, 'findOne').andCallFake(function(query, cb) {
            return cb(null, { triggered: false });
          });
          spyOn(User, 'findOneAndUpdate').andCallFake(function(arg1, arg2, cb) {
            return cb('Error', null);
          });
          UserHandler.verify.post(req, res);
          expect(res.status).toHaveBeenCalledWith(501);
          expect(res.send).toHaveBeenCalledWith('Error');
      });

      it('handles error logging in user', function() {
          req.body = { verificationToken : '123' };
          spyOn(VerificationToken, 'findOne').andCallFake(function(query, cb) {
            return cb(null, { triggered: false, save: jasmine.createSpy().andReturn() });
          });
          spyOn(User, 'findOneAndUpdate').andCallFake(function(arg1, arg2, cb) {
            return cb(null, { _id: '123' });
          });
          req.login = jasmine.createSpy().andCallFake(function(user, cb) {
            return cb('Error');
          });
          UserHandler.verify.post(req, res);
          expect(res.status).toHaveBeenCalledWith(501);
          expect(res.send).toHaveBeenCalledWith('Error');
      });

      it('logs in the user', function() {
          req.body = { verificationToken : '123' };
          spyOn(VerificationToken, 'findOne').andCallFake(function(query, cb) {
            return cb(null, { triggered: false, save: jasmine.createSpy().andReturn() });
          });
          spyOn(User, 'findOneAndUpdate').andCallFake(function(arg1, arg2, cb) {
            return cb(null, { _id: '123' });
          });
          req.login = jasmine.createSpy().andCallFake(function(user, cb) {
            return cb(null);
          });
          UserHandler.verify.post(req, res);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.send).toHaveBeenCalledWith({ _id: '123' });
      });
    });
  });

  describe('users: ', function() {
    describe('share: ', function() {
      describe('get', function() {
        it('returns the full URL', function () {
          req.user = {_id: 'foobar'};
          UserHandler.users.share.get(req, res);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.send).toHaveBeenCalledWith(
            'test/#/login/' + req.user._id + '/' +
            'e82925af40e73dfeba187eb63d4e395d')
        });

        it('fails when req.user has no id value', function() {
          req.user = {};
          UserHandler.users.share.get(req, res);
          expect(res.status).toHaveBeenCalledWith(412);
        })
      });
    });

    describe('trending: ', function() {
      describe('experts: ', function() {
        var transactionPromise;
        beforeEach(function() {
          transactionPromise = {
            userIds: [
              { _id: '456' },
              { _id: '123' },
            ],

            then: function(cb) {
              return cb(this.userIds);
            }
          };
        });

        describe('getByCategory: ', function() {
          it('handles error finding users ids', function() {
            spyOn(Transaction, 'findTrendingExpertsByCategory').andReturn({
              then: function(cbS, cbF) { return cbF('failure'); }
            });
            req.params = { order: 'high' };
            UserHandler.users.trending.experts.getByCategory(req, res);
            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.send).toHaveBeenCalledWith('failure');
          });

          it('finds trending users', function() {
            var users = [
              { _id: '123' },
              { _id: '456' },
            ]
            var sortedUsers = [
              { _id: '456' },
              { _id: '123' },
            ]

            spyOn(Transaction, 'findTrendingExpertsByCategory').andReturn(transactionPromise);
            spyOn(User, 'findTruncatedUsersByCategory').andReturn({
              then: function(cbS, cbF) { return cbS(users); }
            });
            req.params = { order: 'high' };
            UserHandler.users.trending.experts.getByCategory(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(sortedUsers);
          });
        });

        describe('getOverall: ', function() {
          it('handles error finding users ids', function() {
            spyOn(Transaction, 'findOverallTrendingExperts').andReturn({
              then: function(cbS, cbF) { return cbF('failure'); }
            });
            req.params = { order: 'high' };
            UserHandler.users.trending.experts.getOverall(req, res);
            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.send).toHaveBeenCalledWith('failure');
          });

          it('finds trending users', function() {
            var users = [
              { _id: '123' },
              { _id: '456' },
            ]
            var sortedUsers = [
              { _id: '456' },
              { _id: '123' },
            ]

            spyOn(Transaction, 'findOverallTrendingExperts').andReturn(transactionPromise);
            spyOn(User, 'findPublic').andCallFake(function(query, cb) {
              return cb(null, users);
            });
            req.params = { order: 'high' };
            UserHandler.users.trending.experts.getOverall(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(sortedUsers);
          });
        });

        describe('get: ', function() {
          it('handles error finding users ids', function() {
            spyOn(Transaction, 'findTrendingExperts').andReturn(transactionPromise);
            spyOn(User, 'findPublic').andCallFake(function(query, cb) {
              return cb('Error', null);
            });
            UserHandler.users.trending.experts.get(req, res);
            expect(res.status).toHaveBeenCalledWith(501);
            expect(res.send).toHaveBeenCalledWith('Error');
          });

          it('finds trending users', function() {
            var users = [
              { _id: '123' },
              { _id: '456' },
            ]
            var sortedUsers = [
              { _id: '456' },
              { _id: '123' },
            ]

            spyOn(Transaction, 'findTrendingExperts').andReturn(transactionPromise);
            spyOn(User, 'findPublic').andCallFake(function(query, cb) {
              return cb(null, users);
            });
            UserHandler.users.trending.experts.get(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(sortedUsers);
          });
        });
      });
    });

    describe('get: ', function() {
      it('finds users with no search term', function() {
        spyOn(User, 'findPublic').andCallFake(function(query, cb) {
          return cb(null, [{ username: 'Matt Ritter'}]);
        });
        UserHandler.users.get(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith([{ username: 'Matt Ritter'}]);
      });

      it('handles error finding users with no search term', function() {
        spyOn(User, 'findPublic').andCallFake(function(query, cb) {
          return cb('Error', null);
        });
        UserHandler.users.get(req, res);
        expect(res.status).toHaveBeenCalledWith(501);
        expect(res.send).toHaveBeenCalledWith('Error');
      });

      it('gets users with a search term', function() {
        spyOn(User, 'findBySearchTermPublic').andCallFake(function(query, cb) {
          return cb(null, [{ username: 'Matt Ritter'}]);
        });
        req.query = { searchTerm: 'Matt' };
        UserHandler.users.get(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith([{ username: 'Matt Ritter'}]);
      });

      it('handles error getting users with a search term', function() {
        spyOn(User, 'findBySearchTermPublic').andCallFake(function(query, cb) {
          return cb('Error', null);
        });
        req.query = { searchTerm: 'Matt' };
        UserHandler.users.get(req, res);
        expect(res.status).toHaveBeenCalledWith(501);
        expect(res.send).toHaveBeenCalledWith('Error');
      });

      it('gets users as search items', function() {
        spyOn(User, 'findForSearch').andCallFake(function(query) {
          return {
            then: function(cbS, cbF) { return cbS([{ username: 'Matt Ritter'}]); }
          };
        });
        req.query = { searchItems: true };
        UserHandler.users.get(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith([{ username: 'Matt Ritter'}]);
      });

      it('handles error getting users as search items', function() {
        spyOn(User, 'findForSearch').andCallFake(function(query, cb) {
          return {
            then: function(cbS, cbF) { return cbF('Error') }
          };
        });
        req.query = { searchItems: true };
        UserHandler.users.get(req, res);
        expect(res.status).toHaveBeenCalledWith(501);
        expect(res.send).toHaveBeenCalledWith('Error');
      });
    });

    describe('listByIds: ', function() {
      describe('get: ', function() {
        it('successfully finds users with an id list', function() {
          spyOn(User, 'findPublic').andCallFake(function(query, cb) {
            return cb(null, { username: 'Matt' });
          });
          req.query = { idList: ['123'] };
          UserHandler.users.listByIds.get(req, res);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.send).toHaveBeenCalledWith({ username: 'Matt'});
        });

        it('handles error from no id list', function() {
          UserHandler.users.listByIds.get(req, res);
          expect(res.status).toHaveBeenCalledWith(412);
          expect(res.send).toHaveBeenCalledWith('No id list provided');
        });

        it('handles Mongo error', function() {
          spyOn(User, 'findPublic').andCallFake(function(query, cb) {
            return cb('Error', null);
          });
          req.query = { idList: ['123'] };
          UserHandler.users.listByIds.get(req, res);
          expect(res.status).toHaveBeenCalledWith(501);
          expect(res.send).toHaveBeenCalledWith('Error');
        });
      });
    });

    describe('leading: ', function() {
      describe('getByCategory: ', function() {
        describe('experts: ', function() {
          it('returns experts by the given metric', function() {
            spyOn(User, 'getExpertsByMetricForCategory').andReturn({
              then: function(cbS, cbF) {
                return cbS([]);
              }
            });
            req.params = { order: 'high', datatype: 'timestamp', category: 'foo' };
            UserHandler.users.leading.getByCategory.experts(req, res);
            expect(User.getExpertsByMetricForCategory.callCount).toEqual(1);
            expect(User.getExpertsByMetricForCategory).toHaveBeenCalledWith(-1, 'foo', 'timestamp');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith([]);
          });

          it('handles error finding experts', function() {
            spyOn(User, 'getExpertsByMetricForCategory').andReturn({
              then: function(cbS, cbF) {
                  return cbF('Error!');
              }
            });
            req.params = { order: 'high', datatype: 'timestamp', category: 'foo' };
            UserHandler.users.leading.getByCategory.experts(req, res);
            expect(User.getExpertsByMetricForCategory.callCount).toEqual(1);
            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.send).toHaveBeenCalledWith('Error!');
          });
        });

        describe('investors: ', function() {
          it('returns investors by the given metric', function() {
            spyOn(User, 'getInvestorsByMetricForCategory').andReturn({
              then: function(cbS, cbF) {
                return cbS([]);
              }
            });
            req.params = { order: 'high', datatype: 'timestamp', category: 'foo' };
            UserHandler.users.leading.getByCategory.investors(req, res);
            expect(User.getInvestorsByMetricForCategory.callCount).toEqual(1);
            expect(User.getInvestorsByMetricForCategory).toHaveBeenCalledWith(-1, 'foo', 'timestamp');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith([]);
          });

          it('handles error finding investors', function() {
            spyOn(User, 'getInvestorsByMetricForCategory').andReturn({
              then: function(cbS, cbF) {
                  return cbF('Error!');
              }
            });
            req.params = { order: 'high', datatype: 'timestamp', category: 'foo' };
            UserHandler.users.leading.getByCategory.investors(req, res);
            expect(User.getInvestorsByMetricForCategory.callCount).toEqual(1);
            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.send).toHaveBeenCalledWith('Error!');
          });
        });
      });

      describe('get: ', function() {
        it('returns leaders by the given metric', function() {
          spyOn(User, 'getLeadersByTimeStamp').andReturn({
            then: function(cbS, cbF) {
              return cbS([]);
            }
          });
          req.params = { order: 'high', datatype: 'timestamp' };
          UserHandler.users.leading.get(req, res);
          expect(User.getLeadersByTimeStamp.callCount).toEqual(1);
          expect(User.getLeadersByTimeStamp).toHaveBeenCalledWith(-1);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.send).toHaveBeenCalledWith([]);
        });

        it('handles error finding leaders', function() {
          spyOn(User, 'getLeadersByTimeStamp').andReturn({
            then: function(cbS, cbF) {
                return cbF('Error!');
            }
          });
          req.params = { order: 'high', datatype: 'timestamp' };
          UserHandler.users.leading.get(req, res);
          expect(User.getLeadersByTimeStamp.callCount).toEqual(1);
          expect(res.status).toHaveBeenCalledWith(503);
          expect(res.send).toHaveBeenCalledWith('Error!');
        });
      });
    });

    describe('leaders: ', function() {
      describe('get: ', function() {
        var users = [ { categories: [ { name: 'Foo', rank: 20 } ] } ];

        it('returns ranked investors', function() {
          spyOn(User, 'findTopRankedInvestors').andReturn({
            then: function(cbS, cbF) {
              return cbS([]);
            }
          });
          req.query = { expert: '0' };
          req.params = { categoryName: 'Foo' };
          UserHandler.users.leaders.get(req, res);
          expect(User.findTopRankedInvestors.callCount).toEqual(1);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.send).toHaveBeenCalledWith([]);
        });

        it('returns ranked experts', function() {
          spyOn(User, 'findTopRankedExperts').andReturn({
            then: function(cbS, cbF) {
              return cbS([]);
            }
          });
          req.query = { expert: '1' };
          req.params = { categoryName: 'Foo' };
          UserHandler.users.leaders.get(req, res);
          expect(User.findTopRankedExperts.callCount).toEqual(1);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.send).toHaveBeenCalledWith([]);
        });

        it('handles invalid inputs', function() {
          UserHandler.users.leaders.get(req, res);
          expect(res.status).toHaveBeenCalledWith(412);
          expect(res.send).toHaveBeenCalledWith('Invalid inputs');
        });

        it('handles error finding leaders', function() {
          spyOn(User, 'findTopRankedExperts').andReturn({
            then: function(cbS, cbF) {
                return cbF('Error!');
            }
          });
          req.query = { expert: '1' };
          req.params = { categoryName: 'Foo' };
          UserHandler.users.leaders.get(req, res);
          expect(User.findTopRankedExperts.callCount).toEqual(1);
          expect(res.status).toHaveBeenCalledWith(503);
          expect(res.send).toHaveBeenCalledWith('Error!');
        });
      });
    });

    describe('userId: ', function() {
      describe('get: ', function() {
        it('gets the user with the public method if a different user is requesting', function() {
          spyOn(User, 'findByIdPublic').andCallFake(function(query, cb) {
            return cb(null, { username: 'Matt' });
          });
          req.params = { user_id: '123' };
          req.session = { passport: { user: '456' } };
          UserHandler.users.userId.get(req, res);
          expect(User.findByIdPublic.callCount).toEqual(1);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.send).toHaveBeenCalledWith({ username: 'Matt' });
        });

        it('gets the user with the private method if the same user is requesting', function() {
          spyOn(User, 'findById').andCallFake(function(query, cb) {
            return cb(null, { username: 'Matt' });
          });
          req.params = { user_id: '123' };
          req.session = { passport: { user: '123' } };
          UserHandler.users.userId.get(req, res);
          expect(User.findById.callCount).toEqual(1);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.send).toHaveBeenCalledWith({ username: 'Matt' });
        });

        it('handles a null user', function() {
          spyOn(User, 'findById').andCallFake(function(query, cb) {
            return cb(null, null);
          });
          req.params = { user_id: '123' };
          req.session = { passport: { user: '123' } };
          UserHandler.users.userId.get(req, res);
          expect(User.findById.callCount).toEqual(1);
          expect(res.status).toHaveBeenCalledWith(501);
          expect(res.send).toHaveBeenCalledWith('No user was found');
        });

        it('handles an error finding the user', function() {
          spyOn(User, 'findById').andCallFake(function(query, cb) {
            return cb('Error', null);
          });
          req.params = { user_id: '123' };
          req.session = { passport: { user: '123' } };
          UserHandler.users.userId.get(req, res);
          expect(User.findById.callCount).toEqual(1);
          expect(res.status).toHaveBeenCalledWith(501);
          expect(res.send).toHaveBeenCalledWith('Error');
        });
      });

      describe('put: ', function() {
        it('handles invalid inputs', function() {
          req.params = { user_id: '123' };
          req.body = { picture: {} };
          UserHandler.users.userId.put(req, res);
          expect(res.status).toHaveBeenCalledWith(412);
          expect(res.send).toHaveBeenCalledWith('Invalid inputs');
        });

        it('handles an error finding the user', function() {
          spyOn(User, 'findById').andCallFake(function(query, cb) {
            return cb('Error', null);
          });
          req.params = { user_id: '123' };
          UserHandler.users.userId.put(req, res);
          expect(res.status).toHaveBeenCalledWith(501);
          expect(res.send).toHaveBeenCalledWith('Error');
        });

        it('handles an null user', function() {
          spyOn(User, 'findById').andCallFake(function(query, cb) {
            return cb(null, null);
          });
          req.params = { user_id: '123' };
          UserHandler.users.userId.put(req, res);
          expect(res.status).toHaveBeenCalledWith(501);
          expect(res.send).toHaveBeenCalledWith('No user found with id: 123');
        });

        it('handles invalid link inputs', function() {
          spyOn(User, 'findById').andCallFake(function(query, cb) {
            return cb(null, { username: 'Matt' });
          });
          req.params = { user_id: '123' };
          req.body = { links: [ {} ] };
          UserHandler.users.userId.put(req, res);
          expect(res.status).toHaveBeenCalledWith(412);
          expect(res.send).toHaveBeenCalledWith('Invalid link inputs');
        });

        it('handles error saving user', function() {
          var user = {
            username: 'Matt',
            save: jasmine.createSpy().andCallFake(function(cb) {
              cb('Error', null);
            })
          };
          spyOn(User, 'findById').andCallFake(function(query, cb) {
            return cb(null, user);
          });
          req.params = { user_id: '123' };
          UserHandler.users.userId.put(req, res);
          expect(res.status).toHaveBeenCalledWith(501);
          expect(res.send).toHaveBeenCalledWith('Error');
        });

        it('updates and saves user', function() {
          var expectedUser = {
            about: 'foo',
            username: 'bar',
            defaultCategory: 'Ballet',
            picture: { url: 'blah', public_id: 'boo' }
          };

          var user = {
            username: 'Matt',
            save: jasmine.createSpy().andCallFake(function(cb) {
              cb(null, expectedUser);
            })
          };
          spyOn(User, 'findById').andCallFake(function(query, cb) {
            return cb(null, user);
          });
          req.params = { user_id: '123' };
          req.body = expectedUser;
          UserHandler.users.userId.put(req, res);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.send).toHaveBeenCalledWith(expectedUser);
        });
      });

      describe('delete: ', function() {
        it('deletes a given user', function() {
          spyOn(User, 'remove').andCallFake(function(query, cb) {
            return cb(null, { username: 'Matt' });
          });
          req.params = { user_id: '123' };
          UserHandler.users.userId.delete(req, res);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.send).toHaveBeenCalledWith({ username: 'Matt' });
        });

        it('handles deleting a user that is not found', function() {
          spyOn(User, 'remove').andCallFake(function(query, cb) {
            return cb(null, null);
          });
          req.params = { user_id: '123' };
          UserHandler.users.userId.delete(req, res);
          expect(res.status).toHaveBeenCalledWith(501);
          expect(res.send).toHaveBeenCalledWith('No user was found with id: 123');
        });

        it('handles an error finding the user', function() {
          spyOn(User, 'remove').andCallFake(function(query, cb) {
            return cb('Error', null);
          });
          req.params = { user_id: '123' };
          UserHandler.users.userId.delete(req, res);
          expect(res.status).toHaveBeenCalledWith(501);
          expect(res.send).toHaveBeenCalledWith('Error');
        });
      });

      describe('investorCategory: ', function() {
        describe('delete: ', function() {
          var categoryPromise;

          beforeEach(function() {
            categoryPromise = {
              category: {
                name: 'Coding',
                investors: 2,
                save: jasmine.createSpy().andReturn()
              },
              then: function(cb) {
                return cb(this.category);
              }
            };
            spyOn(Category, 'findByName').andReturn(categoryPromise);
          });

          it('handles an error finding the user', function() {
            spyOn(User, 'findById').andCallFake(function(query, cb) {
              return cb('Error', null);
            });
            req.params = { user_id: '123', category_name: 'Foo' };
            UserHandler.users.userId.investorCategory.delete(req, res);
            expect(res.status).toHaveBeenCalledWith(501);
            expect(res.send).toHaveBeenCalledWith('Error');
          });

          it('handles a null user', function() {
            spyOn(User, 'findById').andCallFake(function(query, cb) {
              return cb(null, null);
            });
            req.params = { user_id: '123' };
            UserHandler.users.userId.investorCategory.delete(req, res);
            expect(res.status).toHaveBeenCalledWith(501);
            expect(res.send).toHaveBeenCalledWith('No user found with id: 123');
          });

          it('handles when the user is not an investor for this category', function() {
            spyOn(User, 'findById').andCallFake(function(query, cb) {
              return cb(null, { username: 'Matt' });
            });
            spyOn(utils, 'isInvestor').andReturn(false);
            req.params = { user_id: '123' };
            UserHandler.users.userId.investorCategory.delete(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({username: 'Matt' });
          });

          it('handles an error undoing investor activity', function() {
            spyOn(User, 'findById').andCallFake(function(query, cb) {
              return cb(null, { username: 'Matt' });
            });
            spyOn(utils, 'isInvestor').andReturn(true);
            spyOn(utils, 'undoInvestorActivityForCategory').andCallFake(
              function(category, user, cb) {
                cb('Error', null);
              });
            req.params = { user_id: '123' };
            UserHandler.users.userId.investorCategory.delete(req, res);
            expect(res.status).toHaveBeenCalledWith(501);
            expect(res.send).toHaveBeenCalledWith('Error');
          });

          it('handles an error undoing the investor activity', function() {
            var user = {
              username: 'Matt',
              save: jasmine.createSpy().andCallFake(function(cb) {
                cb('Error', null);
              })
            };
            spyOn(User, 'findById').andCallFake(function(query, cb) {
              return cb(null, { username: 'Matt' });
            });
            spyOn(utils, 'isInvestor').andReturn(true);
            spyOn(utils, 'undoInvestorActivityForCategory').andCallFake(
              function(category, investor, cb) {
                cb('Error', null);
              });
            req.params = { user_id: '123', category_name: 'Foo' };
            UserHandler.users.userId.investorCategory.delete(req, res);
            expect(res.status).toHaveBeenCalledWith(501);
            expect(res.send).toHaveBeenCalledWith('Error');
          });

          it('handles error updating ranks and dividends', function() {
            var user = {
              username: 'Matt',
              save: jasmine.createSpy().andCallFake(function(cb) {
                cb(null, { username: 'Matt' });
              })
            };
            spyOn(User, 'findById').andCallFake(function(query, cb) {
              return cb(null, user);
            });
            spyOn(utils, 'isInvestor').andReturn(true);
            spyOn(utils, 'undoInvestorActivityForCategory').andCallFake(
              function(category, investor, cb) {
                cb(null, { username: 'Matt' });
              });
            spyOn(utils, 'updateAllRank').andCallFake(
              function(category, cb) {
                cb('Error');
              });
            req.params = { user_id: '123', categoryName: 'Foo' };
            UserHandler.users.userId.investorCategory.delete(req, res);
            expect(categoryPromise.category.investors).toEqual(1);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith('Error');
          });

          it('deletes the category and undoes investor activity', function() {
            var user = {
              username: 'Matt',
              save: jasmine.createSpy().andCallFake(function(cb) {
                cb(null, { username: 'Matt' });
              })
            };
            spyOn(User, 'findById').andCallFake(function(query, cb) {
              return cb(null, user);
            });
            spyOn(utils, 'isInvestor').andReturn(true);
            spyOn(utils, 'undoInvestorActivityForCategory').andCallFake(
              function(category, investor, cb) {
                cb(null, { username: 'Matt' });
              });
            spyOn(utils, 'updateAllRank').andCallFake(
              function(category, cb) {
                cb(null);
              });
            req.params = { user_id: '123', categoryName: 'Foo' };
            UserHandler.users.userId.investorCategory.delete(req, res);
            expect(categoryPromise.category.investors).toEqual(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({ username: 'Matt' });
          });
        });
      });

      describe('expertCategory: ', function() {
        describe('delete: ', function() {
          var categoryPromise;
          beforeEach(function() {
            categoryPromise = {
              category: {
                name: 'Coding',
                experts: 2,
                save: jasmine.createSpy().andReturn()
              },
              then: function(cb) {
                return cb(this.category);
              }
            };
            spyOn(Category, 'findByName').andReturn(categoryPromise);
          });

          it('handles an error finding the user', function() {
            spyOn(User, 'findById').andCallFake(function(query, cb) {
              return cb('Error', null);
            });
            req.params = { user_id: '123', category_name: 'Foo' };
            UserHandler.users.userId.expertCategory.delete(req, res);
            expect(res.status).toHaveBeenCalledWith(501);
            expect(res.send).toHaveBeenCalledWith('Error');
          });

          it('handles a null user', function() {
            spyOn(User, 'findById').andCallFake(function(query, cb) {
              return cb(null, null);
            });
            req.params = { user_id: '123' };
            UserHandler.users.userId.expertCategory.delete(req, res);
            expect(res.status).toHaveBeenCalledWith(501);
            expect(res.send).toHaveBeenCalledWith('No user found with id: 123');
          });

          it('handles when the user is not an expert for this category', function() {
            spyOn(User, 'findById').andCallFake(function(query, cb) {
              return cb(null, { username: 'Matt' });
            });
            spyOn(utils, 'isExpert').andReturn(false);
            req.params = { user_id: '123' };
            UserHandler.users.userId.expertCategory.delete(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({username: 'Matt' });
          });

          it('handles an error reimbursing investors', function() {
            spyOn(User, 'findById').andCallFake(function(query, cb) {
              return cb(null, { username: 'Matt' });
            });
            spyOn(utils, 'isExpert').andReturn(true);
            spyOn(utils, 'getInvestors').andReturn({});
            spyOn(utils, 'reimburseInvestors').andCallFake(
              function(investors, categoryName, userId, cb) {
                cb('Error');
              });
            req.params = { user_id: '123' };
            UserHandler.users.userId.expertCategory.delete(req, res);
            expect(res.status).toHaveBeenCalledWith(501);
            expect(res.send).toHaveBeenCalledWith('Error');
          });

          it('handles an error saving the user', function() {
            var user = {
              username: 'Matt',
              save: jasmine.createSpy().andCallFake(function(cb) {
                cb('Error', null);
              })
            };
            spyOn(User, 'findById').andCallFake(function(query, cb) {
              return cb(null, { username: 'Matt' });
            });
            spyOn(utils, 'isExpert').andReturn(true);
            spyOn(utils, 'getInvestors').andReturn({});
            spyOn(utils, 'reimburseInvestors').andCallFake(
              function(investors, categoryName, userId, cb) {
                cb(null);
              });
            spyOn(utils, 'deleteExpertCategory').andReturn(user);
            req.params = { user_id: '123', category_name: 'Foo' };
            UserHandler.users.userId.expertCategory.delete(req, res);
            expect(res.status).toHaveBeenCalledWith(501);
            expect(res.send).toHaveBeenCalledWith('Error');
          });

          it('handles error updating ranks', function() {
            var user = {
              username: 'Matt',
              save: jasmine.createSpy().andCallFake(function(cb) {
                cb(null, { username: 'Matt' });
              })
            };
            spyOn(User, 'findById').andCallFake(function(query, cb) {
              return cb(null, user);
            });
            spyOn(utils, 'isExpert').andReturn(true);
            spyOn(utils, 'getInvestors').andReturn({});
            spyOn(utils, 'reimburseInvestors').andCallFake(
              function(investors, categoryName, userId, cb) {
                cb(null);
              });
            spyOn(utils, 'deleteExpertCategory').andReturn(user);
            spyOn(utils, 'updateAllRank').andCallFake(
              function(category, cb) {
                cb('Error');
              });
            req.params = { user_id: '123', categoryName: 'Foo' };
            UserHandler.users.userId.expertCategory.delete(req, res);
            expect(categoryPromise.category.experts).toEqual(1);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith('Error');
          });

          it('deletes the category and saves user', function() {
            var user = {
              username: 'Matt',
              save: jasmine.createSpy().andCallFake(function(cb) {
                cb(null, { username: 'Matt' });
              })
            };
            spyOn(User, 'findById').andCallFake(function(query, cb) {
              return cb(null, user);
            });
            spyOn(utils, 'isExpert').andReturn(true);
            spyOn(utils, 'getInvestors').andReturn({});
            spyOn(utils, 'reimburseInvestors').andCallFake(
              function(investors, categoryName, userId, cb) {
                cb(null);
              });
            spyOn(utils, 'deleteExpertCategory').andReturn(user);
            spyOn(utils, 'updateAllRank').andCallFake(
              function(category, cb) {
                cb(null);
              });
            req.params = { user_id: '123', categoryName: 'Foo' };
            UserHandler.users.userId.expertCategory.delete(req, res);
            expect(categoryPromise.category.experts).toEqual(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({ username: 'Matt' });
          });
        });

      });
    });
  });
});
