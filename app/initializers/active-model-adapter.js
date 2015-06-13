import ActiveModelAdapter from "active-model-adapter";
import ActiveModelSerializer from "active-model-adapter/active-model-serializer";

export default {
  name: 'active-model-adapter',
  initialize: function(registry, application) {
    registry.register('adapter:-active-model', ActiveModelAdapter);
    registry.register('serializer:-active-model', ActiveModelSerializer);
  }
};
