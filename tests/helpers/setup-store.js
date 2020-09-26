import Transform from '@ember-data/serializer/transform';
import RESTAdapter from '@ember-data/adapter/rest';
import RESTSerializer from '@ember-data/serializer/rest';
import JSONSerializer from '@ember-data/serializer/json';
import Adapter from '@ember-data/adapter';
import Store from '@ember-data/store';
import Ember from 'ember';
import DS from 'ember-data';
import ActiveModelAdapter from 'active-model-adapter';
import ActiveModelSerializer from 'active-model-adapter/active-model-serializer';

export default function setupStore(owner, options) {
  options = options || {};

  var env = {};

  var adapter = env.adapter = (options.adapter || '-default');
  delete options.adapter;

  if (typeof adapter !== 'string') {
    owner.register('adapter:-ember-data-test-custom', adapter);
    adapter = '-ember-data-test-custom';
  }

  for (var prop in options) {
    owner.register('model:' + Ember.String.dasherize(prop), options[prop]);
  }

  owner.register('store:main', Store.extend({
    adapter: adapter
  }));

  owner.register('adapter:-default', Adapter, { singleton: false });

  owner.register('serializer:-default', JSONSerializer, { singleton: false });
  owner.register('serializer:-rest', RESTSerializer, { singleton: false });
  owner.register('serializer:-rest-new', RESTSerializer.extend({ isNewSerializerAPI: true }));

  owner.register('adapter:-active-model', ActiveModelAdapter, { singleton: false });
  owner.register('serializer:-active-model', ActiveModelSerializer.extend({isNewSerializerAPI: true}));

  owner.register('adapter:-rest', RESTAdapter, { singleton: false });

  owner.inject('serializer', 'store', 'store:main');
  owner.register('transform:string', DS.StringTransform);
  owner.register('transform:number', DS.NumberTransform);
  owner.register('transform:date', DS.DateTransform);
  owner.register('transform:main', Transform);

  env.serializer = owner.lookup('serializer:-default');
  env.restSerializer = owner.lookup('serializer:-rest');
  env.restNewSerializer = owner.lookup('serializer:-rest-new');
  env.store = owner.lookup('store:main');
  env.adapter = env.store.get('defaultAdapter');

  return env;
}
