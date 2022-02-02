import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import DS from 'ember-data';
import type Car from 'dummy/models/car';
import type Store from 'ember-data/store';

export default class Application extends Route {
  @service('store') declare store: Store;

  model(): DS.PromiseArray<Car> {
    return this.store.findAll('car');
  }
}
