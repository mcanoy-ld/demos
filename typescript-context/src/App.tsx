import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { useFlags, useLDClient } from 'launchdarkly-react-client-sdk';
import contextsData from './contexts.json';
import { HamburgerMenu, Pipelines } from './components';
import { 
  LaunchDarklyToolbar,
  FlagOverridePlugin, 
  EventInterceptionPlugin 
} from '@launchdarkly/toolbar';

interface AppProps {
  flagOverridePlugin: FlagOverridePlugin;
  eventInterceptionPlugin: EventInterceptionPlugin;
}

function App({ flagOverridePlugin, eventInterceptionPlugin }: AppProps) {

  const ldClient = useLDClient();
  const { widgetOne, soCal } = useFlags();

  const [selectedContextKey, setSelectedContextKey] = useState<string>('');
  const [storedValue, setStoredValue] = useState({});
  const [currentModule, setCurrentModule] = useState<string>('main');

  // Call ldClient.identify whenever storedValue changes
  useEffect(() => {
    if (ldClient && Object.keys(storedValue).length > 0) {
      ldClient.identify(storedValue);
    }
  }, [storedValue, ldClient]);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedKey = event.target.value;
      setSelectedContextKey(selectedKey);
      
      // Update storedValue immediately when a context is selected
      if (selectedKey) {
          const selectedContext = contextsData.find(context => {
              if (context.kind === 'multi') {
                  return context.user?.key === selectedKey;
              }
              return context.key === selectedKey;
          });
          if (selectedContext) {
              setStoredValue(selectedContext);
          }
      } else {
          setStoredValue({"anonymous": true, "key": "anonymous"});
      }
  };

  const handleNavigation = (module: string) => {
    setCurrentModule(module);
  };

  const renderModuleContent = () => {
    switch (currentModule) {
      case 'settings':
        return (
          <div className="module-content">
            <h2>Settings Module</h2>
            <p>This is the settings module content.</p>
          </div>
        );
      case 'profile':
        return <Pipelines />;
      case 'help':
        return (
          <div className="module-content">
            <h2>Help Module</h2>
            <p>This is the help module content.</p>
          </div>
        );
      default:
        return (
          <div className="panels-container">
            {/* Left Panel - Choose Context */}
            <div className="panel">
              <h3>Context</h3>
              <select 
                  value={selectedContextKey} 
                  onChange={handleSelectChange}
                  className="context-select"
              >
                  <option value="">Select a context...</option>
                  {contextsData.map((context) => {
                      if (context.kind === 'multi') {
                          return (
                              <option key={context.user?.key || context.key} value={context.user?.key || context.key}>
                                  {context.user?.name || context.name}
                              </option>
                          );
                      }
                      return (
                          <option key={context.key} value={context.key}>
                              {context.name}
                          </option>
                      );
                  })}
              </select>
            </div>

            {/* Middle Panel - Context Display */}
            <div className="panel">
              <h3>Json</h3>
              <pre className='json-pretty context-display'>
                {JSON.stringify(storedValue, null, 2)}
              </pre>
            </div>

            {/* Right Panel - Flag Results */}
            <div className="panel">
              <h3>Flag Results</h3>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '12px' }}>
                <div className={`flag-box ${widgetOne ? 'on' : 'off'}`}>
                  {widgetOne ? '✓ Widget Flag ON' : '✗ Widget Flag OFF'}
                </div>
                <div className={`flag-box ${soCal ? 'on' : 'off'}`}>
                  {soCal ? '✓ So Cal Flag ON' : '✗ So Cal Flag OFF'}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        {/* Hamburger Menu */}
        <HamburgerMenu onNavigate={handleNavigation} />
        
        <div className="app-title-section">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="app-title">LaunchDarkly Context Demo</h1>
          <p className="app-subtitle">Test feature flags with different contexts</p>
        </div>
        {renderModuleContent()}
      </header>
      {/* LaunchDarkly Toolbar */}
      {process.env.NODE_ENV === 'development' && (
        <LaunchDarklyToolbar
          flagOverridePlugin={flagOverridePlugin}
          eventInterceptionPlugin={eventInterceptionPlugin}
          //devServerUrl="http://localhost:3001"
          projectKey="my-project"
          position="right"
        />
      )}
    </div>
  );
}

export default App;
