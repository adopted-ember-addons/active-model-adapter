import type Application from '@ember/application';
import { ActiveModelAdapter, ActiveModelSerializer } from 'active-model-adapter';

export function initialize(application: Application): void {
  application.register('adapter:-active-model', ActiveModelAdapter);
  application.register('serializer:-active-model', ActiveModelSerializer);
}

export default {
  initialize,
};
