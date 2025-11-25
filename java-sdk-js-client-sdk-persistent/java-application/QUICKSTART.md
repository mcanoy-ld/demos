# Quick Start Guide

## For zsh Users

### Step 1: Set LaunchDarkly SDK Key

Before running, set your SDK key:

```bash
export LAUNCHDARKLY_SDK_KEY="your-sdk-key-here"
export LD_OFFLINE_MODE=true
export REDIS_URI=redis://localhost:6379
```

Or edit `src/main/resources/application.properties` and change:
```properties
launchdarkly.sdk.key=your-sdk-key-here
redis.uri=redis://localhost:6379
launchdarkly.offline=false  # Set to true for offline mode, or use LD_OFFLINE_MODE env var
```

### Step 2: Start Redis (if running locally)

```bash
podman run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

or 

```bash
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

You may view the Redis values at `http://localhost:8001`

### Step 3: Run the Application

```bash
cd java-sdk-js-client-sdk-persistent/java-application
./gradlew bootRun
```

### Step 4: Access the Application

Once running:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Health Check**: http://localhost:8080/api/health
- **Flag Evaluation**: POST http://localhost:8080/api/flag/{flagKey}
- **Bootstrap Endpoint**: POST http://localhost:8080/api/bootstrap
- **All Flags**: POST http://localhost:8080/api/allflags

### Step 5: Test the API

**Evaluate a flag:**
```bash
curl -X POST http://localhost:8080/api/flag/widget-one \
  -H "Content-Type: application/json" \
  -d '{
    "key": "user-123",
    "kind": "user",
    "name": "John Doe"
  }'
```

**Get bootstrap data:**
```bash
curl -X POST http://localhost:8080/api/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "key": "user-123",
    "kind": "user",
    "name": "John Doe"
  }'
```

## Troubleshooting

**Error: "LAUNCHDARKLY_SDK_KEY is not set"**
- Set the environment variable: `export LAUNCHDARKLY_SDK_KEY="your-sdk-key-here"`
- Or add it to `src/main/resources/application.properties` as `launchdarkly.sdk.key=your-sdk-key-here`

**Error: "LaunchDarkly SDK not initialized"**
- Verify your SDK key is correct
- Check network connectivity to LaunchDarkly servers
- If using offline mode, ensure Redis is running and has cached flag data
- Check application logs for detailed error messages

**Error: "Cannot connect to Redis"**
- Ensure Redis is running: `podman ps` or `docker ps`
- Verify Redis URI is correct (default: `redis://localhost:6379`)
- Check if Redis requires a password and update the URI format: `redis://:password@localhost:6379`

**NoSuchMethodError when evaluating flags**
- This may indicate a version mismatch. Ensure you're using compatible versions of:
  - LaunchDarkly Java Server SDK (7.10.2)
  - LaunchDarkly Redis Store (3.0.1)
  - Spring Boot (4.0.0)
- Try cleaning and rebuilding: `./gradlew clean build`
