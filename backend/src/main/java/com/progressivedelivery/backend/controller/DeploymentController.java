package com.progressivedelivery.backend.controller;

import com.progressivedelivery.backend.model.Deployment;
import com.progressivedelivery.backend.repository.DeploymentRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deployments")
public class DeploymentController {

    private final DeploymentRepository deploymentRepository;

    public DeploymentController(
            DeploymentRepository deploymentRepository) {
        this.deploymentRepository = deploymentRepository;
    }

    // Get all deployments
    @GetMapping
    public List<Deployment> getDeployments() {
        return deploymentRepository.findAll();
    }

    // Create deployment
    @PostMapping
    public ResponseEntity<Deployment> createDeployment(
            @RequestBody DeploymentRequest request) {

        Deployment deployment = new Deployment(
                request.getServiceName(),
                request.getVersion(),
                request.getEnvironment(),
                request.getTraffic(),
                request.getStatus()
        );

        Deployment savedDeployment =
                deploymentRepository.save(deployment);

        return ResponseEntity.ok(savedDeployment);
    }

    // Update deployment
    @PutMapping("/{id}")
    public ResponseEntity<?> updateDeployment(
            @PathVariable Integer id,
            @RequestBody DeploymentRequest request) {

        return deploymentRepository.findById(id)
                .map(deployment -> {

                    deployment.setServiceName(
                            request.getServiceName());

                    deployment.setVersion(
                            request.getVersion());

                    deployment.setEnvironment(
                            request.getEnvironment());

                    deployment.setTraffic(
                            request.getTraffic());

                    deployment.setStatus(
                            request.getStatus());

                    return ResponseEntity.ok(
                            deploymentRepository.save(deployment));
                })
                .orElseGet(() ->
                        ResponseEntity.notFound().build());
    }

    // Request class
    public static class DeploymentRequest {

        private String serviceName;
        private String version;
        private String environment;
        private String traffic;
        private String status;

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

        public String getEnvironment() {
            return environment;
        }

        public void setEnvironment(String environment) {
            this.environment = environment;
        }

        public String getTraffic() {
            return traffic;
        }

        public void setTraffic(String traffic) {
            this.traffic = traffic;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}