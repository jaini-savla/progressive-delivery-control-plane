package com.progressivedelivery.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class TrafficController {

    private int stableTraffic = 100;
    private int canaryTraffic = 0;

    @GetMapping("/traffic")
    public TrafficResponse getTraffic() {
        return new TrafficResponse(
                stableTraffic,
                canaryTraffic,
                "Traffic configuration retrieved successfully"
        );
    }

    @PostMapping("/traffic")
    public ResponseEntity<?> updateTraffic(
            @RequestBody TrafficRequest request) {

        int stable = request.getStableTraffic();
        int canary = request.getCanaryTraffic();

        // Validate traffic percentages
        if (stable < 0 || stable > 100 ||
                canary < 0 || canary > 100) {

            return ResponseEntity.badRequest().body(
                    "Traffic percentages must be between 0 and 100"
            );
        }

        // Stable + Canary must equal 100%
        if (stable + canary != 100) {
            return ResponseEntity.badRequest().body(
                    "Stable traffic + Canary traffic must equal 100%"
            );
        }

        stableTraffic = stable;
        canaryTraffic = canary;

        return ResponseEntity.ok(
                new TrafficResponse(
                        stableTraffic,
                        canaryTraffic,
                        "Traffic updated successfully"
                )
        );
    }

    // Request class
    public static class TrafficRequest {

        private int stableTraffic;
        private int canaryTraffic;

        public int getStableTraffic() {
            return stableTraffic;
        }

        public void setStableTraffic(int stableTraffic) {
            this.stableTraffic = stableTraffic;
        }

        public int getCanaryTraffic() {
            return canaryTraffic;
        }

        public void setCanaryTraffic(int canaryTraffic) {
            this.canaryTraffic = canaryTraffic;
        }
    }

    // Response class
    public static class TrafficResponse {

        private int stableTraffic;
        private int canaryTraffic;
        private String message;

        public TrafficResponse(
                int stableTraffic,
                int canaryTraffic,
                String message) {

            this.stableTraffic = stableTraffic;
            this.canaryTraffic = canaryTraffic;
            this.message = message;
        }

        public int getStableTraffic() {
            return stableTraffic;
        }

        public int getCanaryTraffic() {
            return canaryTraffic;
        }

        public String getMessage() {
            return message;
        }
    }
}