package com.progressivedelivery.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/releases")
public class ReleaseController {

    private final List<Release> releases = new ArrayList<>();

    private int nextId = 1;

    // Create a new release
    @PostMapping
    public ResponseEntity<Release> createRelease(
            @RequestBody ReleaseRequest request) {

        Release release = new Release(
                nextId++,
                request.getServiceName(),
                request.getVersion(),
                "CREATED",
                false
        );

        releases.add(release);

        return ResponseEntity.ok(release);
    }

    // Get all releases
    @GetMapping
    public List<Release> getReleases() {
        return releases;
    }

    // Approve a release
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveRelease(
            @PathVariable int id) {

        for (Release release : releases) {

            if (release.getId() == id) {

                release.setApproved(true);
                release.setStatus("APPROVED");

                return ResponseEntity.ok(release);
            }
        }

        return ResponseEntity.notFound().build();
    }

    // Request class
    public static class ReleaseRequest {

        private String serviceName;
        private String version;

        public String getServiceName() {
            return serviceName;
        }

        public void setServiceName(String serviceName) {
            this.serviceName = serviceName;
        }

        public String getVersion() {
            return version;
        }

        public void setVersion(String version) {
            this.version = version;
        }
    }

    // Release class
    public static class Release {

        private int id;
        private String serviceName;
        private String version;
        private String status;
        private boolean approved;

        public Release(
                int id,
                String serviceName,
                String version,
                String status,
                boolean approved) {

            this.id = id;
            this.serviceName = serviceName;
            this.version = version;
            this.status = status;
            this.approved = approved;
        }

        public int getId() {
            return id;
        }

        public String getServiceName() {
            return serviceName;
        }

        public String getVersion() {
            return version;
        }

        public String getStatus() {
            return status;
        }

        public boolean isApproved() {
            return approved;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public void setApproved(boolean approved) {
            this.approved = approved;
        }
    }
     @PostMapping("/{id}/canary")
    public ResponseEntity<?> startCanary(
        @PathVariable int id) {

    for (Release release : releases) {

        if (release.getId() == id) {

            if (!release.isApproved()) {
                return ResponseEntity.badRequest().body(
                        "Release must be approved before starting canary"
                );
            }

            release.setStatus("CANARY");

            return ResponseEntity.ok(release);
        }
    }

    return ResponseEntity.notFound().build();
}   
}
