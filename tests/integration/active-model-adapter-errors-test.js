import Model, { attr } from '@ember-data/model';
import Ember from 'ember';
import Pretender from 'pretender';
import {ActiveModelAdapter} from 'active-model-adapter';
import setupStore from '../helpers/setup-store';
import {module, test} from 'qunit';

const {run} = Ember;

const Book = Model.extend({
  name: attr(),
  genre: attr()
});

let pretender, store;

module('active-model-adapter-errors-test - Errors Integration test', function(hooks) {
  hooks.beforeEach(function() {
    pretender = new Pretender(function() {});
    store = run(() => {
      let env = setupStore({
        adapter: ActiveModelAdapter,
        book: Book
      });
      return env.store;
    });
  });

  hooks.afterEach(function() {
    run(store, 'destroy');
  });

  test('errors can be iterated once intercepted by the adapter', (assert) => {
    const post = run(() => {
      store.push({
        data: {
          type: 'book',
          id: '1',
          name: 'Bossypants',
          genre: 'Memoir'
        }
      });
      return store.peekRecord('book', 1);
    });

    pretender.put('/books/1', (req) => {
      const headers = {};
      const httpStatus = 422;
      const payload = {
        errors: {
          name: ['rejected'],
          genre: ['rejected']
        }
      };
      return [httpStatus, headers, payload];
    });

    return run(() => {
      post.setProperties({
        name: 'Yes, Please',
        memoir: 'Comedy'
      });

      return post.save().then(() => {
        assert.ok(false, 'post does not update correctly');
      }).catch( err => {
        assert.equal(post.get('errors.name')[0].message, 'rejected', 'model.errors.attribute_name works');
        assert.deepEqual(post.get('errors.messages'), ['rejected', 'rejected'], 'errors.messages works');
      });
    });
  });
});
