# Ember Data ActiveModel Adapter Changelog

## Master
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
