#!/bin/bash

echo "Setting up stream-poll-ruby application..."
echo ""

# Check if bundler is installed
if ! command -v bundle &> /dev/null; then
    echo "Installing bundler..."
    gem install bundler
fi

# Install dependencies
echo "Installing dependencies..."
bundle install

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Create a .env file with your LaunchDarkly SDK key:"
echo "   LAUNCHDARKLY_SDK_KEY=your-sdk-key-here"
echo ""
echo "2. Run the application:"
echo "   ruby app.rb"
echo ""

