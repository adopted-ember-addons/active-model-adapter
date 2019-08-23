import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import setupStore from '../helpers/setup-store';

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo, hasMany } from 'ember-data/relationships';
import EmbeddedRecordsMixin from 'ember-data/serializers/embedded-records-mixin';

import { ActiveModelSerializer } from 'active-model-adapter';

let SuperVillain, HomePlanet, EvilMinion, YellowMinion, DoomsdayDevice, MediocreVillain, Layer;

module('Integration | Active Model Serializer', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    SuperVillain = Model.extend({
      firstName: attr('string'),
      lastName: attr('string'),
      homePlanet: belongsTo('home-planet'),
      evilMinions: hasMany('evil-minion')
    });

    HomePlanet = Model.extend({
      name: attr('string'),
      superVillains: hasMany('super-villain', { async: true })
    });

    EvilMinion = Model.extend({
      superVillain: belongsTo('super-villain'),
      name: attr('string')
    });

    YellowMinion = EvilMinion.extend();

    DoomsdayDevice = Model.extend({
      name: attr('string'),
      evilMinion: belongsTo('evil-minion', { polymorphic: true, async: false })
    });

    MediocreVillain = Model.extend({
      name: attr('string'),
      evilMinions: hasMany('evil-minion', { polymorphic: true })
    });

    Layer = Model.extend({
      evilMinionType: attr(),
      evilMinion: belongsTo('evil-minion', { polymorphic: true, async: false })
    })

    setupStore({
      owner: this.owner,
      models: [
        { modelClass: SuperVillain, modelName: 'super-villain' },
        { modelClass: EvilMinion, modelName: 'evil-minion' },
        { modelClass: HomePlanet, modelName: 'home-planet' },
        { modelClass: MediocreVillain, modelName: 'mediocre-villain' },
        { modelClass: YellowMinion, modelName: 'yellow-minion' },
        { modelClass: DoomsdayDevice, modelName: 'doomsday-device' },
        { modelClass: Layer, modelName: 'layer' }
      ]
    });

    this.store = this.owner.lookup('service:store');

    this.serializer = this.store.serializerFor('application');
  });

  module('#serialize', function() {
    test('base case', function(assert) {
      let league = this.store.createRecord('home-planet', { name: 'Villain League', id: '123' });

      let tom = this.store.createRecord('super-villain', {
        firstName: 'Tom',
        lastName: 'Dale',
        homePlanet: league
      });

      let json = this.serializer.serialize(tom._createSnapshot());

      assert.deepEqual(
        json,
        {
          first_name: 'Tom',
          last_name: 'Dale',
          home_planet_id: league.id
        }
      );
    });

    test('serialize polymorphic', function(assert) {
      let tom = this.store.createRecord('yellow-minion', { name: "Alex", id: "124" });
      let ray = this.store.createRecord('doomsday-device', { evilMinion: tom, name: "DeathRay" });

      let json = this.serializer.serialize(ray._createSnapshot());

      assert.deepEqual(
        json,
        {
          name: "DeathRay",
          evil_minion_type: "YellowMinion",
          evil_minion_id: "124"
        }
      );
    });

    test('when type key is not camelized', function(assert) {
      YellowMinion.modelName = 'yellow-minion';

      let tom = this.store.createRecord('yellow-minion', { name: "Alex", id: "124" });
      let ray = this.store.createRecord('doomsday-device', { evilMinion: tom, name: "DeathRay" });

      let json = this.serializer.serialize(ray._createSnapshot());

      assert.deepEqual(json["evil_minion_type"], "YellowMinion");
    });

    test('polymorphic when associated object is null', function(assert) {
      let ray = this.store.createRecord('doomsday-device', { name: "DeathRay" });
      let json = this.serializer.serialize(ray._createSnapshot());

      assert.deepEqual(json["evil_minion_type"], null);
    });
  });

  module('#serializeIntoHash', function() {
    test('base case', function(assert) {
      let league = this.store.createRecord('home-planet', { name: 'Umber', id: '123' });
      let json = {};

      this.serializer.serializeIntoHash(json, HomePlanet, league._createSnapshot());

      assert.deepEqual(
        json,
        {
          home_planet: {
            name: 'Umber'
          }
        }
      );
    });

    test('#serializeIntoHash with decamelized types', function(assert) {
      HomePlanet.modelName = 'home-planet';

      let league = this.store.createRecord('home-planet', { name: "Umber", id: "123" });
      let json = {};

      this.serializer.serializeIntoHash(json, HomePlanet, league._createSnapshot());

      assert.deepEqual(
        json,
        {
          home_planet: {
            name: "Umber"
          }
        }
      );
    });
  });

  module('#normalize', function() {
    test('base case', function(assert) {
      SuperVillain.reopen({
        yellowMinion: belongsTo('yellowMinion')
      });

      let superVillainHash = {
        id: '1',
        first_name: 'Tom',
        last_name: 'Dale',
        home_planet_id: '123',
        evil_minion_ids: [1, 2]
      };

      let json = this.serializer.normalize(
        SuperVillain,
        superVillainHash,
        'superVillain'
      );

      assert.deepEqual(
        json,
        {
          'data': {
            'id': '1',
            'type': 'super-villain',
            'attributes': {
              'firstName': 'Tom',
              'lastName': 'Dale'
            },
            'relationships': {
              'evilMinions': {
                'data': [
                  { 'id': '1', 'type': 'evil-minion' },
                  { 'id': '2', 'type': 'evil-minion' }
                ]
              },
              'homePlanet': {
                'data': { 'id': '123', 'type': 'home-planet' }
              }
            }
          }
        }
      );
    });

    // FIXME reopen is super bad m'kay
    // TODO check to see how it's different from above
    test('base case ALT', function(assert) {
      SuperVillain.reopen({
        yellowMinion: belongsTo('yellowMinion')
      });

      let superVillainHash = {
        id: '1',
        first_name: 'Tom',
        last_name: 'Dale',
        home_planet_id: '123',
        evil_minion_ids: [1, 2]
      };

      let json = this.serializer.normalize(
        SuperVillain,
        superVillainHash,
        'superVillain'
      );

      assert.deepEqual(
        json,
        {
          'data': {
            'id': '1',
            'type': 'super-villain',
            'attributes': {
              'firstName': 'Tom',
              'lastName': 'Dale'
            },
            'relationships': {
              'evilMinions': {
                'data': [
                  { 'id': '1', 'type': 'evil-minion' },
                  { 'id': '2', 'type': 'evil-minion' }
                ]
              },
              'homePlanet': {
                'data': { 'id': '123', 'type': 'home-planet' }
              }
            }
          }
        }
      );
    });

    test('links handling', function(assert) {
      let homePlanet = {
        id: '1',
        name: 'Umber',
        links: {
          super_villains: '/api/super_villians/1'
        }
      };

      let json = this.serializer.normalize(
        HomePlanet,
        homePlanet,
        'homePlanet'
      );

      assert.equal(
        json.data.relationships.superVillains.links.related,
        '/api/super_villians/1',
        'normalize links'
      );
    });
  });

  module('#normalizeResponse', function() {
    test('base case', function(assert) {
      let jsonHash = {
        home_planet: {
          id: '1',
          name: 'Umber',
          super_villain_ids: [1]
        },
        super_villains: [
          {
            id: '1',
            first_name: 'Tom',
            last_name: 'Dale',
            home_planet_id: '1'
          }
        ]
      };

      let json = this.serializer.normalizeResponse(
        this.store,
        HomePlanet,
        jsonHash,
        '1',
        'findRecord'
      );

      assert.deepEqual(
        json,
        {
          'data': {
            'id': '1',
            'type': 'home-planet',
            'attributes': {
              'name': 'Umber'
            },
            'relationships': {
              'superVillains': {
                'data': [
                  { 'id': '1', 'type': 'super-villain' }
                ]
              }
            }
          },
          'included': [{
            'id': '1',
            'type': 'super-villain',
            'attributes': {
              'firstName': 'Tom',
              'lastName': 'Dale'
            },
            'relationships': {
              'homePlanet': {
                'data': { 'id': '1', 'type': 'home-planet' }
              }
            }
          }]
        }
      );
    });

    test('polymorphic with empty value for polymorphic relationship', function(assert) {
      let payload = {
        doomsday_devices: [
          {
            id: 12,
            evil_minion: null
          }
        ]
      };

      let array = this.serializer.normalizeResponse(
        this.store,
        DoomsdayDevice,
        payload,
        null,
        'findAll'
      );

      this.store.push(array);

      let device = this.store.peekRecord('doomsday-device', '12');

      assert.equal(device.belongsTo('evilMinion').id(), null);
    });
  });

  module('#normalizeResponse', function(hooks) {
    hooks.beforeEach(function() {
      this.origMediocreVillainToString = MediocreVillain.toString;
      this.origYellowMinionToString = YellowMinion.toString;

      MediocreVillain.toString = function() { return 'MediocreVillain'; };
      YellowMinion.toString = function() { return 'YellowMinion'; };
    });

    hooks.afterEach(function() {
      MediocreVillain.toString = this.origMediocreVillainToString;
      YellowMinion.toString = this.origYellowMinionToString;
    });

    test('hasMany', function(assert) {
      let jsonHash = {
        mediocre_villain: {
          id: 1,
          name: 'Dr Horrible',
          evil_minion_ids: [
            { type: 'yellow_minion', id: 12 }
          ]
        },
        yellow_minions: [
          { id: 12, name: 'Alex' }
        ]
      };

      let json = this.serializer.normalizeResponse(
        this.store,
        MediocreVillain,
        jsonHash,
        '1',
        'findRecord'
      );

      assert.deepEqual(
        json,
        {
          'data': {
            'id': '1',
            'type': 'mediocre-villain',
            'attributes': {
              'name': 'Dr Horrible'
            },
            'relationships': {
              'evilMinions': {
                'data': [
                  { 'id': '12', 'type': 'yellow-minion' }
                ]
              }
            }
          },
          'included': [{
            'id': '12',
            'type': 'yellow-minion',
            'attributes': {
              'name': 'Alex'
            },
            'relationships': {}
          }]
        }
      );
    });

    test('belongsTo', function(assert) {
      let jsonHash = {
        doomsday_device: {
          id: 1,
          name: 'DeathRay',
          evil_minion_id: {
            type: 'yellow_minion', id: 12
          }
        },
        yellow_minions: [
          { id: 12, name: 'Alex' }
        ]
      };

      let json = this.serializer.normalizeResponse(
        this.store,
        DoomsdayDevice,
        jsonHash,
        '1',
        'findRecord'
      );

      assert.deepEqual(
        json,
        {
          'data': {
            'id': '1',
            'type': 'doomsday-device',
            'attributes': {
              'name': 'DeathRay'
            },
            'relationships': {
              'evilMinion': {
                'data': { 'id': '12', 'type': 'yellow-minion' }
              }
            }
          },
          'included': [{
            'id': '12',
            'type': 'yellow-minion',
            'attributes': {
              'name': 'Alex'
            },
            'relationships': {}
          }]
        }
      );
    });

    test('belongsTo (weird format)', function(assert) {
      let jsonHash = {
        doomsday_device: {
          id: 1,
          name: 'DeathRay',
          evil_minion_id: 12,
          evil_minion_type: 'yellow_minion'
        },
        yellow_minions: [
          { id: 12, name: 'Alex' }
        ]
      };

      let json = this.serializer.normalizeResponse(
        this.store,
        DoomsdayDevice,
        jsonHash,
        '1',
        'findRecord'
      );

      assert.deepEqual(
        json,
        {
          'data': {
            'id': '1',
            'type': 'doomsday-device',
            'attributes': {
              'name': 'DeathRay'
            },
            'relationships': {
              'evilMinion': {
                'data': { 'id': '12', 'type': 'yellow-minion' }
              }
            }
          },
          'included': [{
            'id': '12',
            'type': 'yellow-minion',
            'attributes': {
              'name': 'Alex'
            },
            'relationships': {}
          }]
        }
      );
    });

    test('belongsTo (weird format) does not screw if there is a relationshipType attribute', function(assert) {
      let jsonHash = {
        layer: {
          id: 1,
          evil_minion_id: {
            id: 12,
            type: 'yellow_minion'
          },
          evil_minion_type: 'what a minion'
        },
        yellow_minions: [
          { id: 12, name: 'Alex' }
        ]
      };

      let json = this.serializer.normalizeResponse(
        this.store,
        Layer,
        jsonHash,
        '1',
        'findRecord'
      );

      assert.deepEqual(
        json,
        {
          'data': {
            'id': '1',
            'type': 'layer',
            'attributes': {
              'evilMinionType': 'what a minion'
            },
            'relationships': {
              'evilMinion': {
                'data': { 'id': '12', 'type': 'yellow-minion'  }
              }
            }
          },
          'included': [{
            'id': '12',
            'type': 'yellow-minion',
            'attributes': {
              'name': 'Alex'
            },
            'relationships': {}
          }]
        }
      );
    });

    test('when the related data is not specified', function(assert) {
      let jsonHash = {
        doomsday_device: { id: 1, name: 'DeathRay' },
        evil_minions: [
          { id: 12, name: 'Alex', doomsday_device_ids: [1] }
        ]
      };

      let json = this.serializer.normalizeResponse(
        this.store,
        DoomsdayDevice,
        jsonHash,
        '1',
        'findRecord'
      );

      assert.deepEqual(
        json,
        {
          'data': {
            'id': '1',
            'type': 'doomsday-device',
            'attributes': {
              'name': 'DeathRay'
            },
            'relationships': {}
          },
          'included': [{
            'id': '12',
            'type': 'evil-minion',
            'attributes': {
              'name': 'Alex'
            },
            'relationships': {}
          }]
        }
      );
    });

    test('hasMany when the related data is not specified', function(assert) {
      let jsonHash = {
        mediocre_villain: { id: 1, name: "Dr Horrible" }
      };

      let json = this.serializer.normalizeResponse(
        this.store,
        MediocreVillain,
        jsonHash,
        '1',
        'findRecord'
      );

      assert.deepEqual(
        json,
        {
          'data': {
            'id': '1',
            'type': 'mediocre-villain',
            'attributes': {
              'name': 'Dr Horrible'
            },
            'relationships': {}
          },
          'included': []
        }
      );
    });

    test('does not break hasMany relationships', function(assert) {
      let jsonHash = {
        mediocre_villain: {
          id: 1,
          name: 'Dr. Evil',
          evil_minion_ids: []
        }
      };

      let json = this.serializer.normalizeResponse(
        this.store,
        MediocreVillain,
        jsonHash,
        '1',
        'findRecord'
      );

      assert.deepEqual(
        json,
        {
          'data': {
            'id': '1',
            'type': 'mediocre-villain',
            'attributes': {
              'name': 'Dr. Evil'
            },
            'relationships': {
              'evilMinions': {
                'data': []
              }
            }
          },
          'included': []
        }
      );
    });

    test('supports the default format for polymorphic belongsTo', function(assert) {
      let payload = {
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

      let json = this.serializer.normalizeResponse(
        this.store,
        DoomsdayDevice,
        payload,
        '1',
        'findRecord'
      );

      this.store.push(json);

      let minion = this.store.peekRecord('doomsday-device', 1);

      assert.equal(
        minion.get('evilMinion.name'),
        'Sally'
      );
    });

    test('supports the default format for polymorphic hasMany', function(assert) {
      let payload = {
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

      let json = this.serializer.normalizeResponse(
        this.store,
        MediocreVillain,
        payload,
        '1',
        'findRecord'
      );

      this.store.push(json);

      let villain = this.store.peekRecord('mediocre-villain', '1');

      assert.equal(
        villain.get('evilMinions.firstObject.name'),
        'Harry'
      );
    });
  });

  test('#extractErrors camelizes keys', function(assert) {
    let error = {
      errors: [
        {
          source: {
            pointer: 'data/attributes/first_name'
          },
          detail: 'firstName not evil enough'
        }
      ]
    };

    let payload = this.serializer.extractErrors(this.store, SuperVillain, error);

    assert.deepEqual(
      payload,
      {
        firstName: ['firstName not evil enough']
      }
    );
  });

  test('when using the EmbeddedRecordsMixin, does not erase attributes for polymorphic embedded models', function(assert) {
    let MediocreVillainSerializer = ActiveModelSerializer.extend(EmbeddedRecordsMixin, {
      attrs: {
        evilMinions: {
          serialize: false,
          deserialize: 'records'
        }
      }
    });

    this.owner.register('serializer:mediocre-villain', MediocreVillainSerializer);

    let payload = {
      mediocre_villain: {
        id: 1,
        evil_minions: [{
          id: 1,
          type: 'evil_minion',
          name: 'tom dale'
        }]
      }
    };

    let json = this.store.serializerFor('mediocre-villain').normalizeResponse(
      this.store,
      MediocreVillain,
      payload,
      '1',
      'findRecord'
    );

    this.store.push(json);

    let villain = this.store.peekRecord('mediocre-villain', '1');

    assert.equal(
      villain.get('evilMinions.firstObject.name'),
      'tom dale'
    );
  });

  test('can have id-less belongsTo relationship', function (assert) {
    let payload = {
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

    let json = this.store.serializerFor('super-villain').normalizeResponse(
      this.store,
      SuperVillain,
      payload,
      '1',
      'findRecord'
    );

    this.store.push(json);

    let villain = this.store.peekRecord('super-villain', 1);

    assert.equal(
      villain.belongsTo('homePlanet').id(),
      '1'
    );
  });

  test('can have id-less hasMany relationship', function (assert) {
    let payload = {
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

    let json = this.store.serializerFor('home-planet').normalizeResponse(
      this.store,
      HomePlanet,
      payload,
      '1',
      'findRecord'
    );

    this.store.push(json);

    let homePlanet = this.store.peekRecord('home-planet', 1);

    assert.deepEqual(
      homePlanet.hasMany('superVillains').ids(),
      ['1']
    );
  });

  test('#normalizeSingleResponse', function(assert) {
    let jsonHash = {
      home_planet: {
        id: '1',
        name: 'Umber',
        super_villain_ids: [1]
      },
      super_villains: [
        {
          id: '1',
          first_name: 'Tom',
          last_name: 'Dale',
          home_planet_id: '1'
        }
      ]
    };

    let json = this.serializer.normalizeSingleResponse(
      this.store,
      HomePlanet,
      jsonHash,
      '1',
      'find'
    );

    assert.deepEqual(
      json,
        {
        'data': {
          'id': '1',
          'type': 'home-planet',
          'attributes': {
            'name': 'Umber'
          },
          'relationships': {
            'superVillains': {
              'data': [
                { 'id': '1', 'type': 'super-villain' }
              ]
            }
          }
        },
        'included': [{
          'id': '1',
          'type': 'super-villain',
          'attributes': {
            'firstName': 'Tom',
            'lastName': 'Dale'
          },
          'relationships': {
            'homePlanet': {
              'data': { 'id': '1', 'type': 'home-planet' }
            }
          }
        }]
      }
    );
  });

  test('normalizeArrayResponse', function(assert) {
    let jsonHash = {
      home_planets: [
        { id: '1', name: 'Umber', super_villain_ids: [1] }
      ],
      super_villains: [
        { id: '1', first_name: 'Tom', last_name: 'Dale', home_planet_id: '1' }
      ]
    };

    let array = this.serializer.normalizeArrayResponse(
      this.store,
      HomePlanet,
      jsonHash,
      null,
      'findAll'
    );

    assert.deepEqual(
      array,
        {
        'data': [{
          'id': '1',
          'type': 'home-planet',
          'attributes': {
            'name': 'Umber'
          },
          'relationships': {
            'superVillains': {
              'data': [
                { 'id': '1', 'type': 'super-villain' }
              ]
            }
          }
        }],
        'included': [{
          'id': '1',
          'type': 'super-villain',
          'attributes': {
            'firstName': 'Tom',
            'lastName': 'Dale'
          },
          'relationships': {
            'homePlanet': {
              'data': { 'id': '1', 'type': 'home-planet' }
            }
          }
        }]
      }
    );
  });
});
