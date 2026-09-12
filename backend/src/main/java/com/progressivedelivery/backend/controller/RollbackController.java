package com.progressivedelivery.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class RollbackController {

    private String currentVersion = "v2.0";
    private String status = "CANARY";

    @GetMapping("/rollback/status")
    public RollbackResponse getRollbackStatus() {

        return new RollbackResponse(
                currentVersion,
                status,
                "Current deployment status"
        );
    }

    @PostMapping("/rollback")
    public ResponseEntity<RollbackResponse> rollback(
            @RequestBody RollbackRequest request) {

        // Store the version that is currently running
        String previousVersion = currentVersion;

        // Roll back to the requested stable version
        currentVersion = request.getTargetVersion();
        status = "ROLLED_BACK";

        RollbackResponse response = new RollbackResponse(
                currentVersion,
                status,
                "Rollback completed successfully from "
                        + previousVersion
                        + " to "
                        + currentVersion
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