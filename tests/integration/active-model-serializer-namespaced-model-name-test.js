import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import setupStore from '../helpers/setup-store';

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo, hasMany } from 'ember-data/relationships';

let SuperVillain, EvilMinion, YellowMinion, DoomsdayDevice, MediocreVillain;

module('Integration | Name Spaced Model Names', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    SuperVillain = Model.extend({
      firstName: attr('string'),
      lastName: attr('string'),
      evilMinions: hasMany('evil-minion')
    });

    EvilMinion = Model.extend({
      superVillain: belongsTo('super-villain'),
      name: attr('string')
    });

    YellowMinion = EvilMinion.extend();

    DoomsdayDevice = Model.extend({
      name: attr('string'),
      evilMinion: belongsTo('evil-minion', { polymorphic: true })
    });

    MediocreVillain = Model.extend({
      name: attr('string'),
      evilMinions: hasMany('evil-minion', { polymorphic: true })
    });

    setupStore({
      owner: this.owner,
      models: [
        { modelClass: SuperVillain, modelName: 'super-villain' },
        { modelClass: EvilMinion, modelName: 'evil-minion' },
        { modelClass: DoomsdayDevice, modelName: 'doomsday-device' },
        { modelClass: MediocreVillain, modelName: 'mediocre-villain' },
        { modelClass: YellowMinion, modelName: 'evil-minions/yellow-minion' },
        { modelClass: YellowMinion, modelName: 'yellow-minion' }
      ]
    });

    this.store = this.owner.lookup('service:store');

    this.serializer = this.store.serializerFor('application');
  });

  test('serialize polymorphic', function(assert) {
    let tom = this.store.createRecord('evil-minions/yellow-minion', { name: 'Alex', id: '124' });

    let ray = this.store.createRecord('doomsday-device', { evilMinion: tom, name: 'DeathRay' });

    let json = this.serializer.serialize(ray._createSnapshot());

    assert.deepEqual(
      json,
      {
        name: 'DeathRay',
        evil_minion_type: 'EvilMinions::YellowMinion',
        evil_minion_id: '124'
      }
    );
  });

  test('serialize polymorphic when type key is not camelized', function(assert) {
    YellowMinion.modelName = 'evil-minions/yellow-minion';

    let tom = this.store.createRecord('yellow-minion', { name: 'Alex', id: '124' });
    let ray = this.store.createRecord('doomsday-device', { evilMinion: tom, name: 'DeathRay' });

    let json = this.serializer.serialize(ray._createSnapshot());

    assert.deepEqual(json['evil_minion_type'], 'EvilMinions::YellowMinion');
  });

  module('extractPolymorphic', function() {
    test('hasMany', function(assert) {
      let jsonHash = {
        mediocre_villain: {
          id: 1,
          name: 'Dr Horrible',
          evil_minion_ids: [
            { type: 'EvilMinions::YellowMinion', id: 12 }
          ]
        },
        'evil-minions/yellow-minion': [
          { id: 12, name: 'Alex', doomsday_device_ids: [1] }
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
                  { 'id': '12', 'type': 'evil-minions/yellow-minion' }
                ]
              }
            }
          },
          'included': [{
            'id': '12',
            'type': 'evil-minions/yellow-minion',
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
            type: 'EvilMinions::YellowMinion', id: 12
          }
        },
        'evil-minions/yellow-minion': [
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
            'relationships': {
              'evilMinion': {
                'data': { 'id': '12', 'type': 'evil-minions/yellow-minion' }
              }
            }
          },
          'included': [{
            'id': '12',
            'type': 'evil-minions/yellow-minion',
            'attributes': {
              'name': 'Alex'
            },
            'relationships': {}
          }]
        }
      );
    });
  });
});
