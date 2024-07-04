import { AnyObject } from 'active-model-adapter';

const PRIMARY_ATTRIBUTE_KEY = 'base';

interface ErrorObject {
  title: string;
  detail: string;
  source: {
    pointer: string;
  };
}

/**
 * Convert an hash of errors into an array with errors in JSON-API format.
 *
 * ```javascript
 * import { errorsHashToArray } from '@ember-data/adapter/error';
 *
 * let errors = {
 *   base: 'Invalid attributes on saving this record',
 *   name: 'Must be present',
 *   age: ['Must be present', 'Must be a number']
 * };
 * let errorsArray = errorsHashToArray(errors);
 * // [
 * //   {
 * //     title: "Invalid Document",
 * //     detail: "Invalid attributes on saving this record",
 * //     source: { pointer: "/data" }
 * //   },
 * //   {
 * //     title: "Invalid Attribute",
 * //     detail: "Must be present",
 * //     source: { pointer: "/data/attributes/name" }
 * //   },
 * //   {
 * //     title: "Invalid Attribute",
 * //     detail: "Must be present",
 * //     source: { pointer: "/data/attributes/age" }
 * //   },
 * //   {
 * //     title: "Invalid Attribute",
 * //     detail: "Must be a number",
 * //     source: { pointer: "/data/attributes/age" }
 * //   }
 * // ]
 * ```
 * @method errorsHashToArray
 * @for @ember-data/adapter/error
 * @static
 * @param errors hash with errors as properties
 * @return array of errors in JSON-API format
 */
export default function errorsHashToArray(errors: AnyObject) {
  const out: ErrorObject[] = [];

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

function makeArray(value: unknown) {
  return Array.isArray(value) ? value : [value];
}
