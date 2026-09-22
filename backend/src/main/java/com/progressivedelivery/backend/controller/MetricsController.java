package com.progressivedelivery.backend.controller;

import com.progressivedelivery.backend.model.Metrics;
import com.progressivedelivery.backend.repository.MetricsRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.progressivedelivery.backend.service.CanaryMetricsService;
import io.micrometer.core.instrument.Timer;
import com.progressivedelivery.backend.service.PrometheusService;

@RestController
@RequestMapping("/api/metrics")
public class MetricsController {

    private final MetricsRepository metricsRepository;
    private final CanaryMetricsService canaryMetricsService;
    private final PrometheusService prometheusService;

    public MetricsController(
        MetricsRepository metricsRepository,
        CanaryMetricsService canaryMetricsService,
        PrometheusService prometheusService) {

        this.metricsRepository = metricsRepository;
        this.canaryMetricsService = canaryMetricsService;
        this.prometheusService = prometheusService;
    }

    // Get all metrics
    @GetMapping
    public List<Metrics> getMetrics() {
        return metricsRepository.findAll();
    }

    // Get latest metrics
    @GetMapping("/latest")
    public ResponseEntity<?> getLatestMetrics() {

        if (metricsRepository.count() == 0) {

            Metrics metrics = new Metrics(
                    0.0,
                    0.0,
                    100,
                    "HEALTHY"
            );

            Metrics savedMetrics =
                    metricsRepository.save(metrics);

            return ResponseEntity.ok(savedMetrics);
        }

        List<Metrics> metrics =
                metricsRepository.findAll();

        Metrics latest =
                metrics.get(metrics.size() - 1);

        return ResponseEntity.ok(latest);
    }

    // Add new metrics
    @PostMapping
    public ResponseEntity<?> createMetrics(
            @RequestBody MetricsRequest request) {

        // Validate error rate
        if (request.getErrorRate() < 0 ||
                request.getErrorRate() > 100) {

            return ResponseEntity.badRequest().body(
                    "Error rate must be between 0 and 100"
            );
        }

        // Validate latency
        if (request.getLatency() < 0) {

            return ResponseEntity.badRequest().body(
                    "Latency cannot be negative"
            );
        }

        // Validate traffic
        if (request.getTraffic() < 0 ||
                request.getTraffic() > 100) {

            return ResponseEntity.badRequest().body(
                    "Traffic must be between 0 and 100"
            );
        }

        Metrics metrics = new Metrics(
                request.getErrorRate(),
                request.getLatency(),
                request.getTraffic(),
                request.getDeploymentStatus()
        );

        Metrics savedMetrics =
                metricsRepository.save(metrics);

        return ResponseEntity.ok(savedMetrics);
    }

    // Request class
    public static class MetricsRequest {

        private double errorRate;
        private double latency;
        private int traffic;
        private String deploymentStatus;

        public double getErrorRate() {
            return errorRate;
        }

        public void setErrorRate(double errorRate) {
            this.errorRate = errorRate;
        }

        public double getLatency() {
            return latency;
        }

        public void setLatency(double latency) {
            this.latency = latency;
        }

        public int getTraffic() {
            return traffic;
        }

        public void setTraffic(int traffic) {
            this.traffic = traffic;
        }

        public String getDeploymentStatus() {
            return deploymentStatus;
        }

        public void setDeploymentStatus(String deploymentStatus) {
            this.deploymentStatus = deploymentStatus;
        }
    }
    @GetMapping("/canary-test")
public ResponseEntity<String> canaryTest() {

    Timer timer = canaryMetricsService.getRequestTimer(
            "canary",
            "v2.0"
    );

    Timer.Sample sample = Timer.start();

    try {
        Thread.sleep(100);
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    } finally {
        sample.stop(timer);
    }

    return ResponseEntity.ok("Canary test request completed");
    }
    @GetMapping("/stable-test")
    public ResponseEntity<String> stableTest() {

        Timer timer = canaryMetricsService.getRequestTimer(
            "stable",
            "v1.0"
        );

        Timer.Sample sample = Timer.start();

        try {
        Thread.sleep(80);
        } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        } finally {
        sample.stop(timer);
        }

        return ResponseEntity.ok("Stable test request completed");
    }
    @GetMapping("/prometheus-test")
        public ResponseEntity<String> prometheusTest() {

        String result = prometheusService.query(
            "up{job=\"spring-boot-backend\"}"
        );

        return ResponseEntity.ok(result);
    }
    @GetMapping("/prometheus/canary-latency")
    public ResponseEntity<String> canaryLatency() {

        return ResponseEntity.ok(
            prometheusService.getCanaryLatency()
        );
    }
    @GetMapping("/prometheus/analyze")
public ResponseEntity<String> analyzeCanary() {

    double stableLatency =
            prometheusService.getAverageLatency("stable");

    double canaryLatency =
            prometheusService.getAverageLatency("canary");

    boolean latencyRegression =
            canaryLatency > stableLatency * 1.5;

    String result =
            "Stable latency: " + stableLatency +
            " seconds\n" +
            "Canary latency: " + canaryLatency +
            " seconds\n" +
            "Latency regression: " + latencyRegression;

    return ResponseEntity.ok(result);
}
}