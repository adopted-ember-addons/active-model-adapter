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

class ApplicationAdapter extends ActiveModelAdapter {}
class User extends DS.Model {
  @attr('string') firstName!: string;
}

class TestSerializer extends ActiveModelSerializer {
  isNewSerializerAPI = true;
}

class SuperVillain extends DS.Model {
  @attr('string') firstName!: string;
  @attr('string') lastName!: string;
  @belongsTo('home-planet') homePlanet?: HomePlanet;
  @hasMany('evil-minion') evilMinions?: EvilMinion[];
}

class HomePlanet extends DS.Model {
  @attr('string') name!: string;
  @hasMany('super-villain', { async: true }) superVillains?: SuperVillain[];
}

class EvilMinion extends DS.Model {
  @belongsTo('super-villain') superVillain?: SuperVillain;
  @attr('string') name!: string;
}
class YellowMinion extends EvilMinion {}

class DoomsdayDevice extends DS.Model {
  @attr('string') name!: string;
  @belongsTo('evil-minion', { polymorphic: true, async: true })
  evilMinion?: EvilMinion;
}

class MediocreVillain extends DS.Model {
  @attr('string') name!: string;
  @hasMany('evil-minion', { polymorphic: true }) evilMinions?: EvilMinion[];
}

let env: any = {};

let pretender: Pretender;
module('Unit | Serializer | active model serializer', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function(this: TestContext) {
    this.owner.register('adapter:application', ApplicationAdapter);
    this.owner.register('serializer:application', TestSerializer);

    this.owner.register('model:user', User);
    this.owner.register('model:super-villain', SuperVillain);
    this.owner.register('model:home-planet', HomePlanet);
    this.owner.register('model:evil-minion', EvilMinion);
    this.owner.register('model:evil-minions/yellow-minion', YellowMinion);
    this.owner.register('model:doomsday-device', DoomsdayDevice);
    this.owner.register('model:mediocre-villain', MediocreVillain);
    env.store = this.owner.lookup('service:store');
    env.amsSerializer = this.owner.lookup('serializer:-active-model');
    pretender = new Pretender();
  });

  hooks.afterEach(function() {
    pretender.shutdown();
  });

  test('errors are camelCased and are expected under the `errors` property of the payload', async function(assert) {
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

  test('serialize', function(assert) {
    var tom;
    const league = env.store.createRecord('home-planet', {
      name: 'Villain League',
      id: '123'
    });

    tom = env.store.createRecord('super-villain', {
      firstName: 'Tom',
      lastName: 'Dale',
      homePlanet: league
    });

    var json = env.amsSerializer.serialize(tom._createSnapshot());

    assert.deepEqual(json, {
      first_name: 'Tom',
      last_name: 'Dale',
      home_planet_id: get(league, 'id')
    });
  });

  test('serializeIntoHash', function(assert) {
    const league = env.store.createRecord('home-planet', {
      name: 'Umber',
      id: '123'
    });
    var json = {};

    env.amsSerializer.serializeIntoHash(
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

  test('serializeIntoHash with decamelized types', function(assert) {
    const league = env.store.createRecord('home-planet', {
      name: 'Umber',
      id: '123'
    });
    var json = {};

    env.amsSerializer.serializeIntoHash(
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
});
