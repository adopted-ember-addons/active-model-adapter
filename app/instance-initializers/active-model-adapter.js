import ActiveModelAdapter from 'active-model-adapter';
import ActiveModelSerializer from 'active-model-adapter/active-model-serializer';

export default {
  name: 'active-model-adapter',
  initialize: function(applicationOrRegistry) {
    var register;
    if (applicationOrRegistry.register) {
      // initializeStoreService was called by an initializer instead of
      // an instanceInitializer. The first argument is a registry for
      // Ember pre 1.12, or an application instance for Ember >2.1.
      register = applicationOrRegistry.register.bind(applicationOrRegistry);
    } else {
      // initializeStoreService was registered with an
      // instanceInitializer. The first argument is the application
      // instance.
      register = applicationOrRegistry.registry.register.bind(applicationOrRegistry);
    }

    register('adapter:-active-model', ActiveModelAdapter);
    register('serializer:-active-model', ActiveModelSerializer);
  }
};
