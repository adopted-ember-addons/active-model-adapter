import Model, { attr, hasMany, belongsTo } from '@ember-data/model';
import setupStore from '../helpers/setup-store';
import {module, test} from 'qunit';
import {ActiveModelAdapter, ActiveModelSerializer} from 'active-model-adapter';
import Ember from 'ember';

var SuperVillain, EvilMinion, YellowMinion, DoomsdayDevice, MediocreVillain, env;
const {run} = Ember;


module("integration/active_model - AMS-namespaced-model-names", function(hooks) {
  hooks.beforeEach(function() {
    SuperVillain = Model.extend({
      firstName:     attr('string'),
      lastName:      attr('string'),
      evilMinions:   hasMany('evil-minion')
    });

    EvilMinion = Model.extend({
      superVillain: belongsTo('super-villain'),
      name:         attr('string')
    });
    YellowMinion = EvilMinion.extend();
    DoomsdayDevice = Model.extend({
      name:         attr('string'),
      evilMinion:   belongsTo('evil-minion', { polymorphic: true })
    });
    MediocreVillain = Model.extend({
      name:         attr('string'),
      evilMinions:  hasMany('evil-minion', { polymorphic: true })
    });
    env = setupStore({
      superVillain:   SuperVillain,
      evilMinion:     EvilMinion,
      'evilMinions/yellowMinion':   YellowMinion,
      doomsdayDevice: DoomsdayDevice,
      mediocreVillain: MediocreVillain,
      yellowMinion: YellowMinion
    });
    env.store.modelFor('super-villain');
    env.store.modelFor('evil-minion');
    env.store.modelFor('evil-minions/yellow-minion');
    env.store.modelFor('doomsday-device');
    env.store.modelFor('mediocre-villain');
    env.registry.register('serializer:application', ActiveModelSerializer.extend({isNewSerializerAPI: true}));
    env.registry.register('serializer:-active-model', ActiveModelSerializer.extend({isNewSerializerAPI: true}));
    env.registry.register('adapter:-active-model', ActiveModelAdapter);
    env.amsSerializer = env.container.lookup("serializer:-active-model");
    env.amsAdapter    = env.container.lookup("adapter:-active-model");
  });

  hooks.afterEach(function() {
    run(env.store, 'destroy');
  });

  test("serialize polymorphic", function(assert) {
    var tom, ray;
    run(function() {
      tom = env.store.createRecord('evil-minions/yellow-minion', { name: "Alex", id: "124" });
      ray = env.store.createRecord('doomsday-device', { evilMinion: tom, name: "DeathRay" });
    });

    var json = env.amsSerializer.serialize(ray._createSnapshot());

    assert.deepEqual(json, {
      name: "DeathRay",
      evil_minion_type: "EvilMinions::YellowMinion",
      evil_minion_id: "124"
    });
  });

  test("serialize polymorphic when type key is not camelized", function(assert) {
    YellowMinion.modelName = 'evil-minions/yellow-minion';
    var tom, ray;
    run(function() {
      tom = env.store.createRecord('yellow-minion', { name: "Alex", id: "124" });
      ray = env.store.createRecord('doomsday-device', { evilMinion: tom, name: "DeathRay" });
    });

    var json = env.amsSerializer.serialize(ray._createSnapshot());

    assert.deepEqual(json["evil_minion_type"], "EvilMinions::YellowMinion");
  });

  test("extractPolymorphic hasMany", function(assert) {
    var json_hash = {
      mediocre_villain: { id: 1, name: "Dr Horrible", evil_minion_ids: [{ type: "EvilMinions::YellowMinion", id: 12 }] },
      "evil-minions/yellow-minion":    [{ id: 12, name: "Alex", doomsday_device_ids: [1] }]
    };
    var json;

    run(function() {
      json = env.amsSerializer.normalizeResponse(env.store, MediocreVillain, json_hash, '1', 'findRecord');
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
      json = env.amsSerializer.normalizeResponse(env.store, DoomsdayDevice, json_hash, '1', 'findRecord');
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
});
