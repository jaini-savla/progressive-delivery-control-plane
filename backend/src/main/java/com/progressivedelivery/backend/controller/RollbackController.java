package com.progressivedelivery.backend.controller;

import com.progressivedelivery.backend.model.Rollback;
import com.progressivedelivery.backend.repository.RollbackRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class RollbackController {

    private final RollbackRepository rollbackRepository;

    public RollbackController(RollbackRepository rollbackRepository) {
        this.rollbackRepository = rollbackRepository;
    }

    // Get current rollback status
    @GetMapping("/rollback/status")
    public ResponseEntity<RollbackResponse> getRollbackStatus() {

        Rollback rollback;

        if (rollbackRepository.count() == 0) {

            rollback = new Rollback("v2.0", "CANARY");
            rollback = rollbackRepository.save(rollback);

        } else {

            rollback = rollbackRepository.findAll().get(0);
        }

        return ResponseEntity.ok(
                new RollbackResponse(
                        rollback.getCurrentVersion(),
                        rollback.getStatus(),
                        "Current deployment status"
                )
        );
    }

    // Perform rollback
    @PostMapping("/rollback")
    public ResponseEntity<RollbackResponse> rollback(
            @RequestBody RollbackRequest request) {

        Rollback rollback;

        if (rollbackRepository.count() == 0) {

            rollback = new Rollback("v2.0", "CANARY");
            rollback = rollbackRepository.save(rollback);

        } else {

            rollback = rollbackRepository.findAll().get(0);
        }

        // Store current version before rollback
        String previousVersion =
                rollback.getCurrentVersion();

        // Roll back to requested version
        rollback.setCurrentVersion(
                request.getTargetVersion());

        rollback.setStatus("ROLLED_BACK");

        Rollback savedRollback =
                rollbackRepository.save(rollback);

        RollbackResponse response =
                new RollbackResponse(
                        savedRollback.getCurrentVersion(),
                        savedRollback.getStatus(),
                        "Rollback completed successfully from "
                                + previousVersion
                                + " to "
                                + savedRollback.getCurrentVersion()
                );

        return ResponseEntity.ok(response);
    }

    // Request object
    public static class RollbackRequest {

        private String targetVersion;

        public String getTargetVersion() {
            return targetVersion;
        }

        public void setTargetVersion(String targetVersion) {
            this.targetVersion = targetVersion;
        }
    }

    // Response object
    public static class RollbackResponse {

        private String currentVersion;
        private String status;
        private String message;

        public RollbackResponse(
                String currentVersion,
                String status,
                String message) {

            this.currentVersion = currentVersion;
            this.status = status;
            this.message = message;
        }

        public String getCurrentVersion() {
            return currentVersion;
        }

        public String getStatus() {
            return status;
        }

        public String getMessage() {
            return message;
        }
    }
}