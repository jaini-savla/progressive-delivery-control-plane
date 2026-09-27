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
    String prometheusUrl =
            System.getenv().getOrDefault(
                    "PROMETHEUS_URL",
                    "http://127.0.0.1:9090"

            );

    this.restClient = RestClient.builder()
            .baseUrl(prometheusUrl)
            .build();
    }

    public String query(String promql) {

    URI uri = UriComponentsBuilder
            .fromUriString("/api/v1/query")
            .queryParam("query", promql)
            .build()
            .toUri();

    return restClient.get()
            .uri(uri)
            .retrieve()
            .body(String.class);
}
    public String getCanaryLatency() {

        String query =
            "rate(canary_http_request_duration_seconds_sum" +
            "{deployment_role=\"canary\"}[5m]) / " +
            "rate(canary_http_request_duration_seconds_count" +
            "{deployment_role=\"canary\"}[5m])";

        return query(query);
    }

    public String getStableLatency() {

        String query =
            "rate(canary_http_request_duration_seconds_sum" +
            "{deployment_role=\"stable\"}[5m]) / " +
            "rate(canary_http_request_duration_seconds_count" +
            "{deployment_role=\"stable\"}[5m])";

        return query(query);
    }
     public double getAverageLatency(String role) {

    String promql =
            "canary_http_request_duration_seconds_sum" +
            "{deployment_role=\"" + role + "\"}";

    String response = query(promql);

    try {

        ObjectMapper objectMapper =
                new ObjectMapper();

        JsonNode root = objectMapper.readTree(response);

        JsonNode result =
                root.get("data").get("result");

        if (result == null || result.isEmpty()) {
            throw new RuntimeException(
                    "No Prometheus data found for role: " + role
            );
        }

        JsonNode firstResult = result.get(0);

        JsonNode value = firstResult.get("value");

        if (value == null || value.size() < 2) {
            throw new RuntimeException(
                    "Invalid Prometheus value for role: " + role
            );
        }

        String latencyValue =
                value.get(1).asText();

        return Double.parseDouble(latencyValue);

    } catch (Exception e) {

        throw new RuntimeException(
                "Unable to read latency from Prometheus for role: "
                        + role +
                        ". Response: " + response,
                e
        );
    }
    }
    public String debugLatencyQuery(String role) {

    String promql =
            "canary_http_request_duration_seconds_sum" +
            "{deployment_role=\"" + role + "\"}";

    return query(promql);
    }
}