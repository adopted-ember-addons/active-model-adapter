import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import setupStore from '../../helpers/setup-store';

import DS from 'ember-data';

module('Unit | Adapter | active model adapter', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    setupStore({ owner: this.owner });

    this.adapter = this.owner.lookup('adapter:application');
  });

  module('#pathForType', function() {
    test('works with camelized types', function(assert) {
      assert.equal(this.adapter.pathForType('superUser'), 'super_users');
    });

    test('works with dasherized types', function(assert) {
      assert.equal(this.adapter.pathForType('super-user'), 'super_users');
    });

    test('works with underscored types', function(assert) {
      assert.equal(this.adapter.pathForType('super_user'), 'super_users');
    });
  });

  module('#buildURL', function() {
    test('decamelizes names', function(assert) {
      assert.equal(this.adapter.buildURL('superUser', 1), '/super_users/1');
    });
  });

  module('#handleResponse', function() {
    test('returns invalid error if 422 response', function(assert) {
      let jqXHR = {
        status: 422,
        responseText: JSON.stringify({ errors: { name: "can't be blank" } })
      };
    
      let json = this.adapter.parseErrorResponse(jqXHR.responseText);
    
      let error = this.adapter.handleResponse(jqXHR.status, {}, json).errors[0];
    
      assert.equal(error.detail, "can't be blank");
      assert.equal(error.source.pointer, '/data/attributes/name');
    });

    test('returns ajax response if not 422 response', function(assert) {
      let jqXHR = {
        status: 500,
        responseText: 'Something went wrong'
      };
    
      let expectedRequestData = {
        method: 'GET',
        url: '/posts/1'
      };
    
      let json = this.adapter.parseErrorResponse(jqXHR.responseText);
    
      assert.ok(this.adapter.handleResponse(jqXHR.status, {}, json, expectedRequestData) instanceof DS.AdapterError, 'must be an AdapterError');
    });
  });
});
