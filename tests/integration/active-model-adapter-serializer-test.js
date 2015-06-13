import Ember from 'ember';
import ActiveModelAdapter from 'active-model-adapter';
import ActiveModelSerializer from 'active-model-adapter/active-model-serializer';
import setupStore from '../helpers/setup-store';

import {module, test} from 'qunit';

var env, store, adapter, User;
var originalAjax;


module("integration/active_model_adapter_serializer - AMS Adapter and Serializer", {
  beforeEach: function() {
    originalAjax = Ember.$.ajax;

    User = DS.Model.extend({
      firstName: DS.attr()
    });

    env = setupStore({
      user: User,
      adapter: '-active-model'
    });

    store = env.store;
    adapter = env.adapter;

    env.registry.register('serializer:application', ActiveModelSerializer);
  },

  afterEach: function() {
    Ember.$.ajax = originalAjax;
  }
});

test('errors are camelCased and are expected under the `errors` property of the payload', function(assert) {
  var jqXHR = {
    status: 422,
    responseText: JSON.stringify({
      errors: {
        first_name: ["firstName error"]
      }
    })
  };

  Ember.$.ajax = function(hash) {
    hash.error(jqXHR);
  };

  var user;
  Ember.run(function() {
    user = store.push('user', { id: 1 });
  });

  return Ember.run(function() {
    return user.save().catch(function() {
      var errors = user.get('errors');
      assert.ok(errors.has('firstName'), "there are errors for the firstName attribute");
      assert.deepEqual(errors.errorsFor('firstName').getEach('message'), ['firstName error']);
    });
  });
});
