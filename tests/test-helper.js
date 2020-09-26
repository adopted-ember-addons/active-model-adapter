import DS from 'ember-data';
import Application from 'dummy/app';
import config from 'dummy/config/environment';
import { setApplication } from '@ember/test-helpers';
import { start } from 'ember-qunit';

DS.ActiveModelAdapter = null;
DS.ActiveModelSerializer = null;

setApplication(Application.create(config.APP));

start();
