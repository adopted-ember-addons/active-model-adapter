# Ember Data ActiveModel Adapter [![Build Status](https://travis-ci.org/ember-data/active-model-adapter.svg?branch=master)](https://travis-ci.org/ember-data/active-model-adapter)

## Installation

### Ember CLI

`ember install active-model-adapter`

### Rails

This gem comes bundled with [Ember
Rails](https://github.com/emberjs/ember-rails). If you want to specify a
specific version in your `Gemfile`, you can reference the
`active-model-adapter-source` gem and it will get loaded by Ember Rails:

```ruby
gem 'active-model-adapter-source', '~>1.13' # or whatever version you need
```

### Bower

`bower install --save active-model-adapter`

### Script Tags

Grab a copy of active-model-adapter.js from http://github.com/ember-data/active-model-adapter-dist

## Usage

You should make an `ApplicationAdapter` if you don't already have one:

```js
// app/adapters/application.js
import ActiveModelAdapter from 'active-model-adapter';

export default ActiveModelAdapter.extend();
```

If you need to subclass the `ActiveModelSerializer`, you can import it
into your serializer:

```js
// app/serializers/post.js

import {ActiveModelSerializer} from 'active-model-adapter';

export default ActiveModelSerializer.extend();
```

## Description

The ActiveModelAdapter is a subclass of the RESTAdapter designed to integrate
with a JSON API that uses an underscored naming convention instead of camelCasing.

It has been designed to work out of the box with the
[active\_model\_serializers](http://github.com/rails-api/active_model_serializers)
Ruby gem. This Adapter expects specific settings using ActiveModel::Serializers,
`embed :ids, embed_in_root: true` which sideloads the records.

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
// app/models/famous-person.js

export default var FamousPerson = DS.Model.extend({
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

Let's imagine that `Occupation`  and `Person` are just another model:

```js
// app/models/person.js

export default var Person = DS.Model.extend({
  firstName: DS.attr('string'),
  lastName: DS.attr('string'),
  occupation: DS.belongsTo('occupation')
});

// app/models/occupation
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

## Development Installation

* `git clone` this repository
* `npm install`
* `bower install`

## Running Tests

* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
