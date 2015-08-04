require 'ember/data/active_model/adapter/version'

module Ember
  module Data
    module ActiveModel
      module Adapter
        module Source
          def self.bundled_path_for(distro)
            File.expand_path("../../../../../../dist/#{distro}", __FILE__)
          end
        end
      end
    end
  end
end
