import AdapterError from '@ember-data/adapter/error';
import Model from '@ember-data/model';
import setupStore from '../helpers/setup-store';
import {module, test} from 'qunit';
import ActiveModelAdapter from 'active-model-adapter';
import { setupTest } from 'ember-qunit';

var env, store, adapter, SuperUser;
var passedUrl, passedVerb, passedHash;

module("integration/active_model_adapter - AMS Adapter", function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    SuperUser = Model.extend();

    env = setupStore(this.owner, {
      superUser: SuperUser,
      adapter: ActiveModelAdapter
    });

    store = env.store;
    adapter = env.adapter;

    passedUrl = passedVerb = passedHash = null;
  });

  test('buildURL - decamelizes names', function(assert) {
    assert.equal(adapter.buildURL('superUser', 1), "/super_users/1");
  });

  test('handleResponse - returns invalid error if 422 response', function(assert) {

    var jqXHR = {
      status: 422,
      responseText: JSON.stringify({ errors: { name: "can't be blank" } })
    };

    var json = adapter.parseErrorResponse(jqXHR.responseText);

    var error = adapter.handleResponse(jqXHR.status, {}, json).errors[0];

    assert.equal(error.detail, "can't be blank");
    assert.equal(error.source.pointer, "/data/attributes/name");
  });

  test('handleResponse - returns ajax response if not 422 response', function(assert) {
    var jqXHR = {
      status: 500,
      responseText: "Something went wrong"
    };

    var expectedRequestData = {
      method: "GET",
      url:    "/posts/1"
    };

    var json = adapter.parseErrorResponse(jqXHR.responseText);

    assert.ok(adapter.handleResponse(jqXHR.status, {}, json, expectedRequestData) instanceof AdapterError, 'must be a DS.AdapterError');
  });
});
