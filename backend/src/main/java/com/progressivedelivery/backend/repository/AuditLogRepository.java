package com.progressivedelivery.backend.repository;

import com.progressivedelivery.backend.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository
        extends JpaRepository<AuditLog, Integer> {
}