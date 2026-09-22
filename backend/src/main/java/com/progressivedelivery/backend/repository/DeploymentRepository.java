package com.progressivedelivery.backend.repository;

import com.progressivedelivery.backend.model.Deployment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeploymentRepository
        extends JpaRepository<Deployment, Integer> {

    List<Deployment> findByStatus(String status);
}