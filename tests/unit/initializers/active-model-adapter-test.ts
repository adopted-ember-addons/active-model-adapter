import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { ActiveModelAdapter } from 'active-model-adapter';
import { TestContext } from 'ember-test-helpers';

type AdapterContext = TestContext & { adapter: ActiveModelAdapter };

module('Unit | Initializer | active-model-adapter', function(hooks) {
  setupTest(hooks);
  hooks.beforeEach(function(this: AdapterContext) {
    this.adapter = ActiveModelAdapter.create();
  });

  test('pathForType - works with camelized types', function(this: AdapterContext, assert) {
    assert.equal(this.adapter.pathForType('superUser'), 'super_users');
  });

  test('pathForType - works with dasherized types', function(this: AdapterContext, assert) {
    assert.equal(this.adapter.pathForType('super-user'), 'super_users');
  });

  test('pathForType - works with underscored types', function(this: AdapterContext, assert) {
    assert.equal(this.adapter.pathForType('super_user'), 'super_users');
  });
});
