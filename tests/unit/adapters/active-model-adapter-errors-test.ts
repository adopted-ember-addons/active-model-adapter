import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Pretender from 'pretender';
import { TestContext } from 'ember-test-helpers';

let pretender: Pretender;

import DS from 'ember-data';
import attr from 'ember-data/attr';
import ActiveModelAdapter from 'active-model-adapter';

class Book extends DS.Model {
  @attr('string') name!: string;
  @attr('string') genre!: string;
}

class ApplicationAdapter extends ActiveModelAdapter {}

module('Unit | Adapter | active model adapter errors test', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function(this: TestContext) {
    pretender = new Pretender(function() {});
    this.owner.register('adapter:application', ApplicationAdapter);
    this.owner.register('model:book', Book);
  });

  hooks.afterEach(function() {
    pretender.shutdown();
  })

  test('errors can be iterated once intercepted by the adapter', async function(this: TestContext, assert) {
    assert.expect(2);

    const store = this.owner.lookup('service:store');

    store.push({
      data: {
        type: 'book',
        id: '1',
        name: 'Bossypants',
        genre: 'Memoir'
      }
    });

    const post = store.peekRecord('book', 1);

    pretender.put('/books/1', function(_req) {
      const headers = {};
      const httpStatus = 422;
      const payload = {
        errors: {
          name: ['rejected'],
          genre: ['rejected']
        }
      };
      return [httpStatus, headers, JSON.stringify(payload)];
    });

    post.setProperties({
      name: 'Yes, Please',
      memoir: 'Comedy'
    });

    try {
      await post.save();
    } catch (e) {
      assert.equal(
        post.get('errors.name')[0].message,
        'rejected',
        'model.errors.attribute_name works'
      );
      assert.deepEqual(
        post.get('errors.messages'),
        ['rejected', 'rejected'],
        'errors.messages works'
      );
    }
  });
});
