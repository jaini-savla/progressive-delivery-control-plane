package com.progressivedelivery.backend.repository;

import com.progressivedelivery.backend.model.Rollback;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RollbackRepository
        extends JpaRepository<Rollback, Integer> {
}