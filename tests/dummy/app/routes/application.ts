import Route from '@ember/routing/route';
import DS from 'ember-data';
import type Car from 'dummy/models/car';

export default class Application extends Route {
  model(): DS.PromiseArray<Car> {
    return this.store.findAll('car');
  }
}
