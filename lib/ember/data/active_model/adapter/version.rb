require 'json'

module Ember
  module Data
    module ActiveModel
      module Adapter
        package = File.read(File.expand_path('../../../../../../package.json', __FILE__))
        VERSION = JSON.parse(package)['version'].strip.gsub(/[-\+]/, '.')
      end
    end
  end
end
