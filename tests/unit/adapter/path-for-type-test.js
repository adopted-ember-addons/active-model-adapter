import setupStore from '../../helpers/setup-store';
import {module, test} from 'qunit';
import {ActiveModelAdapter} from 'active-model-adapter';
import { setupTest } from 'ember-qunit';

var env, adapter;

module("unit/adapter/path_for_type - DS.ActiveModelAdapter#pathForType", function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    env = setupStore(this.owner, {
      adapter: ActiveModelAdapter
    });

    adapter = env.adapter;
  });

  test('pathForType - works with camelized types', function(assert) {
    assert.equal(adapter.pathForType('superUser'), "super_users");
  });

  test('pathForType - works with dasherized types', function(assert) {
    assert.equal(adapter.pathForType('super-user'), "super_users");
  });

  test('pathForType - works with underscored types', function(assert) {
    assert.equal(adapter.pathForType('super_user'), "super_users");
  });
});
