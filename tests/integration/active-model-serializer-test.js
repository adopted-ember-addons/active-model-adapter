import setupStore from '../helpers/setup-store';
import {module, test} from 'qunit';
import {ActiveModelAdapter, ActiveModelSerializer} from 'active-model-adapter';
import Ember from 'ember';

var get = Ember.get;
var HomePlanet, league, SuperVillain, EvilMinion, YellowMinion, DoomsdayDevice, MediocreVillain, SlipperyVillain, env;
var run = Ember.run;

module("integration/active_model - ActiveModelSerializer", {
  beforeEach: function() {
    SuperVillain = DS.Model.extend({
      firstName:     DS.attr('string'),
      lastName:      DS.attr('string'),
      homePlanet:    DS.belongsTo('home-planet'),
      evilMinions:   DS.hasMany('evil-minion')
    });
    HomePlanet = DS.Model.extend({
      name:          DS.attr('string'),
      superVillains: DS.hasMany('super-villain', { async: true })
    });
    EvilMinion = DS.Model.extend({
      superVillain: DS.belongsTo('super-villain'),
      name:         DS.attr('string')
    });
    YellowMinion = EvilMinion.extend();
    DoomsdayDevice = DS.Model.extend({
      name:         DS.attr('string'),
      evilMinion:   DS.belongsTo('evil-minion', { polymorphic: true, async: false })
    });
    MediocreVillain = DS.Model.extend({
      name:         DS.attr('string'),
      evilMinions:  DS.hasMany('evil-minion', { polymorphic: true })
    });
    SlipperyVillain = DS.Model.extend({
      firstName:    DS.attr('string'),
      lastName:     DS.attr('string'),
      homePlanet:   DS.attr('string')
    });
    env = setupStore({
      superVillain:   SuperVillain,
      homePlanet:     HomePlanet,
      evilMinion:     EvilMinion,
      yellowMinion:   YellowMinion,
      doomsdayDevice: DoomsdayDevice,
      mediocreVillain: MediocreVillain,
      slipperyVillain: SlipperyVillain
    });
    env.store.modelFor('super-villain');
    env.store.modelFor('home-planet');
    env.store.modelFor('evil-minion');
    env.store.modelFor('yellow-minion');
    env.store.modelFor('doomsday-device');
    env.store.modelFor('mediocre-villain');
    env.store.modelFor('slippery-villain');
    env.registry.register('serializer:application', ActiveModelSerializer.extend({isNewSerializerAPI: true}));
    env.registry.register('serializer:-active-model', ActiveModelSerializer.extend({isNewSerializerAPI: true}));
    env.registry.register('serializer:slippery-villain', ActiveModelSerializer.extend({isNewSerializerAPI: true, attrs: { firstName: '_first_name_', lastName: '_last_name_' }}));
    env.registry.register('adapter:-active-model', ActiveModelAdapter);
    env.registry.register('adapter:application', ActiveModelAdapter.extend({
      shouldBackgroundReloadRecord: () => false
    }));
    env.amsSerializer = env.container.lookup("serializer:-active-model");
    env.amsAdapter    = env.container.lookup("adapter:-active-model");
    env.amsSlipperyVillianSerializer = env.container.lookup("serializer:slippery-villain");
  },

  afterEach: function() {
    run(env.store, 'destroy');
  }
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
    yellowMinion: DS.belongsTo('yellowMinion')
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
    evilMinionType: DS.attr()
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

test('supports mapping keys by attrs hash', function(assert) {
  var payload = {
    slippery_villain: {
      id: 1,
      _first_name_: 'Vladislaus',
      _last_name_: 'Dracula',
      home_planet: 'Earth'
    }
  };

  var json, villain;

  run(() => {
    json = env.amsSlipperyVillianSerializer.normalizeResponse(env.store, SlipperyVillain, payload, '1', 'findRecord');
    env.store.push(json);
    villain = env.store.findRecord('slippery-villain', '1');
  });

  assert.equal(villain.get('firstName'), 'Vladislaus');
  assert.equal(villain.get('lastName'), 'Dracula');
});
