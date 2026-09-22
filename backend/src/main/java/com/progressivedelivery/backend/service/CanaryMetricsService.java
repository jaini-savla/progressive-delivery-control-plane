package com.progressivedelivery.backend.service;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

@Service
public class CanaryMetricsService {

    private final MeterRegistry meterRegistry;

    public CanaryMetricsService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public Timer getRequestTimer(String role, String version) {

        return Timer.builder("canary_http_request_duration")
                .description("HTTP request duration for stable and canary deployments")
                .tag("deployment_role", role)
                .tag("deployment_version", version)
                .register(meterRegistry);
    }
}