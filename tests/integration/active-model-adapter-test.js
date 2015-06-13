import {module, test} from 'qunit';
import ActiveModelAdapter from 'active-model-adapter';
import ActiveModelSerializer from 'active-model-adapter/active-model-serializer';
import setupStore from '../helpers/setup-store';

var env, store, adapter, SuperUser;
var passedUrl, passedVerb, passedHash;

module("integration/active_model_adapter - AMS Adapter", {
  beforeEach: function() {
    SuperUser = DS.Model.extend();

    env = setupStore({
      superUser: SuperUser,
      adapter: ActiveModelAdapter
    });

    store = env.store;
    adapter = env.adapter;

    passedUrl = passedVerb = passedHash = null;
  }
});

test('buildURL - decamelizes names', function(assert) {
  assert.equal(adapter.buildURL('superUser', 1), "/super_users/1");
});

test('ajaxError - returns invalid error if 422 response', function(assert) {

  var jqXHR = {
    status: 422,
    responseText: JSON.stringify({ name: "can't be blank" })
  };

  assert.equal(adapter.ajaxError(jqXHR).errors.name, "can't be blank");
});

test('ajaxError - returns ajax response if not 422 response', function(assert) {
  var jqXHR = {
    status: 500,
    responseText: "Something went wrong"
  };

  assert.equal(adapter.ajaxError(jqXHR), jqXHR);
});
