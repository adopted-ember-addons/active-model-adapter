# Changelog

## Master

## 2.2.0 December 22, 2017
- Fix ember-inflector deprecations
- Add more Ember Data scenarios for ember-try
- Update "loader.js" to v4.6.0
- Convert "ember-load-initializers" to npm dependency
- Convert "ember-cli-shims" to npm dependency
- Remove explicit `ember-try` dependency
- Update "ember-cli" to v2.16.2
- CI: Update Node version to 4
- Fix's a regression in ember-data >= 2.4.0 related to arguments changing in RESTAdapter's handleResponse function https://github.com/emberjs/data/pull/3930, pass along requestData as argument in active-model-adapter handleResponse override method as well as fix handleResponse - returns ajax response if not 422 response test (#83)

## 2.1.1 February 17, 2016

- Restore old initializer code from 2.0.3

## 2.1.0 February 17, 2016

- [#80](https://github.com/ember-data/active-model-adapter/pull/80) [bugfix] Allow relationships to not have the _id suffix
- [#51](https://github.com/ember-data/active-model-adapter/pull/51) [bugfix] add tests around errors
- [#52](https://github.com/ember-data/active-model-adapter/pull/52) fix issue where attributes are getting erased when using when using the DS.EmbeddedRecordsMixin with a polymorphic embedded model
- [#57](https://github.com/ember-data/active-model-adapter/pull/57) Test against Ember Data 2.1
- [#60](https://github.com/ember-data/active-model-adapter/pull/60) Do not use application.registry

## 2.0.1 September 2, 2015
- [#34](https://github.com/ember-data/active-model-adapter/pull/34) Remove execute permission

## 2.0.0 August 25, 2015
- [#41](https://github.com/ember-data/active-model-adapter/pull/41) Fix babel rename option warning
- [#42](https://github.com/ember-data/active-model-adapter/pull/42) Remove unused container in instance initializer, fixes #40
- [#43](https://github.com/ember-data/active-model-adapter/pull/43) Fix initializer deprecation warning for >= ember 2.1.0
- [#44](https://github.com/ember-data/active-model-adapter/pull/44) update for Ember Data 2.0

## 1.13.6 August 9, 2015
- [#30](https://github.com/ember-data/active-model-adapter/pull/30) Update CONTRIBUTING.md
- [#32](https://github.com/ember-data/active-model-adapter/pull/32) Set isNewSerializerAPI for ActiveModelSerializer
- [#35](https://github.com/ember-data/active-model-adapter/pull/35) [bugfix RELEASE] Restore polymorphic support
- [#36](https://github.com/ember-data/active-model-adapter/pull/36) Improve code readability

## 1.13.5 July 21, 2015

* Bump version to fix https://github.com/ember-data/active-model-adapter/issues/28

## 1.13.4 July 15, 2015
- [#14](https://github.com/ember-data/active-model-adapter/pull/14) Fix code style in README.md
- [#20](https://github.com/ember-data/active-model-adapter/pull/20) Support for weird polymorphic relationship format
- [#21](https://github.com/ember-data/active-model-adapter/pull/21) Update package.json
- [#27](https://github.com/ember-data/active-model-adapter/pull/27) Polymorphic fixes

## 1.13.3 July 1, 2015
- [#19](https://github.com/ember-data/active-model-adapter/pull/19) cleanup tests, fix bower publishing by generating a new bower.json
- [#8](https://github.com/ember-data/active-model-adapter/pull/8) Have looked up ActiveModelSerializer opt into the new Serializer API

## 1.13.2 June 17, 2015
- [#4](https://github.com/ember-data/active-model-adapter/pull/4) Add missing `.rb` files to be bundled to active-model-adapter gem
- [#5](https://github.com/ember-data/active-model-adapter/pull/5) Depend on `ember-data-source` instead of `ember-source`
- [#6](https://github.com/ember-data/active-model-adapter/pull/6) Fix example code in README.md

## 1.13.1 June 16, 2015
- [#3](https://github.com/ember-data/active-model-adapter/pull/3) add support for new response api

## 1.13.0 June 14, 2015
- Initial Release, active-model-adapter was moved out of the Ember Data repo into its own repo
