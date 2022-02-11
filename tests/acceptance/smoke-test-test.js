import { module, test } from 'qunit';
import { visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import defaultScenario from 'dummy/mirage/scenarios/default';

module('Acceptance | smoke test', function (hooks) {
  setupApplicationTest(hooks);

  setupMirage(hooks);

  test('visiting /smoke-test', async function (assert) {
    defaultScenario(this.server);

    await visit('/');

    assert.dom('li').exists({ count: 2 });
  });
});
