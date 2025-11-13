#!/usr/bin/env ruby

require 'launchdarkly-server-sdk'

puts "Testing LaunchDarkly Config API..."
puts ""

config = LaunchDarkly::Config.new

puts "Config class: #{config.class.name}"
puts "Config methods related to poll/stream:"
puts config.methods.grep(/poll|stream|ldd|data/).sort.join(', ')
puts ""

puts "Config instance variables:"
puts config.instance_variables.map { |v| "#{v}: #{config.instance_variable_get(v).class.name rescue 'N/A'}" }.join("\n")
puts ""

# Try to see what options Config.new accepts
puts "Checking Config.new signature..."
begin
  # Try with hash
  config2 = LaunchDarkly::Config.new(poll_interval: 5)
  puts "✓ Config.new accepts hash with poll_interval"
rescue => e
  puts "✗ Config.new with hash failed: #{e.message}"
end

begin
  # Try with block
  config3 = LaunchDarkly::Config.new do |c|
    puts "  Block received config object: #{c.class.name}"
  end
  puts "✓ Config.new accepts block"
rescue => e
  puts "✗ Config.new with block failed: #{e.message}"
end

puts ""
puts "Test complete!"

