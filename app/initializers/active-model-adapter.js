import ActiveModelAdapter from "active-model-adapter";
import ActiveModelSerializer from "active-model-adapter/active-model-serializer";

export default {
  name: 'active-model-adapter',
  initialize: function() {
    var application = arguments[1] || arguments[0];
    application.register('adapter:-active-model', ActiveModelAdapter);
    application.register('serializer:-active-model', ActiveModelSerializer.extend({ isNewSerializerAPI: true }));
  }
};
