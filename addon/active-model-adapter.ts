import RESTAdapter from '@ember-data/adapter/rest';
import AdapterError, {
  InvalidError,
} from '@ember-data/adapter/error';
import { pluralize } from 'ember-inflector';
import { AnyObject } from 'active-model-adapter';
import { decamelize, underscore } from '@ember/string';
// eslint-disable-next-line ember/use-ember-data-rfc-395-imports
import ModelRegistry from 'ember-data/types/registries/model';

interface ActiveModelPayload {
  errors: AnyObject;
}

/**
  @module ember-data
*/

const PRIMARY_ATTRIBUTE_KEY = 'base';
function makeArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}
type JsonApiError = Record<string, unknown>
/**
 * Copied from ember-data's 4.12.4 implementation after removal in ember-data 5.0
 * https://github.com/emberjs/data/blob/a0d60c073bc03631277b258aaaadfc910e0a31dc/packages/adapter/src/error.js#L395-L429
 * Types inferred from similar private function
 * https://github.com/emberjs/data/blob/84a15401a7d2a6f8a7efcc2492834c80a27afcc0/packages/legacy-compat/src/legacy-network-handler/legacy-network-handler.ts#L265-L289
 */
function errorsHashToArray(errors: Record<string, string | string[]>): JsonApiError[] {
  const out: JsonApiError[] = [];

  if (errors) {
    Object.keys(errors).forEach((key) => {
      const messages = makeArray(errors[key]);
      for (let i = 0; i < messages.length; i++) {
        let title = 'Invalid Attribute';
        let pointer = `/data/attributes/${key}`;
        if (key === PRIMARY_ATTRIBUTE_KEY) {
          title = 'Invalid Document';
          pointer = `/data`;
        }
        out.push({
          title: title,
          detail: messages[i],
          source: {
            pointer: pointer,
          },
        });
      }
    });
  }

  return out;
}

/**
 * The ActiveModelAdapter is a subclass of the RESTAdapter designed to integrate
 * with a JSON API that uses an underscored naming convention instead of camelCasing.
 * It has been designed to work out of the box with the
 * [active\_model\_serializers](http://github.com/rails-api/active_model_serializers)
 * Ruby gem. This Adapter expects specific settings using ActiveModel::Serializers,
 * `embed :ids, embed_in_root: true` which sideloads the records.
 *
 * This adapter extends the DS.RESTAdapter by making consistent use of the camelization,
 * decamelization and pluralization methods to normalize the serialized JSON into a
 * format that is compatible with a conventional Rails backend and Ember Data.
 *
 * ## JSON Structure
 *
 * The ActiveModelAdapter expects the JSON returned from your server to follow
 * the REST adapter conventions substituting underscored keys for camelcased ones.
 *
 * Unlike the DS.RESTAdapter, async relationship keys must be the singular form
 * of the relationship name, followed by "_id" for DS.belongsTo relationships,
 * or "_ids" for DS.hasMany relationships.
 *
 * ### Conventional Names
 *
 * Attribute names in your JSON payload should be the underscored versions of
 * the attributes in your Ember.js models.
 *
 * For example, if you have a `Person` model:
 *
 * ```javascript
 * export default class FamousPerson extends Model {
 *   @attr() firstName;
 *   @attr() lastName;
 *   @attr() occupation;
 * }
 * ```
 *
 * The JSON returned should look like this:
 *
 * ```json
 * {
 *   "famous_person": {
 *     "id": 1,
 *     "first_name": "Barack",
 *     "last_name": "Obama",
 *     "occupation": "President"
 *   }
 * }
 * ```
 *
 * Let's imagine that `Occupation` is just another model:
 *
 * ```javascript
 * export default class Person extends Model {
 *   @attr() firstName;
 *   @attr() lastName;
 *   @belongsTo('occupation') occupation;
 * }
 *
 * export default class Occupation extends Model {
 *   @attr() name;
 *   @attr('number') salary;
 *   @hasMany('person') people;
 * }
 * ```
 *
 * The JSON needed to avoid extra server calls, should look like this:
 *
 * ```json
 * {
 *   "people": [{
 *     "id": 1,
 *     "first_name": "Barack",
 *     "last_name": "Obama",
 *     "occupation_id": 1
 *   }],
 *
 *   "occupations": [{
 *     "id": 1,
 *     "name": "President",
 *     "salary": 100000,
 *     "person_ids": [1]
 *   }]
 * }
 * ```
 *
 * @class ActiveModelAdapter
 * @constructor
 * @namespace DS
 * @extends DS.RESTAdapter
 */
export default class ActiveModelAdapter extends RESTAdapter {
  defaultSerializer = '-active-model';
  /**
   * The ActiveModelAdapter overrides the `pathForType` method to build
   * underscored URLs by decamelizing and pluralizing the object type name.
   *
   * ```js
   *   this.pathForType("famousPerson");
   *   //=> "famous_people"
   * ```
   *
   * @method pathForType
   * @param {String} modelName
   * @return String
   */
  pathForType<K extends keyof ModelRegistry>(modelName: K): string {
    const decamelized = decamelize(modelName as string);
    const underscored = underscore(decamelized);
    return pluralize(underscored);
  }

  /**
   * The ActiveModelAdapter overrides the `handleResponse` method
   * to format errors passed to a DS.InvalidError for all
   * 422 Unprocessable Entity responses.
   *
   * A 422 HTTP response from the server generally implies that the request
   * was well formed but the API was unable to process it because the
   * content was not semantically correct or meaningful per the API.
   *
   * For more information on 422 HTTP Error code see 11.2 WebDAV RFC 4918
   * https://tools.ietf.org/html/rfc4918#section-11.2
   *
   * @method handleResponse
   * @param  {Number} status
   * @param  {Object} headers
   * @param  {Object} payload
   * @return {Object | AdapterError} response
   */
  handleResponse(
    status: number,
    headers: AnyObject,
    payload: ActiveModelPayload,
    requestData: AnyObject | AdapterError
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    if (this.isInvalid(status, headers, payload)) {
      const errors = errorsHashToArray(payload.errors);

      return new InvalidError(errors);
    } else {
      return super.handleResponse(status, headers, payload, requestData);
    }
  }
}
