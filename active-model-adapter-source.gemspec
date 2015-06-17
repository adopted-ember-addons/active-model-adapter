# -*- encoding: utf-8 -*-
require './lib/ember/data/active_model/adapter/version'

Gem::Specification.new do |gem|
  gem.name          = "active-model-adapter-source"
  gem.authors       = ["Igor Terzic", "Yehuda Katz", "Tom Dale"]
  gem.email         = ["wycats@gmail.com"]
  gem.date          = Time.now.strftime("%Y-%m-%d")
  gem.summary       = %q{active-model-adapter source code wrapper.}
  gem.description   = %q{ember-data active-model-adapter code wrapper for use with Ruby libs.}
  gem.homepage      = "https://github.com/ember-data/active-model-adapter"
  gem.version       = Ember::Data::ActiveModel::Adapter::VERSION
  gem.license       = "MIT"

  gem.add_dependency "ember-source", ">= 1.8", "< 3.0"

  gem.files = %w(package.json) + Dir['dist/active-model*.js'] + Dir['lib/ember/data/**/*.rb']
end
