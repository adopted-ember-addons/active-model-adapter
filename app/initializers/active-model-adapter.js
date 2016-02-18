import ActiveModelAdapter from "active-model-adapter";
import ActiveModelSerializer from "active-model-adapter/active-model-serializer";

export default {
  name: 'active-model-adapter',
  initialize: function(app) {
    if (arguments.length === 1) {
      // support the old registration API
      app.register('adapter:-active-model', ActiveModelAdapter);
      app.register('serializer:-active-model', ActiveModelSerializer);
    } else {
      let registry = app;
      registry.register('adapter:-active-model', ActiveModelAdapter);
      registry.register('serializer:-active-model', ActiveModelSerializer);
    }
  }
};
