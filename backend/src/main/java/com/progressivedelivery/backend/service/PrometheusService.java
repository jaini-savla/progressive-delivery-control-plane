package com.progressivedelivery.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;

@Service
public class PrometheusService {

    private final RestClient restClient;

    public PrometheusService() {

        String prometheusUrl = System.getenv().getOrDefault(
            "PROMETHEUS_URL",
            "http://127.0.0.1:9090"
        );

        this.restClient = RestClient.builder()
            .baseUrl(prometheusUrl)
            .build();
    }

    // ---------------------------------------------------------
    // Generic Prometheus Query
    // ---------------------------------------------------------

    public String query(String promql) {

        URI uri = UriComponentsBuilder
            .fromUriString("/api/v1/query")
            .queryParam("query", promql)
            .build()
            .toUri();

        return restClient
            .get()
            .uri(uri)
            .retrieve()
            .body(String.class);
    }

    // ---------------------------------------------------------
    // Canary Latency
    // ---------------------------------------------------------

    public String getCanaryLatency() {

        String query =
            "rate(canary_http_request_duration_seconds_sum" +
            "{deployment_role=\"canary\"}[5m]) / " +

            "rate(canary_http_request_duration_seconds_count" +
            "{deployment_role=\"canary\"}[5m])";

        try {
            return query(query);
        } catch (Exception e) {
            return "{\"status\":\"unavailable\",\"message\":\"Prometheus is not available\"}";
        }
    }

    // ---------------------------------------------------------
    // Stable Latency
    // ---------------------------------------------------------

    public String getStableLatency() {

        String query =
            "rate(canary_http_request_duration_seconds_sum" +
            "{deployment_role=\"stable\"}[5m]) / " +

            "rate(canary_http_request_duration_seconds_count" +
            "{deployment_role=\"stable\"}[5m])";

        try {
            return query(query);
        } catch (Exception e) {
            return "{\"status\":\"unavailable\",\"message\":\"Prometheus is not available\"}";
        }
    }

    // ---------------------------------------------------------
    // Average Latency
    // ---------------------------------------------------------
    //
    // Uses SUM / COUNT instead of rate().
    //
    // This is more reliable for your local college demo because
    // rate() can return no data when Prometheus has not collected
    // enough samples yet.
    //
    // ---------------------------------------------------------

    public double getAverageLatency(String role) {

        String sumQuery =
            "canary_http_request_duration_seconds_sum" +
            "{deployment_role=\"" + role + "\"}";

        String countQuery =
            "canary_http_request_duration_seconds_count" +
            "{deployment_role=\"" + role + "\"}";

        try {

            // Get total duration
            String sumResponse = query(sumQuery);

            // Get total number of requests
            String countResponse = query(countQuery);

            ObjectMapper objectMapper = new ObjectMapper();

            JsonNode sumRoot =
                objectMapper.readTree(sumResponse);

            JsonNode countRoot =
                objectMapper.readTree(countResponse);

            JsonNode sumResult =
                sumRoot.path("data").path("result");

            JsonNode countResult =
                countRoot.path("data").path("result");

            // No Prometheus data available
            if (sumResult.isEmpty() || countResult.isEmpty()) {
                return 0.0;
            }

            JsonNode sumValue =
                sumResult.get(0).path("value");

            JsonNode countValue =
                countResult.get(0).path("value");

            if (sumValue.size() < 2 || countValue.size() < 2) {
                return 0.0;
            }

            double totalDuration = sumValue.get(1).asDouble();
            double totalRequests = countValue.get(1).asDouble();

            // Avoid division by zero
            if (totalRequests == 0) {
                return 0.0;
            }

            // Average latency in seconds
            return totalDuration / totalRequests;

        } catch (Exception e) {

            /*
             * Prometheus is available locally but not necessarily
             * available on Render.
             *
             * Instead of returning HTTP 500, return 0.
             */

            return 0.0;
        }
    }
        public String debugLatencyQuery(String role) {

        String promql =
            "canary_http_request_duration_seconds_sum" +
            "{deployment_role=\"" + role + "\"}";

        try {

            return query(promql);

        } catch (Exception e) {

            return "Prometheus unavailable: " + e.getMessage();
        }
    }
}