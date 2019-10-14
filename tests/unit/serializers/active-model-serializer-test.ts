import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import ActiveModelAdapter, {
  ActiveModelSerializer
} from 'active-model-adapter';
import { TestContext } from 'ember-test-helpers';
import DS from 'ember-data';
import { belongsTo, hasMany } from 'ember-data/relationships';
import attr from 'ember-data/attr';
import Pretender from 'pretender';
import Store from 'ember-data/store';
import { get } from '@ember/object';
import Model from 'ember-data/model';

class ApplicationAdapter extends ActiveModelAdapter {}
class User extends DS.Model {
  @attr('string') firstName!: string;
}

class TestSerializer extends ActiveModelSerializer {
  isNewSerializerAPI = true;
}

class SuperVillain extends Model {
  @attr('string') firstName!: string;
  @attr('string') lastName!: string;
  @belongsTo('home-planet') homePlanet?: HomePlanet;
  @hasMany('evil-minion') evilMinions?: EvilMinion[];
}

class HomePlanet extends Model {
  @attr('string') name!: string;
  @hasMany('super-villain', { async: true }) superVillains?: SuperVillain[];
}

class EvilMinion extends Model {
  @belongsTo('super-villain') superVillain?: SuperVillain;
  @attr('string') name!: string;

  toString() {
    return 'EvilMinion';
  }
}
class YellowMinion extends EvilMinion {
  toString() {
    return 'YellowMinion';
  }
}

class DoomsdayDevice extends Model {
  @attr('string') name!: string;
  @belongsTo('evil-minion', { polymorphic: true, async: false })
  evilMinion?: EvilMinion;
}

class MediocreVillain extends Model {
  @attr('string') name!: string;
  @hasMany('evil-minion', { polymorphic: true }) evilMinions?: EvilMinion[];
}

let pretender: Pretender;

type Context = TestContext & {
  amsSerializer: ActiveModelSerializer;
};

