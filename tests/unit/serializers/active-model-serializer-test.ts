import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import ActiveModelAdapter from 'active-model-adapter';
import { TestContext } from 'ember-test-helpers';
import DS from 'ember-data';
import attr from 'ember-data/attr';
import Pretender from 'pretender';
import Store from 'ember-data/store';

class ApplicationAdapter extends ActiveModelAdapter {}
class User extends DS.Model {
  @attr('string') firstName!: string;
}

let pretender: Pretender;
module('Unit | Serializer | active model serializer', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function(this: TestContext) {
    this.owner.register('adapter:application', ApplicationAdapter);
    this.owner.register('model:user', User);
    pretender = new Pretender();
  });

  hooks.afterEach(function() {
    pretender.shutdown();
  });

  test('errors are camelCased and are expected under the `errors` property of the payload', async function(assert) {
    const store: Store = this.owner.lookup('service:store');
    store.push({
      data: {
        type: 'user',
        id: 1
      }
    });
    const user = store.peekRecord('user', 1);

    pretender.put('/users/1', function(_req) {
      const response = {
        errors: {
          first_name: ['firstName error']
        }
      };
      return [422, {}, JSON.stringify(response)];
    });

    try {
      await user.save();
    } catch (error) {
      assert.ok(
        user.get('errors').length === 1,
        'there are errors for the firstName attribute'
      );
      assert.deepEqual(user.get('errors.messages'), ['firstName error']);
    }
  });
});
