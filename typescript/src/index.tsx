import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { asyncWithLDProvider, LDContext } from 'launchdarkly-react-client-sdk';
import { 
  FlagOverridePlugin, 
  EventInterceptionPlugin 
} from '@launchdarkly/toolbar';

// Pass the same instance of these plugins into both the LaunchDarkly
// React client as well as the developer toolbar
const flagOverridePlugin = new FlagOverridePlugin();
const eventInterceptionPlugin = new EventInterceptionPlugin();

(async () => {
  // Set clientSideID to your own Client-side ID. You can find this in
  // your LaunchDarkly portal under Account settings / Projects
  const context: LDContext = {
    kind: 'context2',
    key: 'test-user-1',
  };

  const LDProvider = await asyncWithLDProvider({
    clientSideID: process.env.REACT_APP_LD_CLIENT_SIDE_ID ?? '',
    context,
    options: {
      plugins: [
        flagOverridePlugin,
        eventInterceptionPlugin,
        // other plugins...
      ],
      // other options...
    },
  });


  const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
  root.render(
    <React.StrictMode>
      <LDProvider>
        <App 
          flagOverridePlugin={flagOverridePlugin}
          eventInterceptionPlugin={eventInterceptionPlugin}
        />
      </LDProvider>
    </React.StrictMode>,
  );

  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
  reportWebVitals();
})();
