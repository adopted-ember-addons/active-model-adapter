import Ember from 'ember';
import DS from 'ember-data';
import { pluralize } from 'ember-inflector';
import ModelRegistry from 'ember-data/types/registries/model';
import RESTAdapter from 'ember-data/adapters/rest';
import { AnyObject } from 'active-model-adapter';

const { InvalidError, errorsHashToArray } = DS;

const { decamelize, underscore } = Ember.String;

interface ActiveModelPayload {
  errors: AnyObject;
}

/**
  @module ember-data
*/

/**
  The ActiveModelAdapter is a subclass of the RESTAdapter designed to integrate
  with a JSON API that uses an underscored naming convention instead of camelCasing.
  It has been designed to work out of the box with the
  [active\_model\_serializers](http://github.com/rails-api/active_model_serializers)
  Ruby gem. This Adapter expects specific settings using ActiveModel::Serializers,
  `embed :ids, embed_in_root: true` which sideloads the records.

  This adapter extends the DS.RESTAdapter by making consistent use of the camelization,
  decamelization and pluralization methods to normalize the serialized JSON into a
  format that is compatible with a conventional Rails backend and Ember Data.

  ## JSON Structure

  The ActiveModelAdapter expects the JSON returned from your server to follow
  the REST adapter conventions substituting underscored keys for camelcased ones.

  Unlike the DS.RESTAdapter, async relationship keys must be the singular form
  of the relationship name, followed by "_id" for DS.belongsTo relationships,
  or "_ids" for DS.hasMany relationships.

  ### Conventional Names

  Attribute names in your JSON payload should be the underscored versions of
  the attributes in your Ember.js models.

  For example, if you have a `Person` model:

  ```js
  export default DS.Model.extend({
    firstName: DS.attr('string'),
    lastName: DS.attr('string'),
    occupation: DS.attr('string')
  });
  ```

  The JSON returned should look like this:

  ```js
  {
    "famous_person": {
      "id": 1,
      "first_name": "Barack",
      "last_name": "Obama",
      "occupation": "President"
    }
  }
  ```

  Let's imagine that `Occupation` is just another model:

  ```js
  export default DS.Model.extend({
    firstName: DS.attr('string'),
    lastName: DS.attr('string'),
    occupation: DS.belongsTo('occupation')
  });

  export default DS.Model.extend({
    name: DS.attr('string'),
    salary: DS.attr('number'),
    people: DS.hasMany('person')
  });
  ```

  The JSON needed to avoid extra server calls, should look like this:

  ```js
  {
    "people": [{
      "id": 1,
      "first_name": "Barack",
      "last_name": "Obama",
      "occupation_id": 1
    }],

    "occupations": [{
      "id": 1,
      "name": "President",
      "salary": 100000,
      "person_ids": [1]
    }]
  }
  ```

  @class ActiveModelAdapter
  @constructor
  @namespace DS
  @extends DS.RESTAdapter
**/

export default class ActiveModelAdapter extends RESTAdapter {
  defaultSerializer = '-active-model';
  /**
    The ActiveModelAdapter overrides the `pathForType` method to build
    underscored URLs by decamelizing and pluralizing the object type name.

    ```js
      this.pathForType("famousPerson");
      //=> "famous_people"
    ```
*/
  pathForType<K extends keyof ModelRegistry>(modelName: K): string {
    const decamelized = decamelize(modelName as string);
    const underscored = underscore(decamelized);
    return pluralize(underscored);
  }

  /**
    The ActiveModelAdapter overrides the `handleResponse` method
    to format errors passed to a DS.InvalidError for all
    422 Unprocessable Entity responses.

    A 422 HTTP response from the server generally implies that the request
    was well formed but the API was unable to process it because the
    content was not semantically correct or meaningful per the API.

    For more information on 422 HTTP Error code see 11.2 WebDAV RFC 4918
    https://tools.ietf.org/html/rfc4918#section-11.2
  */
  handleResponse(
    status: number,
    headers: AnyObject,
    payload: ActiveModelPayload,
    requestData: AnyObject | DS.AdapterError
  ): AnyObject | DS.InvalidError {
    if (this.isInvalid(status, headers, payload)) {
      const errors = errorsHashToArray(payload.errors);

      return new InvalidError(errors);
    } else {
      return super.handleResponse(status, headers, payload, requestData);
    }
  }
}
