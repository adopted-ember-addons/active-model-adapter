import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Pretender from 'pretender';
import { TestContext } from 'ember-test-helpers';

let pretender: Pretender;

import Model, { attr } from '@ember-data/model';
import ActiveModelAdapter, {
  ActiveModelSerializer,
} from 'active-model-adapter';
import { AdapterError } from 'ember-data/adapters/errors';

class Book extends Model {
  @attr('string')
  declare name?: string;

  @attr('string')
  declare genre?: string;
}

class ApplicationAdapter extends ActiveModelAdapter {}
class ApplicationSerializer extends ActiveModelSerializer {}

module('Unit | Adapter | active model adapter errors test', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function (this: TestContext) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    pretender = new Pretender(function () {});
    this.owner.register('adapter:application', ApplicationAdapter);
    this.owner.register('serializer:application', ApplicationSerializer);
    this.owner.register('model:book', Book);
  });

  hooks.afterEach(function () {
    pretender.shutdown();
  });

  test('errors can be iterated once intercepted by the adapter', async function (this: TestContext, assert) {
    assert.expect(3);

    const store = this.owner.lookup('service:store');

    store.push({
      data: {
        type: 'book',
        id: '1',
        name: 'Bossypants',
        genre: 'Memoir',
      },
    });

    const post = store.peekRecord('book', 1);

    pretender.put('/books/1', function () {
      const headers = {};
      const httpStatus = 422;
      const payload = {
        errors: {
          name: ['rejected'],
          genre: ['rejected'],
        },
      };
      return [httpStatus, headers, JSON.stringify(payload)];
    });

    post.setProperties({
      name: 'Yes, Please',
      memoir: 'Comedy',
    });

    try {
      await post.save();
    } catch (e) {
      assert.ok(e instanceof AdapterError);

      assert.equal(
        post.errors.errorsFor('name')[0].message,
        'rejected',
        'model.errors.attribute_name works'
      );
      assert.deepEqual(
        post.errors.messages,
        ['rejected', 'rejected'],
        'errors.messages works'
      );
    }
  });
});
