import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import setupStore from '../helpers/setup-store';
import {module, test} from 'qunit';
import {ActiveModelAdapter, ActiveModelSerializer} from 'active-model-adapter';
import Ember from 'ember';

var get = Ember.get;
var HomePlanet, league, SuperVillain, EvilMinion, YellowMinion, DoomsdayDevice, MediocreVillain, env;
var run = Ember.run;

module("integration/active_model - ActiveModelSerializer", function(hooks) {
  hooks.beforeEach(function() {
    SuperVillain = Model.extend({
      firstName:     attr('string'),
      lastName:      attr('string'),
      homePlanet:    belongsTo('home-planet'),
      evilMinions:   hasMany('evil-minion')
    });
    HomePlanet = Model.extend({
      name:          attr('string'),
      superVillains: hasMany('super-villain', { async: true })
    });
    EvilMinion = Model.extend({
      superVillain: belongsTo('super-villain'),
      name:         attr('string')
    });
    YellowMinion = EvilMinion.extend();
    DoomsdayDevice = Model.extend({
      name:         attr('string'),
      evilMinion:   belongsTo('evil-minion', { polymorphic: true, async: false })
    });
    MediocreVillain = Model.extend({
      name:         attr('string'),
      evilMinions:  hasMany('evil-minion', { polymorphic: true })
    });
    env = setupStore({
      superVillain:   SuperVillain,
      homePlanet:     HomePlanet,
      evilMinion:     EvilMinion,
      yellowMinion:   YellowMinion,
      doomsdayDevice: DoomsdayDevice,
      mediocreVillain: MediocreVillain
    });
    env.store.modelFor('super-villain');
    env.store.modelFor('home-planet');
    env.store.modelFor('evil-minion');
    env.store.modelFor('yellow-minion');
    env.store.modelFor('doomsday-device');
    env.store.modelFor('mediocre-villain');
    env.registry.register('serializer:application', ActiveModelSerializer.extend({isNewSerializerAPI: true}));
    env.registry.register('serializer:-active-model', ActiveModelSerializer.extend({isNewSerializerAPI: true}));
    env.registry.register('adapter:-active-model', ActiveModelAdapter);
    env.registry.register('adapter:application', ActiveModelAdapter.extend({
      shouldBackgroundReloadRecord: () => false
    }));
    env.amsSerializer = env.container.lookup("serializer:-active-model");
    env.amsAdapter    = env.container.lookup("adapter:-active-model");
  });

  hooks.afterEach(function() {
    run(env.store, 'destroy');
  });

  test("serialize", function(assert) {
    var tom;
    run(function() {
      league = env.store.createRecord('home-planet', { name: "Villain League", id: "123" });
      tom           = env.store.createRecord('super-villain', { firstName: "Tom", lastName: "Dale", homePlanet: league });
    });

    var json = env.amsSerializer.serialize(tom._createSnapshot());

    assert.deepEqual(json, {
      first_name: "Tom",
      last_name: "Dale",
      home_planet_id: get(league, "id")
    });
  });

  test("serializeIntoHash", function(assert) {
    run(function() {
      league = env.store.createRecord('home-planet', { name: "Umber", id: "123" });
    });
    var json = {};

    env.amsSerializer.serializeIntoHash(json, HomePlanet, league._createSnapshot());

    assert.deepEqual(json, {
      home_planet: {
        name: "Umber"
      }
    });
  });

  test("serializeIntoHash with decamelized types", function(assert) {
    HomePlanet.modelName = 'home-planet';
    run(function() {
      league = env.store.createRecord('home-planet', { name: "Umber", id: "123" });
    });
    var json = {};

    env.amsSerializer.serializeIntoHash(json, HomePlanet, league._createSnapshot());

    assert.deepEqual(json, {
      home_planet: {
        name: "Umber"
      }
    });
  });


  test("normalize", function(assert) {
    SuperVillain.reopen({
      yellowMinion: belongsTo('yellowMinion')
    });

    var superVillain_hash = {
      id: "1",
      first_name: "Tom",
      last_name: "Dale",
      home_planet_id: "123",
      evil_minion_ids: [1, 2]
    };

    var json = env.amsSerializer.normalize(SuperVillain, superVillain_hash, "superVillain");

    assert.deepEqual(json, {
      "data": {
        "id": "1",
        "type": "super-villain",
        "attributes": {
          "firstName": "Tom",
          "lastName": "Dale"
        },
        "relationships": {
          "evilMinions": {
            "data": [
              { "id": "1", "type": "evil-minion" },
              { "id": "2", "type": "evil-minion" }
            ]
          },
          "homePlanet": {
            "data": { "id": "123", "type": "home-planet" }
          }
        }
      }
    });
  });

  test("normalize links", function(assert) {
    var home_planet = {
      id: "1",
      name: "Umber",
      links: { super_villains: "/api/super_villians/1" }
    };

    var json = env.amsSerializer.normalize(HomePlanet, home_planet, "homePlanet");

    assert.equal(json.data.relationships.superVillains.links.related, "/api/super_villians/1", "normalize links");
  });

  test("normalizeResponse", function(assert) {
    env.registry.register('adapter:superVillain', ActiveModelAdapter);

    var json_hash = {
      home_planet:   { id: "1", name: "Umber", super_villain_ids: [1] },
      super_villains:  [{
        id: "1",
        first_name: "Tom",
        last_name: "Dale",
        home_planet_id: "1"
      }]
    };

    var json;
    run(function() {
      json = env.amsSerializer.normalizeResponse(env.store, HomePlanet, json_hash, '1', 'findRecord');
    });

    assert.deepEqual(json, {
      "data": {
        "id": "1",
        "type": "home-planet",
        "attributes": {
          "name": "Umber"
        },
        "relationships": {
          "superVillains": {
            "data": [
              { "id": "1", "type": "super-villain" }
            ]
          }
        }
      },
      "included": [{
        "id": "1",
        "type": "super-villain",
        "attributes": {
          "firstName": "Tom",
          "lastName": "Dale"
        },
        "relationships": {
          "homePlanet": {
            "data": { "id": "1", "type": "home-planet" }
          }
        }
      }]
    });
  });

  test("normalizeResponse", function(assert) {
    env.registry.register('adapter:superVillain', ActiveModelAdapter);
    var array;

    var json_hash = {
      home_planets: [{ id: "1", name: "Umber", super_villain_ids: [1] }],
      super_villains: [{ id: "1", first_name: "Tom", last_name: "Dale", home_planet_id: "1" }]
    };

    run(function() {
      array = env.amsSerializer.normalizeResponse(env.store, HomePlanet, json_hash, null, 'findAll');
    });

    assert.deepEqual(array, {
      "data": [{
        "id": "1",
        "type": "home-planet",
        "attributes": {
          "name": "Umber"
        },
        "relationships": {
          "superVillains": {
            "data": [
              { "id": "1", "type": "super-villain" }
            ]
          }
        }
      }],
      "included": [{
        "id": "1",
        "type": "super-villain",
        "attributes": {
          "firstName": "Tom",
          "lastName": "Dale"
        },
        "relationships": {
          "homePlanet": {
            "data": { "id": "1", "type": "home-planet" }
          }
        }
      }]
    });
  });

  test("normalizeResponse - polymorphic with empty value for polymorphic relationship", (assert) => {
    let array;
    const payload = {
      doomsday_devices: [
        {
          id: 12,
          evil_minion: null
        }
      ]

    };

    run(function() {
      array = env.amsSerializer.normalizeResponse(env.store, DoomsdayDevice, payload, null, 'findAll');
    });

    run(() => env.store.push(array));

    return run(() => env.store.findRecord('doomsday-device', '12')).then((device) => {
      assert.equal(device.get('evilMinion'), null);
    });
  });

  test("serialize polymorphic", function(assert) {
    var tom, ray;
    run(function() {
      tom = env.store.createRecord('yellow-minion', { name: "Alex", id: "124" });
      ray = env.store.createRecord('doomsday-device', { evilMinion: tom, name: "DeathRay" });
    });

    var json = env.amsSerializer.serialize(ray._createSnapshot());

    assert.deepEqual(json, {
      name: "DeathRay",
      evil_minion_type: "YellowMinion",
      evil_minion_id: "124"
    });
  });

  test("serialize polymorphic when type key is not camelized", function(assert) {
    YellowMinion.modelName = 'yellow-minion';
    var tom, ray;
    run(function() {
      tom = env.store.createRecord('yellow-minion', { name: "Alex", id: "124" });
      ray = env.store.createRecord('doomsday-device', { evilMinion: tom, name: "DeathRay" });
    });

    var json = env.amsSerializer.serialize(ray._createSnapshot());

    assert.deepEqual(json["evil_minion_type"], "YellowMinion");
  });

  test("serialize polymorphic when associated object is null", function(assert) {
    var ray, json;
    run(function() {
      ray = env.store.createRecord('doomsday-device', { name: "DeathRay" });
      json = env.amsSerializer.serialize(ray._createSnapshot());
    });

    assert.deepEqual(json["evil_minion_type"], null);
  });

  test("extractPolymorphic hasMany", function(assert) {
    env.registry.register('adapter:yellowMinion', ActiveModelAdapter);
    MediocreVillain.toString   = function() { return "MediocreVillain"; };
    YellowMinion.toString = function() { return "YellowMinion"; };

    var json_hash = {
      mediocre_villain: { id: 1, name: "Dr Horrible", evil_minion_ids: [{ type: "yellow_minion", id: 12 }] },
      yellow_minions:    [{ id: 12, name: "Alex" }]
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
              { "id": "12", "type": "yellow-minion" }
            ]
          }
        }
      },
      "included": [{
        "id": "12",
        "type": "yellow-minion",
        "attributes": {
          "name": "Alex"
        },
        "relationships": {}
      }]
    });
  });

  test("extractPolymorphic belongsTo", function(assert) {
    env.registry.register('adapter:yellowMinion', ActiveModelAdapter);
    EvilMinion.toString   = function() { return "EvilMinion"; };
    YellowMinion.toString = function() { return "YellowMinion"; };

    var json_hash = {
      doomsday_device: { id: 1, name: "DeathRay", evil_minion_id: { type: "yellow_minion", id: 12 } },
      yellow_minions:    [{ id: 12, name: "Alex" }]
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
            "data": { "id": "12", "type": "yellow-minion" }
          }
        }
      },
      "included": [{
        "id": "12",
        "type": "yellow-minion",
        "attributes": {
          "name": "Alex"
        },
        "relationships": {}
      }]
    });
  });

  test("extractPolymorphic belongsTo (weird format)", function(assert) {
    env.registry.register('adapter:yellowMinion', ActiveModelAdapter);
    EvilMinion.toString   = function() { return "EvilMinion"; };
    YellowMinion.toString = function() { return "YellowMinion"; };

    var json_hash = {
      doomsday_device: {
        id: 1,
        name: "DeathRay",
        evil_minion_id: 12,
        evil_minion_type: "yellow_minion"
      },
      yellow_minions:    [{ id: 12, name: "Alex" }]
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
            "data": { "id": "12", "type": "yellow-minion" }
          }
        }
      },
      "included": [{
        "id": "12",
        "type": "yellow-minion",
        "attributes": {
          "name": "Alex"
        },
        "relationships": {}
      }]
    });
  });

  test("belongsTo (weird format) does not screw if there is a relationshipType attribute", function(assert) {
    env.registry.register('adapter:yellowMinion', ActiveModelAdapter);
    EvilMinion.toString   = function() { return "EvilMinion"; };
    YellowMinion.toString = function() { return "YellowMinion"; };
    DoomsdayDevice.reopen({
      evilMinionType: attr()
    });

    var json_hash = {
      doomsday_device: {
        id: 1,
        name: "DeathRay",
        evil_minion_id: {
          id: 12,
          type: 'yellow_minion'
        },
        evil_minion_type: "what a minion" },
      yellow_minions:    [{ id: 12, name: "Alex" }]
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
          "name": "DeathRay",
          "evilMinionType": "what a minion"
        },
        "relationships": {
          "evilMinion": {
            "data": { "id": "12", "type": "yellow-minion"  }
          }
        }
      },
      "included": [{
        "id": "12",
        "type": "yellow-minion",
        "attributes": {
          "name": "Alex"
        },
        "relationships": {}
      }]
    });
  });

  test("extractPolymorphic when the related data is not specified", function(assert) {
    var json = {
      doomsday_device: { id: 1, name: "DeathRay" },
      evil_minions:    [{ id: 12, name: "Alex" }]
    };

    run(function() {
      json = env.amsSerializer.normalizeResponse(env.store, DoomsdayDevice, json, '1', 'findRecord');
    });

    assert.deepEqual(json, {
      "data": {
        "id": "1",
        "type": "doomsday-device",
        "attributes": {
          "name": "DeathRay"
        },
        "relationships": {}
      },
      "included": [{
        "id": "12",
        "type": "evil-minion",
        "attributes": {
          "name": "Alex"
        },
        "relationships": {}
      }]
    });
  });

  test("extractPolymorphic hasMany when the related data is not specified", function(assert) {
    var json = {
      mediocre_villain: { id: 1, name: "Dr Horrible" }
    };

    run(function() {
      json = env.amsSerializer.normalizeResponse(env.store, MediocreVillain, json, '1', 'findRecord');
    });

    assert.deepEqual(json, {
      "data": {
        "id": "1",
        "type": "mediocre-villain",
        "attributes": {
          "name": "Dr Horrible"
        },
        "relationships": {}
      },
      "included": []
    });
  });

  test("extractPolymorphic does not break hasMany relationships", function(assert) {
    var json = {
      mediocre_villain: { id: 1, name: "Dr. Evil", evil_minion_ids: [] }
    };

    run(function () {
      json = env.amsSerializer.normalizeResponse(env.store, MediocreVillain, json, '1', 'findRecord');
    });

    assert.deepEqual(json, {
      "data": {
        "id": "1",
        "type": "mediocre-villain",
        "attributes": {
          "name": "Dr. Evil"
        },
        "relationships": {
          "evilMinions": {
            "data": []
          }
        }
      },
      "included": []
    });
  });

  test("extractErrors camelizes keys", function(assert) {
    var error = {
      errors: [
        {
          source: {
            pointer: 'data/attributes/first_name'
          },
          detail: "firstName not evil enough"
        }
      ]
    };

    var payload;

    run(function() {
      payload = env.amsSerializer.extractErrors(env.store, SuperVillain, error);
    });

    assert.deepEqual(payload, {
      firstName: ["firstName not evil enough"]
    });
  });

  test('supports the default format for polymorphic belongsTo', function(assert) {
    var payload = {
      doomsday_devices: [
        {
          id: 1,
          evil_minion: {
            id: 1,
            type: 'yellow_minion'
          }
        }
      ],
      yellow_minions: [
        {
          id: 1,
          name: 'Sally'
        }
      ]
    };
    var json, minion;

    run(() => {
      json = env.amsSerializer.normalizeResponse(env.store, DoomsdayDevice, payload, '1', 'findRecord');
      env.store.push(json);
      minion = env.store.findRecord('doomsday-device', 1);
    });

    assert.equal(minion.get('evilMinion.name'), 'Sally');
  });

  test('supports the default format for polymorphic hasMany', function(assert) {
    var payload = {
      mediocre_villain: {
        id: 1,
        evil_minions: [{
          id: 1,
          type: 'evil_minion'
        }]
      },
      evil_minions: [
        {
          id: 1,
          name: 'Harry'
        }
      ]
    };

    var json, villain;

    run(() => {
      json = env.amsSerializer.normalizeResponse(env.store, MediocreVillain, payload, '1', 'findRecord');
      env.store.push(json);
      villain = env.store.findRecord('mediocre-villain', '1');
    });

    assert.equal(villain.get('evilMinions.firstObject.name'), 'Harry');
  });

  test('when using the DS.EmbeddedRecordsMixin, does not erase attributes for polymorphic embedded models', (assert) => {

    env.registry.register('serializer:mediocre-villain', ActiveModelSerializer.extend(EmbeddedRecordsMixin, {
      isNewSerializerAPI: true,

      attrs: {
        evilMinions: {serialize: false, deserialize: 'records'}
      }
    }));

    const payload = {
      mediocre_villain: {
        id: 1,
        evil_minions: [{
          id: 1,
          type: 'evil_minion',
          name: 'tom dale'
        }]
      }
    };

    let villain;

    run(() => {
      let json = env.store.serializerFor('mediocre-villain').normalizeResponse(env.store, MediocreVillain, payload, '1', 'findRecord');
      env.store.push(json);
      villain = env.store.findRecord('mediocre-villain', '1');
    });

    assert.equal(villain.get('evilMinions.firstObject.name'), 'tom dale');
  });

  test('can have id-less belongsTo relationship', function (assert) {
    const payload = {
      super_villain: {
        id: 1,
        home_planet: 1
      },
      home_planets: [
        {
          id: 1,
          super_villains: [1]
        }
      ]
    };

    const villain = run(() => {
      const json = env.store.serializerFor('super-villain').normalizeResponse(env.store, SuperVillain, payload, '1', 'findRecord');
      env.store.push(json);
      return env.store.findRecord('super-villain', 1);
    });

    assert.equal(villain.get('homePlanet.id'), '1');
  });

  test('can have id-less belongsTo relationship', function (assert) {
    const payload = {
      home_planet: {
        id: 1,
        super_villains: [1]
      },
      super_villains: [
        {
          id: 1,
          home_planet: 1
        }
      ]
    };

    const homePlanet = run(() => {
      const json = env.store.serializerFor('home-planet').normalizeResponse(env.store, HomePlanet, payload, '1', 'findRecord');
      env.store.push(json);
      return env.store.findRecord('home-planet', 1);
    });

    return homePlanet.get('superVillains').then((superVillains) => {
      assert.deepEqual(superVillains.toArray().map(v => v.get('id')), ['1']);
    });
  });
});
