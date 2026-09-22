package com.progressivedelivery.backend.controller;

import com.progressivedelivery.backend.model.AuditLog;
import com.progressivedelivery.backend.repository.AuditLogRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    public AuditController(
            AuditLogRepository auditLogRepository) {

        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public List<AuditLog> getAuditLogs() {

        return auditLogRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<AuditLog> createAuditLog(
            @RequestBody AuditRequest request) {

        AuditLog auditLog = new AuditLog(
                request.getEventType(),
                request.getServiceName(),
                request.getVersion(),
                request.getMessage()
        );

        AuditLog savedAuditLog =
                auditLogRepository.save(auditLog);

        return ResponseEntity.ok(savedAuditLog);
    }

    public static class AuditRequest {

        private String eventType;
        private String serviceName;
        private String version;
        private String message;

        public String getEventType() {
            return eventType;
        }

        public void setEventType(String eventType) {
            this.eventType = eventType;
        }

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

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}