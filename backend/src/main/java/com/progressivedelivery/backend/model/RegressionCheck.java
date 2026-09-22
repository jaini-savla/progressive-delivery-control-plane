package com.progressivedelivery.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "regression_checks")
public class RegressionCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private double stableErrorRate;
    private double canaryErrorRate;

    private double stableLatency;
    private double canaryLatency;

    private boolean regressionDetected;

    private String status;

    public RegressionCheck() {
        // Required by JPA
    }

    public RegressionCheck(
            double stableErrorRate,
            double canaryErrorRate,
            double stableLatency,
            double canaryLatency,
            boolean regressionDetected,
            String status) {

        this.stableErrorRate = stableErrorRate;
        this.canaryErrorRate = canaryErrorRate;
        this.stableLatency = stableLatency;
        this.canaryLatency = canaryLatency;
        this.regressionDetected = regressionDetected;
        this.status = status;
    }

    public Integer getId() {
        return id;
    }

    public double getStableErrorRate() {
        return stableErrorRate;
    }

    public void setStableErrorRate(double stableErrorRate) {
        this.stableErrorRate = stableErrorRate;
    }

    public double getCanaryErrorRate() {
        return canaryErrorRate;
    }

    public void setCanaryErrorRate(double canaryErrorRate) {
        this.canaryErrorRate = canaryErrorRate;
    }

    public double getStableLatency() {
        return stableLatency;
    }

    public void setStableLatency(double stableLatency) {
        this.stableLatency = stableLatency;
    }

    public double getCanaryLatency() {
        return canaryLatency;
    }

    public void setCanaryLatency(double canaryLatency) {
        this.canaryLatency = canaryLatency;
    }

    public boolean isRegressionDetected() {
        return regressionDetected;
    }

    public void setRegressionDetected(boolean regressionDetected) {
        this.regressionDetected = regressionDetected;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}