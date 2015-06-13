import resolver from './helpers/resolver';
import DS from 'ember-data';
import {
  setResolver
} from 'ember-qunit';

delete DS.ActiveModelAdapter;
delete DS.ActiveModelSerializer;

setResolver(resolver);
