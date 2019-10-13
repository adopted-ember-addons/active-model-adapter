import DS from 'ember-data';
import Ember from 'ember';
import { singularize, pluralize } from 'ember-inflector';
import { classify, decamelize, camelize, underscore } from '@ember/string';

/**
  @module ember-data
 */

const { RESTSerializer, normalizeModelName } = DS;
type RelationshipKind = 'belongsTo' | 'hasMany';

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
  App.FamousPerson = DS.Model.extend({
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
  App.Person = DS.Model.extend({
    firstName: DS.attr('string'),
    lastName: DS.attr('string'),
    occupation: DS.belongsTo('occupation')
  });

  App.Occupation = DS.Model.extend({
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
  // SERIALIZE

  /**
    Converts camelCased attributes to underscored when serializing.
  */
  keyForAttribute(attr: string) {
    return decamelize(attr);
  }

  /**
    Underscores relationship names and appends "_id" or "_ids" when serializing
    relationship keys.
  */
  keyForRelationship(relationshipModelName: string, kind?: string) {
    var key = decamelize(relationshipModelName);
    if (kind === 'belongsTo') {
      return key + '_id';
    } else if (kind === 'hasMany') {
      return singularize(key) + '_ids';
    } else {
      return key;
    }
  }

  /**
   `keyForLink` can be used to define a custom key when deserializing link
   properties. The `ActiveModelSerializer` camelizes link keys by default.

   @method keyForLink
   @param {String} key
   @param {String} kind `belongsTo` or `hasMany`
   @return {String} normalized key
  */
  keyForLink(key: string, _relationshipKind: RelationshipKind) {
    return camelize(key);
  }

  /*
    Does not serialize hasMany relationships by default.
  */
  serializeHasMany() {}

  /**
   Underscores the JSON root keys when serializing.
  */
  payloadKeyFromModelName(modelName: string | number) {
    return underscore(decamelize(modelName as string));
  }

  /**
    Serializes a polymorphic type as a fully capitalized model name.
  */
  serializePolymorphicType(snapshot: DS.Snapshot, json: Payload, relationship: Relationship) {
    var key = relationship.key;
    var belongsTo = snapshot.belongsTo(key);
    var jsonKey = underscore(key + '_type');

    if (Ember.isNone(belongsTo)) {
      json[jsonKey] = null;
    } else {
      json[jsonKey] = classify(belongsTo.modelName).replace('/', '::');
    }
  }

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
  normalize(typeClass: DS.Model, hash: any, prop: string) {
    this.normalizeLinks(hash);
    return super.normalize(typeClass, hash, prop);
  }

  /**
    Convert `snake_cased` links  to `camelCase`
  */

  normalizeLinks(data: any) {
    if (data.links) {
      var links = data.links;

      for (var link in links) {
        var camelizedLink = camelize(link);

        if (camelizedLink !== link) {
          links[camelizedLink] = links[link];
          delete links[link];
        }
      }
    }
  }

  /**
   * @private
   */
  _keyForIDLessRelationship(key: string, relationshipType: RelationshipKind) {
    if (relationshipType === 'hasMany') {
      return underscore(pluralize(key));
    } else {
      return underscore(singularize(key));
    }
  }

  extractRelationships(modelClass: DS.Model, resourceHash: any) {
    modelClass.eachRelationship<any>((key, relationshipMeta) => {
      var relationshipKey = this.keyForRelationship(
        key,
        relationshipMeta.kind
      );

      var idLessKey = this._keyForIDLessRelationship(
        key,
        relationshipMeta.kind
      );

      // converts post to post_id, posts to post_ids
      if (
        resourceHash[idLessKey] &&
        typeof relationshipMeta[relationshipKey] === 'undefined'
      ) {
        resourceHash[relationshipKey] = resourceHash[idLessKey];
      }

      // prefer the format the AMS gem expects, e.g.:
      // relationship: {id: id, type: type}
      if (relationshipMeta.options.polymorphic) {
        extractPolymorphicRelationships(
          key,
          relationshipMeta,
          resourceHash,
          relationshipKey
        );
      }
      // If the preferred format is not found, use {relationship_name_id, relationship_name_type}
      if (
        resourceHash.hasOwnProperty(relationshipKey) &&
        typeof resourceHash[relationshipKey] !== 'object'
      ) {
        var polymorphicTypeKey = this.keyForRelationship(key) + '_type';
        if (
          resourceHash[polymorphicTypeKey] &&
          relationshipMeta.options.polymorphic
        ) {
          let id = resourceHash[relationshipKey];
          let type = resourceHash[polymorphicTypeKey];
          delete resourceHash[polymorphicTypeKey];
          delete resourceHash[relationshipKey];
          resourceHash[relationshipKey] = { id: id, type: type };
        }
      }
    }, this);
    return super.extractRelationships(modelClass, resourceHash);
  }

  modelNameFromPayloadKey(key: string) {
    var convertedFromRubyModule = singularize(key.replace('::', '/'));
    return normalizeModelName(convertedFromRubyModule);
  }
}

function extractPolymorphicRelationships(
  key: string,
  _relationshipMeta: any,
  resourceHash: any,
  relationshipKey: string
) {
  let polymorphicKey = decamelize(key);
  let hash = resourceHash[polymorphicKey];
  if (hash !== null && typeof hash === 'object') {
    resourceHash[relationshipKey] = hash;
  }
}

 interface Payload {
  [key: string]: any;
 }
 interface Relationship {
   key: string;
 }
