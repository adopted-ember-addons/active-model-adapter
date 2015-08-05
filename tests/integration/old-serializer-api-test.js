import Ember from 'ember';
import DS from 'ember-data';
import ActiveModelAdapter, {ActiveModelSerializer} from 'active-model-adapter';
import {module, test} from 'qunit';
import Pretender from 'pretender';
import setupStore from '../helpers/setup-store';

const {attr, hasMany} = DS;
const {run} = Ember;

Pretender.prototype.prepareBody = (body) => JSON.stringify(body);

let pretender, Book, Author, env, store;

module(`ActiveModelAdapter, full stack integration tests for old serializer api`, {
  beforeEach() {
    Book = DS.Model.extend({
      title: attr(),
      authors: hasMany('user', { polymorphic: true })
    });
    Author = DS.Model.extend({});
    pretender = new Pretender(function(){ });
    env = setupStore({
      book: Book,
      author: Author,
      adapter: ActiveModelAdapter
    });

    env.registry.register('serializer:-active-model', ActiveModelSerializer.extend({isNewSerializerAPI: false}));
    store = env.store;
  }
});

// From upstream Ember Data issue: https://github.com/emberjs/data/issues/3630
test(`does not assert if the payload key is missing for a polymorophic relationship`, (assert) => {
  assert.expect(1);

  pretender.get('/books/:id', (req) => {
    let payload = {
      books: [
        { id: 1, title: 'Tom Sawyer'}
      ],
      authors:[
        { id: 1, name: "Mark Twain", book_ids: [1] }
      ]
    };
    let headers = {};

    return [200, headers, payload];
  });

  return run(() => {
    return store.find('book', '1').then((book) => {
      assert.equal(book.get('title'), 'Tom Sawyer');
    }).catch((error) => {
      assert.ok(false, `Got error: ${error.message}`);
    });
  });
});
