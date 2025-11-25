package com.launchdarkly.demo.config;

import com.launchdarkly.sdk.server.*;
import com.launchdarkly.sdk.server.integrations.Redis;

import java.net.URI;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@Configuration
public class LaunchDarklyConfig {

    private static final Logger logger = LoggerFactory.getLogger(LaunchDarklyConfig.class);

    @Value("${launchdarkly.sdk.key:}")
    private String sdkKey;

    @Value("${redis.uri:redis://localhost:6379}")
    private String redisUri;

    @Value("${launchdarkly.offline:false}")
    private boolean offline;

    private LDClient ldClient;
    private boolean clientInitialized = false;

    @PostConstruct
    public void init() {
        logger.info("========================================");
        logger.info("LaunchDarkly SDK Initialization Starting");
        logger.info("========================================");
        
        if (!isSdkKeyValid()) {
            return;
        }

        logConfiguration();
        
        try {
            LDConfig config = buildLDConfig();
            ldClient = new LDClient(sdkKey, config);
            
            waitForInitialization();
            clientInitialized = true;
            
            logger.info("========================================");
            logger.info("LaunchDarkly SDK Initialization Complete");
            logger.info("========================================");
        } catch (Exception e) {
            logger.error("Failed to initialize LaunchDarkly SDK", e);
            logger.error("Application will continue but flag evaluation may fail");
        }
    }

    private boolean isSdkKeyValid() {
        if (sdkKey == null || sdkKey.isEmpty()) {
            logger.error("LAUNCHDARKLY_SDK_KEY is not set! Please set it in application.properties or as an environment variable.");
            logger.error("LaunchDarkly SDK will not be initialized.");
            return false;
        }
        return true;
    }

    private void logConfiguration() {
        logger.info("SDK Key: {}...{}", maskSdkKey(sdkKey, 10), maskSdkKey(sdkKey, -4));
        logger.info("Redis URI: {}", redisUri);
        logger.info("SDK is offline: {}", offline);
    }

    private String maskSdkKey(String key, int length) {
        if (length > 0) {
            return key.substring(0, Math.min(length, key.length()));
        } else {
            return key.substring(Math.max(0, key.length() + length));
        }
    }

    private LDConfig buildLDConfig() {
        logger.info("Configuring LaunchDarkly SDK with Redis persistence...");
        return new LDConfig.Builder()
                .offline(offline)
                .logging(Components.logging().level(com.launchdarkly.logging.LDLogLevel.DEBUG))
                .dataStore(
                        Components.persistentDataStore(Redis.dataStore().uri(URI.create(redisUri)))
                                .cacheSeconds(0)
                )
                .build();
    }

    private void waitForInitialization() {
        logger.info("Initializing LaunchDarkly client...");
        logger.info("Waiting for LaunchDarkly client to be ready...");
        
        boolean initialized = ldClient.isInitialized();
        if (!initialized) {
            try {
                Thread.sleep(2000);
                initialized = ldClient.isInitialized();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                logger.warn("Interrupted while waiting for initialization");
            }
        }
        
        if (initialized) {
            logger.info("✓ LaunchDarkly client initialized successfully!");
            logger.info("✓ Client is ready to evaluate flags");
        } else {
            logger.warn("⚠ LaunchDarkly client initialization timed out");
            logger.warn("⚠ Client may not be fully ready");
        }
    }

    @Bean
    public LDClient ldClient() {
        return ldClient;
    }

    public boolean isClientInitialized() {
        return clientInitialized && ldClient != null;
    }

    @PreDestroy
    public void cleanup() {
        if (ldClient != null) {
            logger.info("Closing LaunchDarkly client...");
            try {
                ldClient.close();
                logger.info("LaunchDarkly client closed successfully");
            } catch (Exception e) {
                logger.error("Error closing LaunchDarkly client", e);
            }
        }
    }

}

