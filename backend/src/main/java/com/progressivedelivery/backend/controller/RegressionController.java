package com.progressivedelivery.backend.controller;

import com.progressivedelivery.backend.model.RegressionCheck;
import com.progressivedelivery.backend.model.Rollback;
import com.progressivedelivery.backend.repository.RegressionCheckRepository;
import com.progressivedelivery.backend.repository.RollbackRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.progressivedelivery.backend.model.Deployment;
import com.progressivedelivery.backend.repository.DeploymentRepository;
import com.progressivedelivery.backend.model.AuditLog;
import com.progressivedelivery.backend.repository.AuditLogRepository;
import com.progressivedelivery.backend.service.PrometheusService;

@RestController
@RequestMapping("/api/regression")
public class RegressionController {

    private final RegressionCheckRepository regressionRepository;
    private final RollbackRepository rollbackRepository;
    private final DeploymentRepository deploymentRepository;
    private final AuditLogRepository auditLogRepository;
    private final PrometheusService prometheusService;

    public RegressionController(
        RegressionCheckRepository regressionRepository,
        RollbackRepository rollbackRepository,
        DeploymentRepository deploymentRepository,
        AuditLogRepository auditLogRepository,
        PrometheusService prometheusService) {

        this.regressionRepository = regressionRepository;
        this.rollbackRepository = rollbackRepository;
        this.deploymentRepository = deploymentRepository;
        this.auditLogRepository = auditLogRepository;
        this.prometheusService = prometheusService;
        }

    @GetMapping
    public List<RegressionCheck> getRegressionChecks() {
        return regressionRepository.findAll();
    }

    @GetMapping("/latest")
    public ResponseEntity<?> getLatestRegression() {

        if (regressionRepository.count() == 0) {
            return ResponseEntity.ok(
                    "No regression check has been performed yet"
            );
        }

        List<RegressionCheck> checks =
                regressionRepository.findAll();

        RegressionCheck latest =
                checks.get(checks.size() - 1);

        return ResponseEntity.ok(latest);
    }

    @PostMapping("/check")
    public ResponseEntity<?> checkRegression(
            @RequestBody RegressionRequest request) {

        double stableErrorRate =
                request.getStableErrorRate();

        double canaryErrorRate =
                request.getCanaryErrorRate();

        double stableLatency =
                request.getStableLatency();

        double canaryLatency =
                request.getCanaryLatency();

        /*
         * Basic validation
         */

        if (stableErrorRate < 0 ||
                canaryErrorRate < 0) {

            return ResponseEntity.badRequest().body(
                    "Error rate cannot be negative"
            );
        }

        if (stableLatency < 0 ||
                canaryLatency < 0) {

            return ResponseEntity.badRequest().body(
                    "Latency cannot be negative"
            );
        }

        /*
         * Regression rules
         *
         * Error rate:
         * Canary should not be more than
         * 2 times the stable error rate.
         *
         * Latency:
         * Canary should not be more than
         * 1.5 times the stable latency.
         */

        boolean errorRegression =
                canaryErrorRate > stableErrorRate * 2;

        boolean latencyRegression =
                canaryLatency > stableLatency * 1.5;

        boolean regressionDetected =
                errorRegression || latencyRegression;

        String status;

        if (regressionDetected) {
            status = "REGRESSION_DETECTED";
        } else {
            status = "HEALTHY";
        }

        /*
         * Save regression result
         */

        RegressionCheck regressionCheck =
                new RegressionCheck(
                        stableErrorRate,
                        canaryErrorRate,
                        stableLatency,
                        canaryLatency,
                        regressionDetected,
                        status
                );

        RegressionCheck savedCheck =
                regressionRepository.save(regressionCheck);

        /*
         * AUTOMATIC ROLLBACK
         */

        if (regressionDetected) {
                AuditLog regressionAudit = new AuditLog(
        "REGRESSION_DETECTED",
        "payment-service",
        null,
        "Canary regression detected based on error rate or latency"
        );

        auditLogRepository.save(regressionAudit);

            Rollback rollback;

            if (rollbackRepository.count() == 0) {

                rollback = new Rollback(
                        "v2.0",
                        "CANARY"
                );

                rollback = rollbackRepository.save(rollback);

            } else {

                rollback =
                        rollbackRepository.findAll().get(0);
            }

            /*
             * Store the version that was running
             */

            String previousVersion =
                    rollback.getCurrentVersion();

            /*
             * Roll back to stable version.
             *
             * For this project we use v1.0
             * as the previous stable version.
             */

            List<Deployment> stableDeployments =
        deploymentRepository.findByStatus("STABLE");

if (stableDeployments.isEmpty()) {

    return ResponseEntity.internalServerError().body(
            "Rollback failed: No STABLE deployment found"
    );
}

Deployment stableDeployment =
        stableDeployments.get(stableDeployments.size() - 1);

String stableVersion =
        stableDeployment.getVersion();

rollback.setCurrentVersion(stableVersion);
rollback.setStatus("ROLLED_BACK");

            Rollback savedRollback =
                    rollbackRepository.save(rollback);
                    AuditLog rollbackAudit = new AuditLog(
        "AUTOMATIC_ROLLBACK",
        stableDeployment.getServiceName(),
        savedRollback.getCurrentVersion(),
        "Automatic rollback completed after canary regression"
);

auditLogRepository.save(rollbackAudit);

            return ResponseEntity.ok(
                    new RegressionResponse(
                            savedCheck.getId(),
                            true,
                            "REGRESSION_DETECTED",
                            previousVersion,
                            savedRollback.getCurrentVersion(),
                            "Regression detected. Automatic rollback completed."
                    )
            );
        }

        /*
         * No regression
         */

        return ResponseEntity.ok(
                new RegressionResponse(
                        savedCheck.getId(),
                        false,
                        "HEALTHY",
                        null,
                        null,
                        "Canary is healthy. No rollback required."
                )
        );
    }

