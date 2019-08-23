import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import setupStore from '../helpers/setup-store';

import Pretender from 'pretender';

import Model from 'ember-data/model';
import attr from 'ember-data/attr';

module('Integration | Active Model Adapter Errors', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    let Book = Model.extend({
      name: attr(),
      genre: attr()
    });

    setupStore({
      owner: this.owner,
      models: [
        { modelClass: Book, modelName: 'book' }
      ]
    });

    this.store = this.owner.lookup('service:store');

    this.pretender = new Pretender(function() {
      this.put('/books/1', function() {
        let payload = {
          errors: {
            name: ['rejected'],
            genre: ['rejected']
          }
        };

        return [
          422,
          { 'Content-Type': 'application/json' },
          JSON.stringify(payload)
        ];
      });
    });
  });

  hooks.afterEach(function() {
    this.pretender.shutdown();
  });

  test('errors can be iterated once intercepted by the adapter', async function(assert) {
    this.store.push({
      data: {
        type: 'book',
        id: '1',
        name: 'Bossypants',
        genre: 'Memoir'
      }
    });

    let book = this.store.peekRecord('book', 1);

    book.setProperties({
      name: 'Yes, Please',
      memoir: 'Comedy'
    });

    try {
      await book.save();

      assert.ok(false, 'post does not update correctly');
    } catch(err) {
      assert.equal(
        book.get('errors.name')[0].message,
        'rejected',
        'model.errors.attribute_name works'
      );

      assert.deepEqual(
        book.get('errors.messages'),
        ['rejected', 'rejected'],
        'errors.messages works'
      );
    }
  });
});
