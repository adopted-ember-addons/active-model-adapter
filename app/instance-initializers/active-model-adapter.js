import ActiveModelAdapter from 'active-model-adapter';
import ActiveModelSerializer from 'active-model-adapter/active-model-serializer';

export default {
  name: 'active-model-adapter',
  initialize: function(applicationOrRegistry) {
    var registry, container;
    if (applicationOrRegistry.registry && applicationOrRegistry.container) {
      // initializeStoreService was registered with an
      // instanceInitializer. The first argument is the application
      // instance.
      registry = applicationOrRegistry.registry;
      container = applicationOrRegistry.container;
    } else {
      // initializeStoreService was called by an initializer instead of
      // an instanceInitializer. The first argument is a registy. This
      // case allows ED to support Ember pre 1.12
      registry = applicationOrRegistry;
      if (registry.container) { // Support Ember 1.10 - 1.11
        container = registry.container();
      } else { // Support Ember 1.9
        container = registry;
      }
    }

    registry.register('adapter:-active-model', ActiveModelAdapter);
    registry.register('serializer:-active-model', ActiveModelSerializer.extend({ isNewSerializerAPI: true }));
  }
};
