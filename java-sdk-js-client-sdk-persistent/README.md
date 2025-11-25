# Demo Using a Persistent Store With The Java SDK and Bootstrapping from the JS Client SDK

This demo includes 2 applications. An application that persists LaunchDarkly data to a Redis datastore and an application that bootstraps the initial flag load with that data. Specific details are in the Readme.md file of each application.

In a normal scenario, where LaunchDarkly is available and configured, the Java app will load from the db while the app is connecting to LaunchDarkly. Once the LaunchDarkly connection is established, the database will stay up to date with any flag changes in LaunchDarkly. The data will be read from cache. The cache will not expire when the invalidate value is set to 0. The JavaScript application will always bootstrap from the Java application. Updates willl be sent from LaunchDarkly via the streaming connection. 

In a failure scenario, where LaunchDarkly is unavailable or misconfigured, the Java app will continue reading from cache. On restart, the Java app will read from the datastore. The JavaScript app will bootstrap from the Java application and continue reading from cache. When LaunchDarkly becomes available, the applications will reconnecct.


## Java Application

The Java applications requires a Redis datastore to connect to. If it can't connect to Redis it will solely rely on LaunchDarkly.

To Run Redis locally via podman or docker

```
podman run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

This will create a Redis datastore and deploy Redis Insights at localhost:8001 where the data can be inspected.

You must configure the application before starting.

```bash
export LAUNCHDARKLY_SDK_KEY="your-sdk-key-here"
export REDIS_URI="redis://localhost:6379"  # Optional, defaults to redis://localhost:6379
export LD_OFFLINE_MODE=true # False by default. To populate the datastore from LD, first start the app in online mode
```

Verify the data is populate in the datastore via online mode.

Once the data is data is loaded via online mode, switch to offline mode to see the behavior when the application is unable to connect to LaunchDarkly. You could also start in online mode and block the url to LaunchDarkly, 
disabled your network access or misconfigured the default url to an unreachable url.

A swagger-ui is available at /swagger-ui/index.html. The `/api/boostrap` url is exposed for use with the js application.

## JavaScript Application

The JavaScript application bootstraps data from the Java application which must be running (of course). The app will show the bootstrapped data and the value of the `widget-one` flag. This value can be changed in the `index.html` to a flag value that exists in your project. 

The client side id can be added in the `index.html`. The application will still read from bootstrap with a valid client side id. Updates to the running app will come from LaunchDarkly when properly configured. A refreshed page will bootstrap again form the Java application.