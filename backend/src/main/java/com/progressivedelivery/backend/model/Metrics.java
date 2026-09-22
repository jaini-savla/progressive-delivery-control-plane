package com.progressivedelivery.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "metrics")
public class Metrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private double errorRate;
    private double latency;
    private int traffic;
    private String deploymentStatus;

    public Metrics() {
        // Required by JPA
    }

    public Metrics(
            double errorRate,
            double latency,
            int traffic,
            String deploymentStatus) {

        this.errorRate = errorRate;
        this.latency = latency;
        this.traffic = traffic;
        this.deploymentStatus = deploymentStatus;
    }

    public Integer getId() {
        return id;
    }

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