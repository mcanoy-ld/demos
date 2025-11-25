package com.launchdarkly.demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
	"launchdarkly.sdk.key=test-key"
})
class DemoApplicationTests {

	@Test
	void contextLoads() {
	}

}
