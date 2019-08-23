import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import setupStore from '../helpers/setup-store';

import Pretender from 'pretender';

import Model from 'ember-data/model';
import attr from 'ember-data/attr';

module('Integration | Active Model Serializer', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    let User = Model.extend({
      firstName: attr()
    });

    setupStore({
      owner: this.owner,
      models: [
        { modelClass: User, modelName: 'user' }
      ]
    });

    this.store = this.owner.lookup('service:store');

    this.pretender = new Pretender(function() {
      this.put('/users/1', function() {
        let errors = {
          errors: {
            first_name: ['firstName error']
          }
        };

        return [
          422,
          { 'Content-Type': 'application/json' },
          JSON.stringify(errors)
        ];
      });
    });
  });

  hooks.afterEach(function() {
    this.pretender.shutdown();
  });

  test('errors are camelCased and are expected under the `errors` property of the payload', async function(assert) {
    this.store.push({
      data: {
        type: 'user',
        id: 1,
      }
    });

    let user = this.store.peekRecord('user', 1);

    try {
      await user.save();
    } catch(err) {
      let { errors } = user;

      assert.ok(
        errors.has('firstName'),
        'there are errors for the firstName attribute'
      );

      assert.deepEqual(
        errors.errorsFor('firstName').getEach('message'),
        ['firstName error']
      );
    }
  });
});
