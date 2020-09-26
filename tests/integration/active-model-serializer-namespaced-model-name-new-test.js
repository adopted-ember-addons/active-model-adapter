import Model, { attr, hasMany, belongsTo } from '@ember-data/model';
import setupStore from '../helpers/setup-store';
import ActiveModelAdapter from 'active-model-adapter';
import ActiveModelSerializer from 'active-model-adapter/active-model-serializer';
import Ember from 'ember';

import {module, test} from 'qunit';

var SuperVillain, EvilMinion, YellowMinion, DoomsdayDevice, MediocreVillain, TestSerializer, env;
var run = Ember.run;

module("integration/active_model - AMS-namespaced-model-names (new API)", function(hooks) {
  hooks.beforeEach(function() {
    SuperVillain = Model.extend({
      firstName:     attr('string'),
      lastName:      attr('string'),
      evilMinions:   hasMany("evilMinion")
    });

    EvilMinion = Model.extend({
      superVillain: belongsTo('superVillain'),
      name:         attr('string')
    });
    YellowMinion = EvilMinion.extend();
    DoomsdayDevice = Model.extend({
      name:         attr('string'),
      evilMinion:   belongsTo('evilMinion', { polymorphic: true })
    });
    MediocreVillain = Model.extend({
      name:         attr('string'),
      evilMinions:  hasMany('evilMinion', { polymorphic: true })
    });
    TestSerializer = ActiveModelSerializer.extend({
      isNewSerializerAPI: true
    });
    env = setupStore({
      superVillain:   SuperVillain,
      evilMinion:     EvilMinion,
      'evilMinions/yellowMinion':   YellowMinion,
      doomsdayDevice: DoomsdayDevice,
      mediocreVillain: MediocreVillain
    });
    env.store.modelFor('superVillain');
    env.store.modelFor('evilMinion');
    env.store.modelFor('evilMinions/yellowMinion');
    env.store.modelFor('doomsdayDevice');
    env.store.modelFor('mediocreVillain');
    env.registry.register('serializer:application', TestSerializer);
    env.registry.register('serializer:-active-model', TestSerializer);
    env.registry.register('adapter:-active-model', TestSerializer);
    env.amsSerializer = env.container.lookup("serializer:-active-model");
    env.amsAdapter    = env.container.lookup("adapter:-active-model");
  });

  hooks.afterEach(function() {
    run(env.store, 'destroy');
  });

  if (Ember.FEATURES.isEnabled('ds-new-serializer-api')) {

    test("extractPolymorphic hasMany", function(assert) {
      var json_hash = {
        mediocre_villain: { id: 1, name: "Dr Horrible", evil_minion_ids: [{ type: "EvilMinions::YellowMinion", id: 12 }] },
        "evil-minions/yellow-minion":    [{ id: 12, name: "Alex", doomsday_device_ids: [1] }]
      };
      var json;

      run(function() {
        json = env.amsSerializer.normalizeResponse(env.store, MediocreVillain, json_hash, '1', 'find');
      });

      assert.deepEqual(json, {
        "data": {
          "id": "1",
          "type": "mediocre-villain",
          "attributes": {
            "name": "Dr Horrible"
          },
          "relationships": {
            "evilMinions": {
              "data": [
                { "id": "12", "type": "evil-minions/yellow-minion" }
              ]
            }
          }
        },
        "included": [{
          "id": "12",
          "type": "evil-minions/yellow-minion",
          "attributes": {
            "name": "Alex"
          },
          "relationships": {}
        }]
      });
    });

    test("extractPolymorphic belongsTo", function(assert) {
      var json_hash = {
        doomsday_device: { id: 1, name: "DeathRay", evil_minion_id: { type: "EvilMinions::YellowMinion", id: 12 } },
        "evil-minions/yellow-minion":    [{ id: 12, name: "Alex", doomsday_device_ids: [1] }]
      };
      var json;

      run(function() {
        json = env.amsSerializer.normalizeResponse(env.store, DoomsdayDevice, json_hash, '1', 'find');
      });

      assert.deepEqual(json, {
        "data": {
          "id": "1",
          "type": "doomsday-device",
          "attributes": {
            "name": "DeathRay"
          },
          "relationships": {
            "evilMinion": {
              "data": { "id": "12", "type": "evil-minions/yellow-minion" }
            }
          }
        },
        "included": [{
          "id": "12",
          "type": "evil-minions/yellow-minion",
          "attributes": {
            "name": "Alex"
          },
          "relationships": {}
        }]
      });
    });

  }
});
