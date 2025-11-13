#!/usr/bin/env ruby

# Simple test script to check LaunchDarkly SDK API
require 'launchdarkly-server-sdk'

puts "Testing LaunchDarkly Ruby SDK..."
puts "SDK Version: #{LaunchDarkly::VERSION rescue 'unknown'}"
puts ""

# Test Config
begin
  config = LaunchDarkly::Config.new
  puts "✓ Config.new works"
  puts "  Config methods: #{config.methods.grep(/poll|stream/).join(', ')}"
rescue => e
  puts "✗ Config.new failed: #{e.message}"
end

# Test LDContext
begin
  context = LaunchDarkly::LDContext.create({key: 'test', kind: 'user'})
  puts "✓ LDContext.create works"
rescue => e
  puts "✗ LDContext.create failed: #{e.message}"
  begin
    context = LaunchDarkly::LDContext.new({key: 'test', kind: 'user'})
    puts "✓ LDContext.new works"
  rescue => e2
    puts "✗ LDContext.new also failed: #{e2.message}"
  end
end

puts ""
puts "Test complete!"

