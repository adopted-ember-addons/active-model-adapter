import { EmberDataSerializer } from "ember-cli-mirage";

export default EmberDataSerializer.extend({
  serializeIds: 'always',
});
