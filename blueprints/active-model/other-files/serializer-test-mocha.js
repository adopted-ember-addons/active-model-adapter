import {expect} from 'chai'
import {
  describeModel,
  it
} from 'ember-mocha';

describeModel(
  '<%= dasherizedModuleName %>',
  'Unit | Serializer | <%= dasherizedModuleName %>',
  {
    // Specify the other units that are required for this test.
    needs: ['serializer:<%= dasherizedModuleName %>']
  },
  function () {
    // Replace this with your real tests.
    it('serializes records', function () {
      const record = this.subject();
      const serializedRecord = record.serialize();
      expect(serializedRecord).to.be.ok;
    })
  }
);
