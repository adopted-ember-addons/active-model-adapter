// eslint-disable-next-line
import Store from '@ember-data/store'; // @ts-ignore
import ModelRegistry from 'ember-data/types/registries/model';

export default Store;

export function normalizeModelName<K extends keyof ModelRegistry>(
  modelName: string
): K;
