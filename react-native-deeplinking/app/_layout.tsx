import { Stack } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import * as Linking from "expo-linking";
import { 
  LDProvider, 
  ReactNativeLDClient,
  AutoEnvAttributes,
} from "@launchdarkly/react-native-client-sdk";

// You'll need to set this in your environment or replace with your Client-side ID
// For React Native, this is called a "mobile key" but it's your client-side ID
const CLIENT_SIDE_ID = process.env.EXPO_PUBLIC_LAUNCHDARKLY_CLIENT_ID || 'your-client-side-id-here';

// Default user context
const getDefaultUserContext = () => ({
  kind: 'user',
  key: 'ski-app-user',
  name: 'Ski App User',
});

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#87CEEB" />
      <Text style={styles.loadingText}>Loading Ski Resort...</Text>
    </View>
  );
}

export default function RootLayout() {
  const [ldClient, setLdClient] = useState<ReactNativeLDClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userContext, setUserContext] = useState(getDefaultUserContext());
  const clientRef = useRef<ReactNativeLDClient | null>(null);

  // Handle deep link URL parsing
  const handleDeepLink = (url: string | null) => {
    if (!url) return false; // Return false if no URL

    console.log('Received deep link:', url);
    
    try {
      const parsedUrl = Linking.parse(url);
      console.log('Parsed URL:', parsedUrl);

      // Check if it's a darkly://setuser URL - handle it and return true to prevent routing
      if (parsedUrl.scheme === 'darkly' && parsedUrl.hostname === 'setuser') {
        const userParam = parsedUrl.queryParams?.magicuser as string | undefined;
        
        if (userParam) {
          console.log('Setting LaunchDarkly user context to:', userParam);
          const newContext = {
            kind: 'user',
            key: userParam,
            name: `User ${userParam}`,
          };
          
          // Update state - the useEffect will handle the identify call
          setUserContext(newContext);
          return true; // Indicate we handled this URL, don't route
        } else {
          console.warn('No magicuser parameter found in deep link');
          return true; // Still handled, just missing param
        }
      }
      
      return false; // Not a darkly:// URL, let Expo Router handle it
    } catch (error) {
      console.error('Error parsing deep link:', error);
      return false;
    }
  };

  // Initialize LaunchDarkly client (only once on mount)
  useEffect(() => {
    // Debug: Print the client ID being used
    console.log('=== LaunchDarkly Debug ===');
    console.log('Client ID from env:', process.env.EXPO_PUBLIC_LAUNCHDARKLY_CLIENT_ID);
    console.log('CLIENT_SIDE_ID value:', CLIENT_SIDE_ID);
    console.log('==========================');

    // Initialize LaunchDarkly client
    const client = new ReactNativeLDClient(
      CLIENT_SIDE_ID,
      AutoEnvAttributes.Enabled
    );

    clientRef.current = client;

    // Use default context for initial identification
    const initialContext = getDefaultUserContext();

    // Identify the user context
    client.identify(initialContext)
      .then(() => {
        console.log('LaunchDarkly client initialized successfully');
        setLdClient(client);
        setIsInitialized(true);
      })
      .catch((error) => {
        console.error('Failed to initialize LaunchDarkly:', error);
        // Still set the client so the app can work without LaunchDarkly
        setLdClient(client);
        setIsInitialized(true);
      });

    // Cleanup on unmount
    return () => {
      client.close();
      clientRef.current = null;
    };
  }, []);

  // Update context when userContext changes (after initial mount)
  useEffect(() => {
    // Skip if not initialized or if it's the default context (initial mount)
    if (!isInitialized || !clientRef.current || userContext.key === 'ski-app-user') {
      return;
    }

    console.log('Updating LaunchDarkly context:', userContext);
    clientRef.current.identify(userContext)
      .then(() => {
        console.log('LaunchDarkly context updated successfully');
      })
      .catch((error) => {
        console.error('Failed to update LaunchDarkly context:', error);
      });
  }, [userContext, isInitialized]);

  // Set up deep linking listeners
  useEffect(() => {
    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL:', url);
        const handled = handleDeepLink(url);
        if (handled) {
          console.log('Deep link handled, preventing Expo Router navigation');
        }
      }
    }).catch((error) => {
      console.error('Error getting initial URL:', error);
    });

    // Handle deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('URL event received:', event.url);
      const handled = handleDeepLink(event.url);
      if (handled) {
        console.log('Deep link handled, preventing Expo Router navigation');
        // Prevent default navigation by not letting Expo Router process this URL
      }
    });

    // Also listen for deep links via canOpenURL to help debug
    Linking.canOpenURL('darkly://setuser').then((canOpen) => {
      console.log('Can open darkly:// URLs:', canOpen);
    }).catch((error) => {
      console.error('Error checking if can open URL:', error);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  if (!ldClient) {
    // Fallback: render without LaunchDarkly provider
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A1929' },
        }}
      />
    );
  }

  return (
    <LDProvider client={ldClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A1929' },
        }}
      />
    </LDProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A1929',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#87CEEB',
  },
});
