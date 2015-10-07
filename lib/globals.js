// this file is used to generate the globals build.
// DO NOT try to use this in your app.

import {ActiveModelSerializer, ActiveModelAdapter} from './index';
import initializer from 'initializers/active-model-adapter';
import Ember from 'ember';
import DS from 'ember-data';

DS.ActiveModelAdapter    = ActiveModelAdapter;
DS.ActiveModelSerializer = ActiveModelSerializer;

Ember.Application.initializer(initializer);
