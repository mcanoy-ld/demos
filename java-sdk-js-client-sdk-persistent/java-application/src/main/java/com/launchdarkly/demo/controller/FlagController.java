package com.launchdarkly.demo.controller;

import com.launchdarkly.demo.config.LaunchDarklyConfig;
import com.launchdarkly.sdk.*;
import com.launchdarkly.sdk.server.LDClient;
import com.launchdarkly.sdk.server.FeatureFlagsState;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api")
@Tag(name = "Feature Flags", description = "LaunchDarkly feature flag evaluation API")
public class FlagController {

    private static final Logger logger = LoggerFactory.getLogger(FlagController.class);

    @Autowired
    private LaunchDarklyConfig ldConfig;

    @Autowired
    private LDClient ldClient;

    @Autowired
    private ObjectMapper mapper;


    @PostMapping("/flag/{flagKey}")
    @Operation(
        summary = "Evaluate a feature flag",
        description = "Evaluates a LaunchDarkly feature flag for the provided user context. " +
                     "The flag key is provided as a URL parameter and the user context is provided in the request body."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Flag evaluated successfully",
            content = @Content(schema = @Schema(implementation = FlagResponse.class))
        ),
        @ApiResponse(
            responseCode = "503",
            description = "LaunchDarkly SDK not initialized"
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request"
        )
    })
    public ResponseEntity<?> evaluateFlag(
            @Parameter(description = "Feature flag key to evaluate", required = true)
            @PathVariable String flagKey,
            @Parameter(description = "User context for flag evaluation", required = true)
            @RequestBody Map<String, Object> contextData) {

        logger.info("Received flag evaluation request for flag: {}", flagKey);
        logger.debug("Context data: {}", contextData);

        if (!ldConfig.isClientInitialized()) {
            logger.warn("LaunchDarkly SDK not initialized");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "error", "LaunchDarkly SDK not initialized",
                            "flagKey", flagKey
                    ));
        }

        try {
            // Build LDContext from the provided context data
            String contextKey = contextData.getOrDefault("key", "anonymous").toString();
            String contextName = contextData.getOrDefault("name", "???").toString();
            LDContext context = LDContext.builder(contextKey).name(contextName).build();
            
            // Evaluate the flag
            boolean flagValue = ldClient.boolVariation(flagKey, context, false);
            logger.info("Flag '{}' evaluated to: {}", flagKey, flagValue);

            FlagResponse response = new FlagResponse();
            response.setFlagKey(flagKey);
            response.setFlagValue(flagValue);
            response.setContext(context);
            response.setSdkInitialized(true);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error evaluating flag: {}", flagKey, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", e.getMessage(),
                            "flagKey", flagKey
                    ));
        }
    }

    

    @PostMapping("/bootstrap")
    public ResponseEntity<String> bootstrap(@RequestBody String contextJson) {
        try {
        // Parse LDContext from the raw JSON
        LDContext ctx = mapper.readValue(contextJson, LDContext.class);

        if (!ctx.isValid()) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body("{\"error\":\"Invalid LDContext: " + ctx.getError() + "\"}");
        }

        // Evaluate all flags for this context
        FeatureFlagsState state = ldClient.allFlagsState(ctx);

        // Return as JSON (includes values + metadata)
        String json = mapper.writeValueAsString(state);
        return ResponseEntity.ok(json);

        } catch (Exception e) {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Returns the health status of the application and LaunchDarkly SDK")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "sdkInitialized", ldConfig.isClientInitialized(),
                "application", "LaunchDarkly Spring Boot App"
        ));
    }

    // Response DTO
    public static class FlagResponse {
        private String flagKey;
        private boolean flagValue;
        private LDContext context;
        private boolean sdkInitialized;

        public String getFlagKey() {
            return flagKey;
        }

        public void setFlagKey(String flagKey) {
            this.flagKey = flagKey;
        }

        public boolean isFlagValue() {
            return flagValue;
        }

        public void setFlagValue(boolean flagValue) {
            this.flagValue = flagValue;
        }

        public LDContext getContext() {
            return context;
        }

        public void setContext(LDContext context) {
            this.context = context;
        }

        public boolean isSdkInitialized() {
            return sdkInitialized;
        }

        public void setSdkInitialized(boolean sdkInitialized) {
            this.sdkInitialized = sdkInitialized;
        }
    }
}

