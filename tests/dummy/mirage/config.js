import { applyEmberDataSerializers, discoverEmberDataModels } from "ember-cli-mirage";
import { createServer } from 'miragejs';

export default function(config) {
  const finalConfig = {
    ...config,

    models: {
      ...discoverEmberDataModels(),
      ...config.models,
    },

    serializers: applyEmberDataSerializers(config.serializers),

    routes() {
      this.get('/cars');
    },
  };

  return createServer(finalConfig);
}
