import RESTSerializer from '@ember-data/serializer/rest';
import Store from '@ember-data/store';
import Model from '@ember-data/model';
import DS from 'ember-data';
import { AnyObject } from 'active-model-adapter';
import type ModelRegistry from 'ember-data/types/registries/model';
declare type ModelKeys<K> = Exclude<keyof K, keyof DS.Model>;
declare type RelationshipsFor<K extends keyof ModelRegistry> = ModelKeys<
  ModelRegistry[K]
>;
interface RelationshipMetaOptions {
  async?: boolean;
  inverse?: string;
  polymorphic?: boolean;
  [k: string]: unknown;
}
interface RelationshipMeta<K extends keyof ModelRegistry> {
  key: RelationshipsFor<K>;
  kind: 'belongsTo' | 'hasMany';
  type: keyof ModelRegistry;
  options: RelationshipMetaOptions;
  name: RelationshipsFor<K>;
  isRelationship: true;
}
/**
  @module ember-data
 */
declare type RelationshipKind = 'belongsTo' | 'hasMany';
/**
  The ActiveModelSerializer is a subclass of the RESTSerializer designed to integrate
  with a JSON API that uses an underscored naming convention instead of camelCasing.
  It has been designed to work out of the box with the
  [active\_model\_serializers](http://github.com/rails-api/active_model_serializers)
  Ruby gem. This Serializer expects specific settings using ActiveModel::Serializers,
  `embed :ids, embed_in_root: true` which sideloads the records.

  This serializer extends the DS.RESTSerializer by making consistent
  use of the camelization, decamelization and pluralization methods to
  normalize the serialized JSON into a format that is compatible with
  a conventional Rails backend and Ember Data.

  ## JSON Structure

  The ActiveModelSerializer expects the JSON returned from your server
  to follow the REST adapter conventions substituting underscored keys
  for camelcased ones.

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
*/
export default class ActiveModelSerializer extends RESTSerializer {
  store: Store;
  /**
      Converts camelCased attributes to underscored when serializing.
    */
  keyForAttribute(attr: string): string;
  /**
      Underscores relationship names and appends "_id" or "_ids" when serializing
      relationship keys.
    */
  keyForRelationship(relationshipModelName: string, kind?: string): string;
  /**
     `keyForLink` can be used to define a custom key when deserializing link
     properties. The `ActiveModelSerializer` camelizes link keys by default.
  
    */
  keyForLink(key: string, _relationshipKind: RelationshipKind): string;
  serializeHasMany(): void;
  /**
     Underscores the JSON root keys when serializing.
    */
  payloadKeyFromModelName(modelName: string | number): string;
  /**
      Serializes a polymorphic type as a fully capitalized model name.
    */
  serializePolymorphicType<K extends keyof ModelRegistry>(
    snapshot: DS.Snapshot<K>,
    json: Payload,
    relationship: RelationshipMeta<K>
  ): void;
  /**
      Add extra step to `DS.RESTSerializer.normalize` so links are normalized.
  
      If your payload looks like:
  
      ```js
      {
        "post": {
          "id": 1,
          "title": "Rails is omakase",
          "links": { "flagged_comments": "api/comments/flagged" }
        }
      }
      ```
  
      The normalized version would look like this
  
      ```js
      {
        "post": {
          "id": 1,
          "title": "Rails is omakase",
          "links": { "flaggedComments": "api/comments/flagged" }
        }
      }
      ```
    */
  normalize(typeClass: Model, hash: AnyObject, prop: string): AnyObject;
  /**
      Convert `snake_cased` links  to `camelCase`
    */
  normalizeLinks(data: any): void;
  /**
   * @private
   */
  _keyForIDLessRelationship(
    key: string,
    relationshipType: RelationshipKind
  ): string;
  extractRelationships(modelClass: Model, resourceHash: AnyObject): AnyObject;
  modelNameFromPayloadKey(key: string): string;
}
interface Payload {
  [key: string]: any;
}
export {};
