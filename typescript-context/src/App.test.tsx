import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { FlagOverridePlugin, EventInterceptionPlugin } from '@launchdarkly/toolbar';

test('renders learn react link', () => {
  const flagOverridePlugin = new FlagOverridePlugin();
  const eventInterceptionPlugin = new EventInterceptionPlugin();
  render(<App flagOverridePlugin={flagOverridePlugin} eventInterceptionPlugin={eventInterceptionPlugin} />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
