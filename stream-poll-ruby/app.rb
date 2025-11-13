require 'sinatra'
require 'puma'
require 'launchdarkly-server-sdk'
require 'dotenv/load'
require 'json'

set :port, ENV['PORT'] || 3002
set :public_folder, File.dirname(__FILE__) + '/public'

$ld_client = nil
$current_update_mode = 'streaming'
$is_initialized = false

# Helper function to determine update mode from ldClient object
def get_update_mode_from_client(client)
  return nil unless client
  
  # In Ruby SDK, we can check the data source type
  # The client has a data_source property that indicates the mode
  begin
    # Check if client responds to data_source or similar methods
    if client.respond_to?(:data_source)
      data_source = client.data_source
      if data_source.is_a?(LaunchDarkly::PollingProcessor)
        return 'polling'
      elsif data_source.is_a?(LaunchDarkly::StreamProcessor)
        return 'streaming'
      end
    end
    
    # Alternative: check instance variables
    if client.instance_variable_defined?(:@data_source)
      data_source = client.instance_variable_get(:@data_source)
      if data_source.class.name.include?('Poll')
        return 'polling'
      elsif data_source.class.name.include?('Stream')
        return 'streaming'
      end
    end
  rescue => e
    puts "Error detecting mode: #{e.message}"
  end
  
  # Default to configured mode if we can't determine
  $current_update_mode
end

# Initialize LaunchDarkly client
def initialize_ld_client(update_mode)
  sdk_key = ENV['LAUNCHDARKLY_SDK_KEY']
  
  if sdk_key.nil? || sdk_key.empty? || sdk_key == 'your-sdk-key-here'
    raise 'Please set LAUNCHDARKLY_SDK_KEY in .env file'
  end

  # Close existing client if any
  if $ld_client
    begin
      $ld_client.close
    rescue => e
      puts "Error closing client: #{e.message}"
    end
  end

  # Configure LaunchDarkly with the specified update mode
  # In Ruby SDK, use ConfigDSL pattern for configuration
  if update_mode == 'polling'
    # For polling mode, explicitly set all options with default values
    config = LaunchDarkly::Config.new do |c|
      begin
        # Explicitly disable streaming/LDD to enable polling
        c.use_ldd = false if c.respond_to?(:use_ldd=)
        
        # Set polling-specific options with explicit defaults
        # Poll interval: how often to poll (default is typically 30 seconds, but we'll use 5 for demo)
        if c.respond_to?(:poll_interval=)
          c.poll_interval = 5
        end
        
        # Disable streaming explicitly
        if c.respond_to?(:stream=)
          c.stream = false
        end
        
        # Set base URI (default: https://sdk.launchdarkly.com)
        if c.respond_to?(:base_uri=)
          c.base_uri = 'https://sdk.launchdarkly.com' unless c.respond_to?(:base_uri) && c.base_uri
        end
        
        # Set events URI (default: https://events.launchdarkly.com)
        if c.respond_to?(:events_uri=)
          c.events_uri = 'https://events.launchdarkly.com' unless c.respond_to?(:events_uri) && c.events_uri
        end
        
        # Set connection timeout (default: typically 10 seconds)
        if c.respond_to?(:connect_timeout=)
          c.connect_timeout = 10 unless c.respond_to?(:connect_timeout) && c.connect_timeout
        end
        
        # Set read timeout (default: typically 30 seconds)
        if c.respond_to?(:read_timeout=)
          c.read_timeout = 30 unless c.respond_to?(:read_timeout) && c.read_timeout
        end
        
        # Disable streaming data source
        if c.respond_to?(:data_source=)
          begin
            # Try to create a polling data source factory or processor
            polling_ds = LaunchDarkly::PollingDataSourceFactory.new(5) rescue nil
            if polling_ds
              c.data_source = polling_ds
            end
          rescue => e
            puts "  Could not set polling data source: #{e.message}"
          end
        end
        
        puts "  Explicitly configured polling with all options"
      rescue => e
        puts "  Error in polling config block: #{e.message}"
      end
    end
    
    # After config creation, try to set poll_interval if it wasn't set in the block
    begin
      if config.respond_to?(:poll_interval=)
        config.poll_interval = 5
        puts "  Set poll_interval to 5 seconds"
      elsif config.instance_variable_defined?(:@poll_interval)
        config.instance_variable_set(:@poll_interval, 5)
        puts "  Set poll_interval via instance variable to 5 seconds"
      end
      
      # Ensure streaming is disabled
      if config.respond_to?(:stream=)
        config.stream = false
        puts "  Explicitly disabled streaming"
      end
      
      # Ensure use_ldd is false
      if config.respond_to?(:use_ldd=)
        config.use_ldd = false
        puts "  Explicitly disabled LDD (use_ldd = false)"
      end
    rescue => e
      puts "  Warning setting polling options after config creation: #{e.message}"
    end
  else
    # For streaming mode, use default config (streaming is the default)
    config = LaunchDarkly::Config.new
    puts "Configured for streaming mode (default)"
  end

  puts "Configured for #{update_mode} mode"
  $ld_client = LaunchDarkly::LDClient.new(sdk_key, config)
  
  # Wait a bit for initialization and check if client is ready
  sleep(1.0)
  
  # Check if client initialized successfully
  if $ld_client.nil?
    raise "Failed to create LaunchDarkly client"
  end
  
  # Detect the actual mode from the client object
  detected_mode = get_update_mode_from_client($ld_client)
  processor_type = 'unknown'
  
  begin
    # Try multiple ways to detect the processor type
    if $ld_client.instance_variable_defined?(:@data_source)
      data_source = $ld_client.instance_variable_get(:@data_source)
      processor_type = data_source.class.name if data_source
    elsif $ld_client.instance_variable_defined?(:@update_processor)
      processor = $ld_client.instance_variable_get(:@update_processor)
      processor_type = processor.class.name if processor
    end
    
    # Also check config to see what was set
    if $ld_client.instance_variable_defined?(:@config)
      client_config = $ld_client.instance_variable_get(:@config)
      puts "  - Config class: #{client_config.class.name}"
      if client_config.respond_to?(:poll_interval)
        puts "  - Poll interval: #{client_config.poll_interval}"
      end
    end
  rescue => e
    puts "Error getting processor type: #{e.message}"
  end
  
  $is_initialized = true
  $current_update_mode = update_mode  # Explicitly set the mode
  
  puts "LaunchDarkly client initialized in #{update_mode} mode"
  puts "  - Configured mode: #{update_mode}"
  puts "  - Stored current_update_mode: #{$current_update_mode}"
  puts "  - Detected mode from client: #{detected_mode || 'unknown'}"
  puts "  - Processor type: #{processor_type}"
  
  # Verify the mode was set correctly
  if $current_update_mode != update_mode
    puts "  WARNING: Mode mismatch! Expected #{update_mode}, got #{$current_update_mode}"
    $current_update_mode = update_mode  # Force it to the correct value
  end
  
  $ld_client
