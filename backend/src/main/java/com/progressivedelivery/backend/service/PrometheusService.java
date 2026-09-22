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
        this.restClient = RestClient.builder()
                .baseUrl("http://127.0.0.1:9090")
                .build();
    }

    public String query(String promql) {

        URI uri = UriComponentsBuilder
                .fromPath("/api/v1/query")
                .queryParam("query", promql)
                .build()
                .encode()
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

    String query =
            "canary_http_request_duration_seconds_sum" +
            "{deployment_role=\"" + role + "\"}" +
            " / " +
            "canary_http_request_duration_seconds_count" +
            "{deployment_role=\"" + role + "\"}";

    String response = query(query);

    try {
        ObjectMapper objectMapper = new ObjectMapper();

        JsonNode root = objectMapper.readTree(response);

        JsonNode result =
                root.path("data").path("result");

        if (!result.isArray() || result.isEmpty()) {
            throw new RuntimeException(
                    "No Prometheus data found for role: " + role
            );
        }

        JsonNode value =
                result.get(0).path("value");

        if (!value.isArray() || value.size() < 2) {
            throw new RuntimeException(
                    "Invalid Prometheus response for role: " + role
            );
        }

        return value.get(1).asDouble();

        } catch (Exception e) {

            throw new RuntimeException(
                "Unable to read latency from Prometheus for role: "
                        + role,
                e
            );
        }
    }
}