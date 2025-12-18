# LaunchDarkly Demos

This repository contains various demo applications showcasing different LaunchDarkly SDK features and integrations.

## Available Demos

### [java-sdk-js-client-sdk-persistent](./java-sdk-js-client-sdk-persistent/)
**Java SDK with Redis Persistence + JavaScript Client Bootstrap**

Demonstrates using a persistent Redis datastore with the LaunchDarkly Java Server SDK and bootstrapping a JavaScript client-side application from that data. Includes two applications:
- **Java Application**: Spring Boot app that persists flag data to Redis and provides a bootstrap endpoint
- **JavaScript Application**: Client-side app that bootstraps initial flag data from the Java app

**Key Features:**
- Redis persistent feature store
- Bootstrap API endpoint for client-side SDKs
- Resilience when LaunchDarkly is unavailable
- Swagger UI for API documentation

---

### [node-fdn-v2-persistence](./node-fdn-v2-persistence/)
**Node.js FDNv2 Redis Persistence Demo**

A Node.js/Express application demonstrating LaunchDarkly FDNv2 (Feature Data Network v2) with Redis persistence for resilience during LaunchDarkly outages. The application serves from cache at all times and can bootstrap from Redis when LaunchDarkly is unavailable.

**Key Features:**
- Redis persistent feature store with FDNv2
- Online/offline mode switching via environment variable
- Continues serving from cache during LaunchDarkly outages
- Bootstrap from Redis on startup when LaunchDarkly is unavailable
- Configurable flag key and SDK key via environment variables
- Dynamic context via URL parameter (`?name=xxx`)
- Detailed flag evaluation logging with `variationDetail`

---

### [progressive-rollout](./progressive-rollout/)
**Progressive Rollout Grid Visualization**

A plain JavaScript application that displays a 10x10 grid of 100 users, with each cell controlled by its own LaunchDarkly client instance. Perfect for demonstrating progressive rollouts and user targeting.

**Key Features:**
- 100 individual LaunchDarkly client instances
- Real-time flag updates via streaming
- Visual indicators (blue/red cells with checkmarks/X)
- Dynamic count of enabled/disabled users
- No build step required - just HTML, CSS, and JavaScript

---

### [react-native-deeplinking](./react-native-deeplinking/)
**React Native Ski Ticket App with Deep Linking**

A React Native mobile application built with Expo for purchasing ski lift tickets. Demonstrates LaunchDarkly integration with deep linking to dynamically set user context.

**Key Features:**
- Cross-platform (iOS and Android)
- LaunchDarkly feature flags control ticket visibility
- Deep linking support (`darkly://setuser?magicuser=XXX`)
- Dynamic user context updates
- Beautiful winter-themed UI

---

### [stream-poll](./stream-poll/)
**Node.js Streaming vs Polling Demo**

A Node.js/Express application that demonstrates dynamically switching between streaming and polling update modes for the LaunchDarkly SDK.

**Key Features:**
- Runtime mode switching (streaming ↔ polling)
- Web interface for control
- Real-time status display
- REST API endpoints

---

### [stream-poll-ruby](./stream-poll-ruby/)
**Ruby Streaming vs Polling Demo**

A Ruby/Sinatra application demonstrating the same streaming vs polling functionality as the Node.js version, but implemented in Ruby.

**Key Features:**
- Dynamic mode switching at runtime
- Web interface
- Ruby implementation
- REST API endpoints

---

### [dotnet-maui](./dotnet-maui/)
**.NET MAUI Office Reservations App**

A .NET MAUI (Multi-platform App UI) application demonstrating LaunchDarkly's client-side .NET SDK on mobile and desktop platforms. The app includes an office hoteling system for reserving desks and conference rooms, with feature flags controlling functionality.

**Key Features:**
- Cross-platform support (iOS, Android, macOS Catalyst, Windows)
- Office hoteling system with desk and conference room reservations
- Real-time flag updates via streaming
- Multi-context support (user + office location)
- Feature flag controls conference room availability
- Office-specific conference room naming (Downtown LA, Burbank, etc.)

**Platforms Supported:**
- iOS (Simulator and Device)
- Android (Emulator and Device)
- macOS Catalyst
- Windows

**Includes:**
- **MAUI App**: Full-featured mobile/desktop application (`ReservationsDotnetMaui`)
- **Console App**: Simple command-line demo (`DotNetConsoleApp`) for testing SDK integration without mobile development tools

---

### [typescript-context](./typescript-context/)
**TypeScript React Client-Side SDK Demo**

A Create React App TypeScript application demonstrating the LaunchDarkly React Client SDK with real-time flag updates and showing context.

**Key Features:**
- React hooks integration (`useFlags`, `useBoolVariation`)
- TypeScript support
- Real-time flag updates without page refresh
- Example components and context management

---

### [unit-testing](./unit-testing/)
**LaunchDarkly Unit Testing Demo**

A TypeScript Node.js application demonstrating how to unit test code that uses LaunchDarkly feature flags, including mocking and test data setup.

**Key Features:**
- Jest testing framework
- LaunchDarkly SDK mocking
- Test data examples
- Unit test patterns