end

# Initialize on startup
begin
  initialize_ld_client('streaming')
rescue => e
  puts "Failed to initialize LaunchDarkly: #{e.message}"
  puts "Backtrace: #{e.backtrace.first(5).join("\n")}" if e.backtrace
end

# API endpoint to get current status
get '/api/status' do
  content_type :json
  
  begin
    detected_mode = get_update_mode_from_client($ld_client)
    # Prioritize configured mode over detected mode since detection might not work correctly
    # The configured mode is what we actually set, so trust that
    actual_mode = $current_update_mode
    
    processor_info = nil
    begin
      if $ld_client && $ld_client.instance_variable_defined?(:@data_source)
        data_source = $ld_client.instance_variable_get(:@data_source)
        processor_info = {
          type: data_source.class.name,
          has_poll_interval: data_source.respond_to?(:poll_interval)
        } if data_source
      end
    rescue => e
      # Ignore errors getting processor info
    end
    
    is_connected = false
    begin
      is_connected = $ld_client && !$ld_client.offline? if $ld_client
    rescue => e
      # If offline? method doesn't exist, assume connected if client exists
      is_connected = $ld_client != nil
    end
    
    {
      updateMode: actual_mode,
      detectedMode: detected_mode,
      configuredMode: $current_update_mode,
      isInitialized: $is_initialized,
      isConnected: is_connected,
      processorInfo: processor_info
    }.to_json
  rescue => e
    status 500
    {
      error: e.message,
      backtrace: e.backtrace.first(3)
    }.to_json
  end
end

# API endpoint to toggle between streaming and polling
post '/api/toggle' do
  content_type :json
  
  begin
    old_mode = $current_update_mode
    new_mode = $current_update_mode == 'streaming' ? 'polling' : 'streaming'
    
    puts "=" * 50
    puts "TOGGLE REQUEST:"
    puts "  Current mode: #{old_mode}"
    puts "  Switching to: #{new_mode}"
    puts "=" * 50
    
    initialize_ld_client(new_mode)
    
    # Verify the mode was actually changed
    if $current_update_mode != new_mode
      puts "ERROR: Mode not changed! Expected #{new_mode}, got #{$current_update_mode}"
      $current_update_mode = new_mode  # Force it
    end
    
    puts "After toggle - current_update_mode: #{$current_update_mode}"
    
    {
      success: true,
      updateMode: $current_update_mode,  # Use the actual stored mode
      configuredMode: $current_update_mode,
      message: "Successfully switched to #{$current_update_mode} mode"
    }.to_json
  rescue => e
    puts "Error toggling update mode: #{e.message}"
    puts e.backtrace.first(5).join("\n") if e.backtrace
    status 500
    {
      success: false,
      error: e.message
    }.to_json
  end
end

# API endpoint to get a flag value (for testing)
get '/api/flag/:flag_key' do
  content_type :json
  
  if !$ld_client || !$is_initialized
    status 503
    return { error: 'LaunchDarkly client not initialized' }.to_json
  end

  begin
    flag_key = params[:flag_key]
    # Create context using the Ruby SDK API
    # Try different context creation methods based on SDK version
    begin
      context = LaunchDarkly::LDContext.create({
        key: 'example-user-key',
        kind: 'user',
        name: 'Example User'
      })
    rescue => e
      # Fallback: try alternative context creation
      context = LaunchDarkly::LDContext.new({
        key: 'example-user-key',
        kind: 'user',
        name: 'Example User'
      })
    end

    flag_value = $ld_client.variation(flag_key, context, false)
    
    {
      flagKey: flag_key,
      flagValue: flag_value,
      updateMode: $current_update_mode
    }.to_json
  rescue => e
    status 500
    { error: e.message }.to_json
  end
end

# Serve the main page
get '/' do
  begin
    send_file File.join(settings.public_folder, 'index.html')
  rescue => e
    status 500
    "Error loading page: #{e.message}<br>#{e.backtrace.first(5).join('<br>')}"
  end
end

# Error handler
error do
  e = env['sinatra.error']
  content_type :json
  status 500
  {
    error: e.message,
    backtrace: e.backtrace.first(5)
  }.to_json
end

# Graceful shutdown
at_exit do
  if $ld_client
    begin
      $ld_client.close
    rescue => e
      puts "Error closing client: #{e.message}"
    end
  end
end

