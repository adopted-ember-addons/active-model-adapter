import Ember from 'ember';
import DS from 'ember-data';
import ActiveModelAdapter from 'active-model-adapter';
import ActiveModelSerializer from 'active-model-adapter/active-model-serializer';

export default function setupStore(options) {
  var container, registry;
  var env = {};
  options = options || {};

  if (Ember.Registry) {
    registry = env.registry = new Ember.Registry();
    container = env.container = registry.container();
  } else {
    container = env.container = new Ember.Container();
    registry = env.registry = container;
  }

  env.replaceContainerNormalize = function replaceContainerNormalize(fn) {
    if (env.registry) {
      env.registry.normalize = fn;
    } else {
      env.container.normalize = fn;
    }
  };

  var adapter = env.adapter = (options.adapter || '-default');
  delete options.adapter;

  if (typeof adapter !== 'string') {
    env.registry.register('adapter:-ember-data-test-custom', adapter);
    adapter = '-ember-data-test-custom';
  }

  for (var prop in options) {
    registry.register('model:' + Ember.String.dasherize(prop), options[prop]);
  }

  registry.register('store:main', DS.Store.extend({
    adapter: adapter
  }));

  registry.optionsForType('serializer', { singleton: false });
  registry.optionsForType('adapter', { singleton: false });
  registry.register('adapter:-default', DS.Adapter);

  registry.register('serializer:-default', DS.JSONSerializer);
  registry.register('serializer:-rest', DS.RESTSerializer);
  registry.register('serializer:-rest-new', DS.RESTSerializer.extend({ isNewSerializerAPI: true }));

  registry.register('adapter:-active-model', ActiveModelAdapter);
  registry.register('serializer:-active-model', ActiveModelSerializer);

  registry.register('adapter:-rest', DS.RESTAdapter);

  registry.injection('serializer', 'store', 'store:main');
  registry.register('transform:string', DS.StringTransform);
  registry.register('transform:number', DS.NumberTransform);
  registry.register('transform:date', DS.DateTransform);
  registry.register('transform:main', DS.Transform);

  env.serializer = container.lookup('serializer:-default');
  env.restSerializer = container.lookup('serializer:-rest');
  env.restNewSerializer = container.lookup('serializer:-rest-new');
  env.store = container.lookup('store:main');
  env.adapter = env.store.get('defaultAdapter');

  return env;
}
