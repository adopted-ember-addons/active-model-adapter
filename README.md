# Ember Data ActiveModel Adapter [![Build Status](https://github.com/adopted-ember-addons/active-model-adapter/actions/workflows/ci.yml/badge.svg)](https://github.com/<OWNER>/<REPOSITORY>/actions/workflows/ci.yml/badge.svg)

## Installation

`ember install active-model-adapter`

- Ember.js v3.24 or above
- Ember CLI v3.24 or above
- Node.js v12 or above

You should make an `ApplicationAdapter` if you don't already have one:

```javascript
// app/adapters/application.js
import ActiveModelAdapter from 'active-model-adapter';

export default class ApplicationAdapter extends ActiveModelAdapter {}
```

If you need to subclass the `ActiveModelSerializer`, you can import it
into your serializer:

```javascript
// app/serializers/post.js

import { ActiveModelSerializer } from 'active-model-adapter';

export default class PostSerializer extends ActiveModelSerializer {}
```

## Description

The ActiveModelAdapter is a subclass of the RESTAdapter designed to integrate
with a JSON API that uses an underscored naming convention instead of camelCasing.

It has been designed to work out of the box with the
[active_model_serializers](http://github.com/rails-api/active_model_serializers)
Ruby gem. This Adapter expects specific settings using ActiveModel::Serializers,
`embed :ids, embed_in_root: true` which sideloads the records.

## JSON Structure

The ActiveModelAdapter expects the JSON returned from your server to follow
the REST adapter conventions substituting underscored keys for camelcased ones.
Unlike the DS.RESTAdapter, async relationship keys must be the singular form
of the relationship name, followed by "\_id" for DS.belongsTo relationships,
or "\_ids" for DS.hasMany relationships.

Since ActiveModelAdapter 2.1.0 however, you don't need the "\_id" or
"\_ids" suffix on keys for relationships.

### Conventional Names

Attribute names in your JSON payload should be the underscored versions of
the attributes in your Ember.js models.
For example, if you have a `Person` model:

```javascript
// app/models/famous-person.js

export default class FamousPerson extends Model {
  @attr() firstName;
  @attr() lastName;
  @attr() occupation;
}
```

The JSON returned should look like this:

```json
{
  "famous_person": {
    "id": 1,
    "first_name": "Barack",
    "last_name": "Obama",
    "occupation": "President"
  }
}
```

Let's imagine that `Occupation` and `Person` are just another model:

```javascript
// app/models/person.js

export default class Person extends Model {
  @attr() firstName;
  @attr() lastName;
  @belongsTo('occupation') occupation;
}

// app/models/occupation.js
export default class Occupation extends Model {
  @attr() name;
  @attr('number') salary;
  @hasMany('person') people;
}
```

The JSON needed to avoid extra server calls, should look like this:

```json
{
  "people": [
    {
      "id": 1,
      "first_name": "Barack",
      "last_name": "Obama",
      "occupation_id": 1
    }
  ],
  "occupations": [
    {
      "id": 1,
      "name": "President",
      "salary": 100000,
      "person_ids": [1]
    }
  ]
}
```

### Polymorphic Relationships

If your model has polymorphic relationships, the ActiveModelAdapter
supports two forms in your response.

When using ActiveModelSerializers in Rails, you can opt into this
payload using the `polymorphic: true` option when calling `has_many` or
`belongs_to`.

```ruby
class BookSerializer
  attributes :id, :name
  belongs_to :person, polymorphic: true
end
```

The first, and preferred format, is to use the name of the relationship
as the key and an object with the type and foreign key as the value.

For example, given the following model definitions:

```javascript
// app/models/book.js
export default class Book extends Model {
  @attr() name;
  @belongsTo('person', { polymorphic: true }) author;
}

// app/models/author.js
export default class Author extends Model {
  @attr() name;
  @hasMany('book') books;
}
```

The object would look like:

```json
{
  "type": "person",
  "id": 1
}
```

and the full payload would look like this:

```javascript
{
  "book": {
    "id": "1",
    "name": "Yes, Please",
    "author": { // these are the lines
      "id": 1, // that define the
      "type": "person" // polymorphic relationship
    }
  },
  "people": [{
    "id": 1,
    "name": "Amy Poehler"
  }]
}
```

The second format allows you to specify using two keys in the model's
payload following the format of `relationship_name_id` and
`relationship_name_type`. **This format does not work with hasMany
relationships.** This format **may also be removed for Ember Data 3.0**;
it is currently only supported for legacy reasons.

Using the above model definitions, the single model response would look
like this:

```javascript
{
  "book": {
    "id": "1",
    "name": "Yes, Please",
    "author_id": 1,         // these two lines
    "author_type": "person" // tell Ember Data what the polymorphic
                            // relationship is.
  }
}
```

The full response would be look like this:

```javascript
{
  "book": {
    "id": "1",
    "name": "Yes, Please",
    "author_id": 1,         // these two lines
    "author_type": "person" // tell Ember Data what the polymorphic
                            // relationship is.
  },
  "people": [{
    "id": 1,
    "name": "Amy Poehler"
  }]
}
```

## Development Installation

- `git clone` this repository
- `yarn install`

## Running Tests

- `ember test`
- `ember test --server`

## Building

- `ember build`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
