# LaunchDarkly Spring Boot Application with Redis Persistence

This Spring Boot application demonstrates LaunchDarkly SDK integration with Redis as a persistent feature store. The application includes Swagger UI for API documentation and provides a REST API for evaluating feature flags.

## Features

- **LaunchDarkly SDK Integration**: Full integration with LaunchDarkly Java Server SDK
- **Redis Persistence**: Uses Redis as a persistent data store for feature flags (fallback when LaunchDarkly is unavailable)
- **Swagger UI**: Interactive API documentation at `/swagger-ui.html`
- **Verbose Logging**: Detailed logging of LaunchDarkly SDK initialization
- **REST API**: POST endpoint for evaluating feature flags with user context

## Prerequisites

- Java (Java 24 recommended)
- Gradle 8.12+ (included via wrapper)
- Redis server (for persistent feature store)
- LaunchDarkly account and SDK key

## Dependencies

The application uses:
- **LaunchDarkly Java Server SDK**: 7.10.2
- **LaunchDarkly Redis Store**: 3.0.1 (for Redis persistence)
- **Jedis**: 3.10.0 (Redis client)
- **Spring Boot**: 4.0.0
- **SpringDoc OpenAPI**: 2.2.0 (for Swagger UI)

## Configuration

### Environment Variables

Set the following environment variables:

```bash
export LAUNCHDARKLY_SDK_KEY="your-sdk-key-here"
export REDIS_URI="redis://localhost:6379"  # Optional, defaults to redis://localhost:6379
```

### Application Properties

Alternatively, configure in `src/main/resources/application.properties`:

```properties
launchdarkly.sdk.key=your-sdk-key-here
launchdarkly.offline=false  # Set to true to run in offline mode (uses Redis only)
redis.uri=redis://localhost:6379  # Redis URI (use redis://:password@host:port for password)
```

## Running the Application

1. **Start Redis** (if running locally):
   ```bash
   redis-server
   ```

2. **Set your LaunchDarkly SDK key**:
   ```bash
   export LAUNCHDARKLY_SDK_KEY="your-sdk-key-here"
   ```
   
   Or add it to `src/main/resources/application.properties`:
   ```properties
   launchdarkly.sdk.key=your-sdk-key-here
   ```

3. **Build and run the application**:
   ```bash
   ./gradlew build
   ./gradlew bootRun
   ```

   Or use the JAR:
   ```bash
   java -jar build/libs/launchdarkly-spring-boot-app-0.0.1-SNAPSHOT.jar
   ```

4. **Access the application**:
   - API: http://localhost:8080
   - Swagger UI: http://localhost:8080/swagger-ui.html
   - Health Check: http://localhost:8080/api/health

## API Endpoints

### POST /api/flag/{flagKey}

Evaluates a LaunchDarkly feature flag for the provided user context.

**URL Parameters:**
- `flagKey` (required): The feature flag key to evaluate

**Request Body (JSON):**
```json
{
  "key": "user-123",
  "kind": "user",
  "name": "John Doe",
  "email": "john@example.com",
  "customAttribute": "value"
}
```

**Response:**
```json
{
  "flagKey": "my-feature-flag",
  "flagValue": true,
  "context": {
    "key": "user-123",
    "kind": "user"
  },
  "sdkInitialized": true
}
```

**Example using curl:**
```bash
curl -X POST http://localhost:8080/api/flag/my-feature-flag \
  -H "Content-Type: application/json" \
  -d '{
    "key": "user-123",
    "kind": "user",
    "name": "John Doe",
    "email": "john@example.com"
  }'
```

### GET /api/health

Health check endpoint that returns the status of the application and LaunchDarkly SDK.

**Response:**
```json
{
  "status": "ok",
  "sdkInitialized": true,
  "application": "LaunchDarkly Spring Boot App"
}
```

## Redis Persistence

The application is configured to use Redis as a persistent data store for LaunchDarkly feature flags. This provides:

- **Resilience**: Flags are cached in Redis, so if LaunchDarkly is temporarily unavailable, the application can still serve cached flag values
- **Performance**: Reduced latency by serving flags from local Redis cache
- **Persistence**: Flag data persists across application restarts

The Redis connection is configured using a single `redis.uri` property in `application.properties` (e.g., `redis://localhost:6379` or `redis://:password@host:port` for password-protected Redis). This can be overridden with the `REDIS_URI` environment variable.

### Offline Mode

The application supports offline mode, which allows it to run without connecting to LaunchDarkly services. In offline mode, the SDK will only use Redis for flag evaluation. To enable offline mode, set:

```properties
launchdarkly.offline=true
```

This is useful for testing Redis fallback scenarios or when LaunchDarkly services are unavailable.

## Logging

The application includes verbose logging for LaunchDarkly SDK initialization. You'll see detailed logs including:

- SDK key validation
- Redis connection configuration
- LaunchDarkly client initialization status
- Flag evaluation requests and results

Log levels can be configured in `application.properties`:
```properties
logging.level.com.launchdarkly=DEBUG
logging.level.com.launchdarkly.sdk.server=DEBUG
```

## Swagger UI

Access the interactive API documentation at:
- http://localhost:8080/swagger-ui.html

The Swagger UI provides:
- Complete API documentation
- Interactive API testing
- Request/response schemas
- Example requests

## Troubleshooting

### LaunchDarkly SDK Not Initialized

If you see "LaunchDarkly SDK not initialized":
1. Check that `LAUNCHDARKLY_SDK_KEY` is set correctly
2. Verify the SDK key is valid in your LaunchDarkly account
3. Check network connectivity to LaunchDarkly servers

### Redis Connection Issues

If Redis connection fails:
1. Verify Redis is running: `redis-cli ping`
2. Check the `redis.uri` configuration in `application.properties`
3. For password-protected Redis, use the format: `redis://:password@host:port`
4. The application will still work but won't have Redis persistence

### Flag Returns Default Value

If flags always return the default value:
1. Verify the flag key exists in your LaunchDarkly project
2. Check that the flag is enabled
3. Verify the user context matches targeting rules
4. Check LaunchDarkly logs for evaluation details

## Project Structure

```
java-sdk-js-client-sdk-persistent/
├── build.gradle
├── src/
│   └── main/
│       ├── java/
│       │   └── com/launchdarkly/demo/
│       │       ├── DemoApplication.java
│       │       ├── config/
│       │       │   ├── LaunchDarklyConfig.java
│       │       │   └── SwaggerConfig.java
│       │       └── controller/
│       │           └── FlagController.java
│       └── resources/
│           └── application.properties
└── README.md
```

## Learn More

- [LaunchDarkly Documentation](https://docs.launchdarkly.com)
- [Java Server-side SDK Reference](https://docs.launchdarkly.com/sdk/server-side/java)
- [Redis Integration](https://docs.launchdarkly.com/sdk/features/storing-data/redis)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)

