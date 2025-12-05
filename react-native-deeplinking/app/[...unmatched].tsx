import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';

// This catch-all route handles unmatched routes, including darkly:// URLs
// We redirect back to home since darkly:// URLs are handled in _layout.tsx
export default function UnmatchedRoute() {
  useEffect(() => {
    // Check if this is a darkly:// URL that was mistakenly routed
    Linking.getInitialURL().then((url) => {
      if (url && url.startsWith('darkly://')) {
        console.log('Caught darkly:// URL in unmatched route, redirecting to home');
      }
    });
  }, []);

  // Redirect to home - darkly:// URLs are handled in _layout.tsx
  return <Redirect href="/" />;
}

