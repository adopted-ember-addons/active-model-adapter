import { ActiveModelAdapter, ActiveModelSerializer } from 'active-model-adapter';

export default function setupStore({ owner, models=[] }) {
  owner.register('adapter:application', ActiveModelAdapter.extend());

  owner.register('serializer:application', ActiveModelSerializer.extend());

  let store = owner.lookup('service:store');

  models.forEach(function({ modelName, modelClass }) {
    owner.register(`model:${modelName}`, modelClass);

    // Initializes `modelName` attribute on the model class
    store.modelFor(modelName);
  });
}
