import Application from '@ember/application';
import ActiveModelAdapter from 'active-model-adapter';
import ActiveModelSerializer from 'active-model-adapter/active-model-serializer';

export function initialize(application: Application): void {
  application.register('adapter:-active-model', ActiveModelAdapter);
  application.register('serializer:-active-model', ActiveModelSerializer);
}

export default {
  initialize
};
