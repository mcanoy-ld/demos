package com.launchdarkly.demo.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("LaunchDarkly Feature Flags API")
                        .version("1.0.0")
                        .description("Spring Boot application with LaunchDarkly SDK and Redis persistence. " +
                                    "This API allows you to evaluate LaunchDarkly feature flags with user context.")
                        .contact(new Contact()
                                .name("LaunchDarkly")
                                .url("https://launchdarkly.com")));
    }
}