    /*
     * Request class
     */
    @GetMapping("/prometheus-check")
public ResponseEntity<?> prometheusRegressionCheck() {

    try {

        double stableLatency =
                prometheusService.getAverageLatency("stable");

        double canaryLatency =
                prometheusService.getAverageLatency("canary");

        /*
         * Error rate is currently 0 because
         * separate stable/canary error metrics
         * have not been implemented yet.
         */
        double stableErrorRate = 0.0;
        double canaryErrorRate = 0.0;

        RegressionRequest request =
                new RegressionRequest();

        request.setStableErrorRate(stableErrorRate);
        request.setCanaryErrorRate(canaryErrorRate);
        request.setStableLatency(stableLatency);
        request.setCanaryLatency(canaryLatency);

        return checkRegression(request);

        } catch (Exception e) {

        return ResponseEntity.internalServerError().body(
                "Prometheus regression check failed: "
                        + e.getMessage()
                        );
        }
}
    public static class RegressionRequest {

        private double stableErrorRate;
        private double canaryErrorRate;

        private double stableLatency;
        private double canaryLatency;

        public double getStableErrorRate() {
            return stableErrorRate;
        }

        public void setStableErrorRate(
                double stableErrorRate) {
            this.stableErrorRate = stableErrorRate;
        }

        public double getCanaryErrorRate() {
            return canaryErrorRate;
        }

        public void setCanaryErrorRate(
                double canaryErrorRate) {
            this.canaryErrorRate = canaryErrorRate;
        }

        public double getStableLatency() {
            return stableLatency;
        }

        public void setStableLatency(
                double stableLatency) {
            this.stableLatency = stableLatency;
        }

        public double getCanaryLatency() {
            return canaryLatency;
        }

        public void setCanaryLatency(
                double canaryLatency) {
            this.canaryLatency = canaryLatency;
        }
    }

    /*
     * Response class
     */

    public static class RegressionResponse {

        private Integer regressionCheckId;
        private boolean regressionDetected;
        private String status;

        private String previousVersion;
        private String rolledBackTo;

        private String message;

        public RegressionResponse(
                Integer regressionCheckId,
                boolean regressionDetected,
                String status,
                String previousVersion,
                String rolledBackTo,
                String message) {

            this.regressionCheckId =
                    regressionCheckId;

            this.regressionDetected =
                    regressionDetected;

            this.status = status;

            this.previousVersion =
                    previousVersion;

            this.rolledBackTo =
                    rolledBackTo;

            this.message = message;
        }

        public Integer getRegressionCheckId() {
            return regressionCheckId;
        }

        public boolean isRegressionDetected() {
            return regressionDetected;
        }

        public String getStatus() {
            return status;
        }

        public String getPreviousVersion() {
            return previousVersion;
        }

        public String getRolledBackTo() {
            return rolledBackTo;
        }

        public String getMessage() {
            return message;
        }
    }
}