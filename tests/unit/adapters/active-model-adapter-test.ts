import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { ActiveModelAdapter } from 'active-model-adapter';
import { TestContext } from 'ember-test-helpers';
import DS from 'ember-data';

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

  test('buildURL - decamelizes names', function(this: AdapterContext, assert) {
    assert.equal(this.adapter.buildURL('superUser', 1), '/super_users/1');
  });

  test('handleResponse - returns invalid error if 422 response', function(this: AdapterContext, assert) {
    var jqXHR = {
      status: 422,
      responseText: JSON.stringify({ errors: { name: "can't be blank" } })
    };

    // @ts-ignore parseErrorResponse is not documented via DefinitelyTyped yet
    var json = this.adapter.parseErrorResponse(jqXHR.responseText);

    var error = this.adapter.handleResponse(jqXHR.status, {}, json, {})
      .errors[0];

    assert.equal(error.detail, "can't be blank");
    assert.equal(error.source.pointer, '/data/attributes/name');
  });

  test('handleResponse - returns ajax response if not 422 response', function(this: AdapterContext, assert) {
    var jqXHR = {
      status: 500,
      responseText: 'Something went wrong'
    };

    var expectedRequestData = {
      method: 'GET',
      url: '/posts/1'
    };

    // @ts-ignore parseErrorResponse is not documented via DefinitelyTyped yet
    var json = this.adapter.parseErrorResponse(jqXHR.responseText);

    const responseType = this.adapter.handleResponse(
      jqXHR.status,
      {},
      json,
      expectedRequestData
    );

    assert.ok(
      responseType instanceof DS.AdapterError,
      'must be a DS.AdapterError'
    );
  });
});
