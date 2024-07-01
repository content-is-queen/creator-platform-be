/* eslint-disable no-prototype-builtins */
const assert = require('assert');
const admin = require('firebase-admin');
// const { Util } = require('../../helper/utils');
// const { AdminController } = require('../../controllers/adminController');
const { describe, beforeEach, it } = require('mocha');
const { Util } = require('../helper/utils');
const { AdminController } = require('../restful/controllers/adminController');

describe('AdminController', () => {
  let req, res, util;

  beforeEach(() => {
    req = {
      body: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: 'admin',
        password: 'password123'
      },
      params: {
        userId: 'someUserId'
      }
    };
    
    res = {
      status: function (statusCode) {
        this.statusCode = statusCode;
        return this;
      },
      json: function (data) {
        this.data = data;
        return this;
      },
      send: function (data) {
        this.data = data;
        return this;
      }
    };

    util = new Util();
  });

  describe('adminCreateUser', () => {
    it('should create a new user and set custom claims', async () => {
      const createUserStub = (user) => {
        return Promise.resolve({ uid: 'newUserId' });
      };

      const setCustomUserClaimsStub = (uid, claims) => {
        return Promise.resolve();
      };

      const collectionStub = () => ({
        doc: () => ({
          set: () => Promise.resolve()
        })
      });

      admin.auth = () => ({
        createUser: createUserStub,
        setCustomUserClaims: setCustomUserClaimsStub
      });

      admin.firestore = () => ({
        collection: collectionStub
      });

      await AdminController.adminCreateUser(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(res.data, {
        status: 200,
        message: 'User created successfully!'
      });
    });

    it('should handle errors and return a server error response', async () => {
      const createUserStub = (user) => {
        return Promise.reject(new Error('Create user failed'));
      };

      admin.auth = () => ({
        createUser: createUserStub
      });

      await AdminController.adminCreateUser(req, res);

      assert.strictEqual(res.statusCode, 500);
      assert.deepStrictEqual(res.data, {
        status: 500,
        message: 'Create user failed'
      });
    });
  });

  describe('adminActivateUser', () => {
    it('should activate a user successfully', async () => {
      const updateUserStub = (userId, updates) => {
        return Promise.resolve();
      };

      const collectionStub = () => ({
        doc: () => ({
          set: () => Promise.resolve()
        })
      });

      admin.auth = () => ({
        updateUser: updateUserStub
      });

      admin.firestore = () => ({
        collection: collectionStub
      });

      await AdminController.adminActivateUser(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(res.data, {
        status: 200,
        message: 'User activated successfully!'
      });
    });

    it('should handle errors and return a server error response', async () => {
      const updateUserStub = (userId, updates) => {
        return Promise.reject(new Error('Activate user failed'));
      };

      admin.auth = () => ({
        updateUser: updateUserStub
      });

      await AdminController.adminActivateUser(req, res);

      assert.strictEqual(res.statusCode, 500);
      assert.deepStrictEqual(res.data, {
        status: 500,
        message: 'Activate user failed'
      });
    });
  });
});
