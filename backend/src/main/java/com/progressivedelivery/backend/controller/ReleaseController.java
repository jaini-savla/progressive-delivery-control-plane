package com.progressivedelivery.backend.controller;

import com.progressivedelivery.backend.model.Release;
import com.progressivedelivery.backend.repository.ReleaseRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.progressivedelivery.backend.model.AuditLog;
import com.progressivedelivery.backend.repository.AuditLogRepository;

@RestController
@RequestMapping("/api/releases")
public class ReleaseController {

    private final ReleaseRepository releaseRepository;
    private final AuditLogRepository auditLogRepository;

    public ReleaseController(
        ReleaseRepository releaseRepository,
        AuditLogRepository auditLogRepository) {

    this.releaseRepository = releaseRepository;
    this.auditLogRepository = auditLogRepository;
}

    // Create a new release
    @PostMapping
    public ResponseEntity<Release> createRelease(
            @RequestBody ReleaseRequest request) {

        Release release = new Release(
                request.getServiceName(),
                request.getVersion(),
                "CREATED",
                false
        );

        Release savedRelease = releaseRepository.save(release);

AuditLog auditLog = new AuditLog(
        "RELEASE_CREATED",
        savedRelease.getServiceName(),
        savedRelease.getVersion(),
        "Release created successfully"
);

auditLogRepository.save(auditLog);

return ResponseEntity.ok(savedRelease);
    }

    // Get all releases
    @GetMapping
    public List<Release> getReleases() {
        return releaseRepository.findAll();
    }

    // Approve a release
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveRelease(
            @PathVariable Integer id) {

        return releaseRepository.findById(id)
                .map(release -> {

                    release.setApproved(true);
                    release.setStatus("APPROVED");

                   Release updatedRelease = releaseRepository.save(release);

AuditLog auditLog = new AuditLog(
        "RELEASE_APPROVED",
        updatedRelease.getServiceName(),
        updatedRelease.getVersion(),
        "Release approved successfully"
);

auditLogRepository.save(auditLog);

return ResponseEntity.ok(updatedRelease);
                })
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    // Start canary deployment
    @PostMapping("/{id}/canary")
    public ResponseEntity<?> startCanary(
            @PathVariable Integer id) {

        return releaseRepository.findById(id)
                .map(release -> {

                    if (!release.isApproved()) {
                        return ResponseEntity.badRequest().body(
                                "Release must be approved before starting canary"
                        );
                    }

                    release.setStatus("CANARY");

                    Release updatedRelease = releaseRepository.save(release);

AuditLog auditLog = new AuditLog(
        "CANARY_STARTED",
        updatedRelease.getServiceName(),
        updatedRelease.getVersion(),
        "Canary deployment started"
);

auditLogRepository.save(auditLog);

return ResponseEntity.ok(updatedRelease);
                })
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
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
}