module('Unit | Serializer | active model serializer', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function(this: Context) {
    this.owner.register('adapter:application', ApplicationAdapter);
    this.owner.register('serializer:application', TestSerializer);

    this.owner.register('model:user', User);
    this.owner.register('model:super-villain', SuperVillain);
    this.owner.register('model:home-planet', HomePlanet);
    this.owner.register('model:evil-minion', EvilMinion);
    this.owner.register('model:yellow-minion', YellowMinion);
    this.owner.register('model:doomsday-device', DoomsdayDevice);
    this.owner.register('model:mediocre-villain', MediocreVillain);

    this.store = this.owner.lookup('service:store');

    this.amsSerializer = this.owner.lookup('serializer:-active-model');

    pretender = new Pretender();
  });

  hooks.afterEach(function() {
    pretender.shutdown();
  });

  test('errors are camelCased and are expected under the `errors` property of the payload', async function(this: Context, assert) {
    const store: Store = this.owner.lookup('service:store');
    store.push({
      data: {
        type: 'user',
        id: 1
      }
    });
    const user = store.peekRecord('user', 1);

    pretender.put('/users/1', function(_req) {
      const response = {
        errors: {
          first_name: ['firstName error']
        }
      };
      return [422, {}, JSON.stringify(response)];
    });

    try {
      await user.save();
    } catch (error) {
      assert.ok(
        user.get('errors').length === 1,
        'there are errors for the firstName attribute'
      );
      assert.deepEqual(user.get('errors.messages'), ['firstName error']);
    }
  });

  test('serialize', function(this: Context, assert) {
    const league = this.store.createRecord('home-planet', {
      name: 'Villain League',
      id: '123'
    });

    const tom = this.store.createRecord('super-villain', {
      firstName: 'Tom',
      lastName: 'Dale',
      homePlanet: league
    });

    var json = this.amsSerializer.serialize(tom._createSnapshot(), {});

    assert.deepEqual(json, {
      first_name: 'Tom',
      last_name: 'Dale',
      home_planet_id: get(league, 'id')
    });
  });

  test('serializeIntoHash', function(this: Context, assert) {
    const league = this.store.createRecord('home-planet', {
      name: 'Umber',
      id: '123'
    });
    var json = {};

    this.amsSerializer.serializeIntoHash(
      json,
      HomePlanet,
      league._createSnapshot()
    );

    assert.deepEqual(json, {
      home_planet: {
        name: 'Umber'
      }
    });
  });

  test('serializeIntoHash with decamelized types', function(this: Context, assert) {
    const league = this.store.createRecord('home-planet', {
      name: 'Umber',
      id: '123'
    });
    var json = {};

    this.amsSerializer.serializeIntoHash(
      json,
      HomePlanet,
      league._createSnapshot()
    );

    assert.deepEqual(json, {
      home_planet: {
        name: 'Umber'
      }
    });
  });

  test('normalize links', function(this: Context, assert) {
    var home_planet = {
      id: '1',
      name: 'Umber',
      links: { super_villains: '/api/super_villians/1' }
    };

    var json: any = this.amsSerializer.normalize(
      HomePlanet,
      home_planet,
      'homePlanet'
    );

    assert.equal(
      json.data.relationships.superVillains.links.related,
      '/api/super_villians/1',
      'normalize links'
    );
  });

  test('normalize', function(this: Context, assert) {
    class SuperVillainExtended extends SuperVillain {
      @belongsTo('yellow-minion') yellowMinion?: YellowMinion;
    }
    this.owner.register('model:super-villain', SuperVillainExtended);

    var superVillain_hash = {
      id: '1',
      first_name: 'Tom',
      last_name: 'Dale',
      home_planet_id: '123',
      evil_minion_ids: [1, 2]
    };

    var json = this.amsSerializer.normalize(
      SuperVillain,
      superVillain_hash,
      'superVillain'
    );

    assert.deepEqual(json, {
      data: {
        id: '1',
        type: 'super-villain',
        attributes: {
          firstName: 'Tom',
          lastName: 'Dale'
        },
        relationships: {
          evilMinions: {
            data: [
              { id: '1', type: 'evil-minion' },
              { id: '2', type: 'evil-minion' }
            ]
          },
          homePlanet: {
            data: { id: '123', type: 'home-planet' }
          }
        }
      }
    });
  });

  test('normalizeResponse', function(this: Context, assert) {
    this.owner.register('adapter:superVillain', ActiveModelAdapter);

    var json_hash = {
      home_planet: { id: '1', name: 'Umber', super_villain_ids: [1] },
      super_villains: [
        {
          id: '1',
          first_name: 'Tom',
          last_name: 'Dale',
          home_planet_id: '1'
        }
      ]
    };

    var json;
    json = this.amsSerializer.normalizeResponse(
      this.store,
      HomePlanet,
      json_hash,
      '1',
      'findRecord'
    );

    assert.deepEqual(json, {
      data: {
        id: '1',
        type: 'home-planet',
        attributes: {
          name: 'Umber'
        },
        relationships: {
          superVillains: {
            data: [{ id: '1', type: 'super-villain' }]
          }
        }
      },
      included: [
        {
          id: '1',
          type: 'super-villain',
          attributes: {
            firstName: 'Tom',
            lastName: 'Dale'
          },
          relationships: {
            homePlanet: {
              data: { id: '1', type: 'home-planet' }
            }
          }
        }
      ]
    });
  });

  test('normalizeResponse', function(this: Context, assert) {
    this.owner.register('adapter:superVillain', ActiveModelAdapter);
    var array;

    var json_hash = {
      home_planets: [{ id: '1', name: 'Umber', super_villain_ids: [1] }],
      super_villains: [
        { id: '1', first_name: 'Tom', last_name: 'Dale', home_planet_id: '1' }
      ]
    };

    array = this.amsSerializer.normalizeResponse(
      this.store,
      HomePlanet,
      json_hash,
      null,
      'findAll'
    );

    assert.deepEqual(array, {
      data: [
        {
          id: '1',
          type: 'home-planet',
          attributes: {
            name: 'Umber'
          },
          relationships: {
            superVillains: {
              data: [{ id: '1', type: 'super-villain' }]
            }
          }
        }
      ],
      included: [
        {
          id: '1',
          type: 'super-villain',
          attributes: {
            firstName: 'Tom',
            lastName: 'Dale'
          },
          relationships: {
            homePlanet: {
              data: { id: '1', type: 'home-planet' }
            }
          }
        }
      ]
    });
  });

  test('normalizeResponse - polymorphic with empty value for polymorphic relationship', function(this: Context, assert) {
    const payload = {
      doomsday_devices: [
        {
          id: 12,
          evil_minion: null
        }
      ]
    };

    const array = this.amsSerializer.normalizeResponse(
      this.store,
      DoomsdayDevice,
      payload,
      null,
      'findAll'
    );

    this.store.push(array);

    const device = this.store.peekRecord('doomsday-device', '12');
    assert.equal(device.get('evilMinion'), null);
  });

  test('serialize polymorphic', function(this: Context, assert) {
    const tom = this.store.createRecord('yellow-minion', {
      name: 'Alex',
      id: '124'
    });
    const ray = this.store.createRecord('doomsday-device', {
      evilMinion: tom,
      name: 'DeathRay'
    });

    const json = this.amsSerializer.serialize(ray._createSnapshot(), {});

    assert.deepEqual(json, {
      name: 'DeathRay',
      evil_minion_type: 'YellowMinion',
      evil_minion_id: '124'
    });
  });

  test('serialize polymorphic when type key is not camelized', function(this: Context, assert) {
    const tom = this.store.createRecord('yellow-minion', {
      name: 'Alex',
      id: '124'
    });
    const ray = this.store.createRecord('doomsday-device', {
      evilMinion: tom,
      name: 'DeathRay'
    });

    const json: any = this.amsSerializer.serialize(ray._createSnapshot(), {});

    assert.deepEqual(json['evil_minion_type'], 'YellowMinion');
  });

  test('serialize polymorphic when associated object is null', function(this: Context, assert) {
    const ray = this.store.createRecord('doomsday-device', {
      name: 'DeathRay'
    });
    const json: any = this.amsSerializer.serialize(ray._createSnapshot(), {});

    assert.deepEqual(json['evil_minion_type'], null);
  });

  test('extractPolymorphic hasMany', function(this: Context, assert) {
    MediocreVillain.toString = function() {
      return 'MediocreVillain';
    };
    YellowMinion.toString = function() {
      return 'YellowMinion';
    };

    const json_hash = {
      mediocre_villain: {
        id: 1,
        name: 'Dr Horrible',
        evil_minion_ids: [{ type: 'yellow_minion', id: 12 }]
      },
      yellow_minions: [{ id: 12, name: 'Alex' }]
    };

    const json: any = this.amsSerializer.normalizeResponse(
      this.store,
      MediocreVillain,
      json_hash,
      '1',
      'findRecord'
    );

    assert.deepEqual(json, {
      data: {
        id: '1',
        type: 'mediocre-villain',
        attributes: {
          name: 'Dr Horrible'
        },
        relationships: {
          evilMinions: {
            data: [{ id: '12', type: 'yellow-minion' }]
          }
        }
      },
      included: [
        {
          id: '12',
          type: 'yellow-minion',
          attributes: {
            name: 'Alex'
          },
          relationships: {}
        }
      ]
    });
  });

  test('extractPolymorphic belongsTo', function(this: Context, assert) {
    this.owner.register('adapter:yellow-minion', ActiveModelAdapter);

    var json_hash = {
      doomsday_device: {
        id: 1,
        name: 'DeathRay',
        evil_minion_id: { type: 'yellow_minion', id: 12 }
      },
      yellow_minions: [{ id: 12, name: 'Alex' }]
    };

    const json = this.amsSerializer.normalizeResponse(
      this.store,
      DoomsdayDevice,
      json_hash,
      '1',
      'findRecord'
    );

    assert.deepEqual(json, {
      data: {
        id: '1',
        type: 'doomsday-device',
        attributes: {
          name: 'DeathRay'
        },
        relationships: {
          evilMinion: {
            data: { id: '12', type: 'yellow-minion' }
          }
        }
      },
      included: [
        {
          id: '12',
          type: 'yellow-minion',
          attributes: {
            name: 'Alex'
          },
          relationships: {}
        }
      ]
    });
  });

  test('extractPolymorphic belongsTo (weird format)', function(this: Context, assert) {
    this.owner.register('adapter:yellow-minion', ActiveModelAdapter);

    var json_hash = {
      doomsday_device: {
        id: 1,
        name: 'DeathRay',
        evil_minion_id: 12,
        evil_minion_type: 'yellow_minion'
      },
      yellow_minions: [{ id: 12, name: 'Alex' }]
    };

    const json = this.amsSerializer.normalizeResponse(
      this.store,
      DoomsdayDevice,
      json_hash,
      '1',
      'findRecord'
    );

    assert.deepEqual(json, {
      data: {
        id: '1',
        type: 'doomsday-device',
        attributes: {
          name: 'DeathRay'
        },
        relationships: {
          evilMinion: {
            data: { id: '12', type: 'yellow-minion' }
          }
        }
      },
      included: [
        {
          id: '12',
          type: 'yellow-minion',
          attributes: {
            name: 'Alex'
          },
          relationships: {}
        }
      ]
    });
  });

  // FIXME - fails on `this.store` is undefined
  // test('belongsTo (weird format) does not screw if there is a relationshipType attribute', function(this: Context, assert) {
  //   this.owner.register('adapter:yellow-minion', ActiveModelAdapter);

  //   DoomsdayDevice.reopen({
  //     evilMinionType: DS.attr()
  //   });

  //   var json_hash = {
  //     doomsday_device: {
  //       id: 1,
  //       name: 'DeathRay',
  //       evil_minion_id: {
  //         id: 12,
  //         type: 'yellow_minion'
  //       },
  //       evil_minion_type: 'what a minion'
  //     },
  //     yellow_minions: [{ id: 12, name: 'Alex' }]
  //   };

  //   const json = this.amsSerializer.normalizeResponse(
  //     this.store,
  //     DoomsdayDevice,
  //     json_hash,
  //     '1',
  //     'findRecord'
  //   );

  //   assert.deepEqual(json, {
  //     data: {
  //       id: '1',
  //       type: 'doomsday-device',
  //       attributes: {
  //         name: 'DeathRay',
  //         evilMinionType: 'what a minion'
  //       },
  //       relationships: {
  //         evilMinion: {
  //           data: { id: '12', type: 'yellow-minion' }
  //         }
  //       }
  //     },
  //     included: [
  //       {
  //         id: '12',
  //         type: 'yellow-minion',
  //         attributes: {
  //           name: 'Alex'
  //         },
  //         relationships: {}
  //       }
  //     ]
  //   });
  // });

  test('extractPolymorphic when the related data is not specified', function(this: Context, assert) {
    const payload = {
      doomsday_device: { id: 1, name: 'DeathRay' },
      evil_minions: [{ id: 12, name: 'Alex' }]
    };

    const json = this.amsSerializer.normalizeResponse(
      this.store,
      DoomsdayDevice,
      payload,
      '1',
      'findRecord'
    );

    assert.deepEqual(json, {
      data: {
        id: '1',
        type: 'doomsday-device',
        attributes: {
          name: 'DeathRay'
        },
        relationships: {}
      },
      included: [
        {
          id: '12',
          type: 'evil-minion',
          attributes: {
            name: 'Alex'
          },
          relationships: {}
        }
      ]
    });
  });

  test('extractPolymorphic hasMany when the related data is not specified', function(this: Context, assert) {
    const payload = {
      mediocre_villain: { id: 1, name: 'Dr Horrible' }
    };

    const json = this.amsSerializer.normalizeResponse(
      this.store,
      MediocreVillain,
      payload,
      '1',
      'findRecord'
    );

    assert.deepEqual(json, {
      data: {
        id: '1',
        type: 'mediocre-villain',
        attributes: {
          name: 'Dr Horrible'
        },
        relationships: {}
      },
      included: []
    });
  });

  test('extractPolymorphic does not break hasMany relationships', function(this: Context, assert) {
    var payload = {
      mediocre_villain: { id: 1, name: 'Dr. Evil', evil_minion_ids: [] }
    };

    const json = this.amsSerializer.normalizeResponse(
      this.store,
      MediocreVillain,
      payload,
      '1',
      'findRecord'
    );

    assert.deepEqual(json, {
      data: {
        id: '1',
        type: 'mediocre-villain',
        attributes: {
          name: 'Dr. Evil'
        },
        relationships: {
          evilMinions: {
            data: []
          }
        }
      },
      included: []
    });
  });

  test('extractErrors camelizes keys', function(this: Context, assert) {
    var error = {
      errors: [
        {
          source: {
            pointer: 'data/attributes/first_name'
          },
          detail: 'firstName not evil enough'
        }
      ]
    };

    const payload = this.amsSerializer.extractErrors(
      this.store,
      SuperVillain,
      error,
      ''
    );

    assert.deepEqual(payload, {
      firstName: ['firstName not evil enough']
    });
  });

  test('supports the default format for polymorphic belongsTo', function(this: Context, assert) {
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

    const json = this.amsSerializer.normalizeResponse(
      this.store,
      DoomsdayDevice,
      payload,
      '1',
      'findRecord'
    );
    this.store.push(json);
    const minion = this.store.peekRecord('doomsday-device', 1);

    assert.equal(minion.get('evilMinion.name'), 'Sally');
  });

  // FIXME - fails on `this.store` is undefined
  test('supports the default format for polymorphic hasMany', function(this: Context, assert) {
    var payload = {
      mediocre_villain: {
        id: 1,
        evil_minions: [
          {
            id: 1,
            type: 'evil_minion'
          }
        ]
      },
      evil_minions: [
        {
          id: 1,
          name: 'Harry'
        }
      ]
    };

    const json = this.amsSerializer.normalizeResponse(
      this.store,
      MediocreVillain,
      payload,
      '1',
      'findRecord'
    );
    this.store.push(json);
    const villain = this.store.peekRecord('mediocre-villain', '1');

    assert.equal(villain.get('evilMinions.firstObject.name'), 'Harry');
  });

  test('when using the DS.EmbeddedRecordsMixin, does not erase attributes for polymorphic embedded models', function(this: Context, assert) {
    this.owner.register(
      'serializer:mediocre-villain',
      ActiveModelSerializer.extend(DS.EmbeddedRecordsMixin, {
        isNewSerializerAPI: true,

        attrs: {
          evilMinions: { serialize: false, deserialize: 'records' }
        }
      })
    );

    const payload = {
      mediocre_villain: {
        id: 1,
        evil_minions: [
          {
            id: 1,
            type: 'evil_minion',
            name: 'tom dale'
          }
        ]
      }
    };

    const json = this.store
      .serializerFor('mediocre-villain')
      .normalizeResponse(
        this.store,
        MediocreVillain,
        payload,
        '1',
        'findRecord'
      );
    this.store.push(json);
    const villain = this.store.peekRecord('mediocre-villain', '1');

    assert.equal(villain.get('evilMinions.firstObject.name'), 'tom dale');
  });

  // FIXME - id is undefined
  test('can have id-less belongsTo relationship', function(this: Context, assert) {
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

    const json = this.store
      .serializerFor('super-villain')
      .normalizeResponse(this.store, SuperVillain, payload, '1', 'findRecord');
    this.store.push(json);
    const villain = this.store.peekRecord('super-villain', 1);

    assert.equal(villain.get('homePlanet.id'), '1');
  });

  test('can have id-less belongsTo relationship part 2', async function(assert) {
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

    const json = this.store
      .serializerFor('home-planet')
      .normalizeResponse(this.store, HomePlanet, payload, '1', 'findRecord');

    this.store.push(json);

    const homePlanet = this.store.peekRecord('home-planet', 1);

    const superVillains = await homePlanet.get('superVillains');
    assert.deepEqual(superVillains.toArray().map((v: any) => v.get('id')), [
      '1'
    ]);
  });
});
