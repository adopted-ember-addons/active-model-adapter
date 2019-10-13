import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { TestContext } from 'ember-test-helpers';
import DS from 'ember-data';
import attr from 'ember-data/attr';
import { belongsTo, hasMany } from 'ember-data/relationships';
import Pretender from 'pretender';
import { ActiveModelSerializer } from 'active-model-adapter';
import Ember from 'ember';

class TestSerializer extends ActiveModelSerializer {
  isNewSerializerApi = true;
}

class SuperVillain extends DS.Model {
  @attr('string') firstName!: string;
  @attr('string') lastName!: string;
  @belongsTo('evil-minion') evilMinions?: EvilMinion;
}

class EvilMinion extends DS.Model {
  @belongsTo('super-villain') superVillain?: SuperVillain;
  @attr('string') name!: string;
}
class YellowMinion extends EvilMinion {}

class DoomsdayDevice extends DS.Model {
  @attr('string') name!: string;
  @belongsTo('evil-minion', { polymorphic: true }) evilMinion?: EvilMinion;
}

class MediocreVillain extends DS.Model {
  @attr('string') name!: string;
  @hasMany('evil-minion') evilMinions?: EvilMinion[];
}

let pretender: Pretender;
module('Unit | Serializer | active model serializer namespace test', function(
  hooks
) {
  setupTest(hooks);

  hooks.beforeEach(function(this: TestContext) {
    this.owner.register('serializer:application', TestSerializer);
    this.owner.register('serializer:-active-model', TestSerializer);
    this.owner.register('adapter:-active-model', TestSerializer);

    this.owner.register('adapter:application', TestSerializer);
    this.owner.register('model:super-villain', SuperVillain);
    this.owner.register('model:evil-minion', EvilMinion);
    this.owner.register('model:evil-minions/yellow-minion', YellowMinion);
    this.owner.register('model:doomsday-device', DoomsdayDevice);
    this.owner.register('model:mediocre-villain', MediocreVillain);

    pretender = new Pretender();
  });

  hooks.afterEach(function() {
    pretender.shutdown();
  });

  if (Ember.FEATURES.isEnabled('ds-new-serializer-api')) {
    test('extractPolymorphic belongsTo', async function(assert) {
      const serializer = this.owner.lookup('serializer:-active-model');

      const store = this.owner.lookup('service:store');

      var json_hash = {
        doomsday_device: {
          id: 1,
          name: 'DeathRay',
          evil_minion_id: { type: 'EvilMinions::YellowMinion', id: 12 }
        },
        'evil-minions/yellow-minion': [
          { id: 12, name: 'Alex', doomsday_device_ids: [1] }
        ]
      };

      var json = await serializer.normalizeResponse(
        store,
        DoomsdayDevice,
        json_hash,
        '1',
        'find'
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
              data: { id: '12', type: 'evil-minions/yellow-minion' }
            }
          }
        },
        included: [
          {
            id: '12',
            type: 'evil-minions/yellow-minion',
            attributes: {
              name: 'Alex'
            },
            relationships: {}
          }
        ]
      });
    });
  }
});
