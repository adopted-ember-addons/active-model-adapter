import Model, { attr } from '@ember-data/model';
var env, store, adapter, User;

import {module, test} from 'qunit';
var originalAjax;
import setupStore from '../helpers/setup-store';
import Ember from 'ember';
import ActiveModelAdapter from 'active-model-adapter';

module("integration/active_model_adapter_serializer - AMS Adapter and Serializer", function(hooks) {
  hooks.beforeEach(function() {
    originalAjax = Ember.$.ajax;

    User = Model.extend({
      firstName: attr()
    });

    env = setupStore({
      user: User,
      adapter: ActiveModelAdapter
    });

    store = env.store;
    adapter = env.adapter;

    env.registry.register('serializer:application', DS.ActiveModelSerializer);
  });

  hooks.afterEach(function() {
    Ember.$.ajax = originalAjax;
  });

  test('errors are camelCased and are expected under the `errors` property of the payload', function(assert) {
    var jqXHR = {
      status: 422,
      getAllResponseHeaders: function() { return ''; },
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
      store.push({
        data: {
          type: 'user',
          id: 1
        }
      });
      user = store.peekRecord('user', 1);
    });

    Ember.run(function() {
      user.save().then(null, function() {
        var errors = user.get('errors');
        assert.ok(errors.has('firstName'), "there are errors for the firstName attribute");
        assert.deepEqual(errors.errorsFor('firstName').getEach('message'), ['firstName error']);
      });
    });
  });
});
