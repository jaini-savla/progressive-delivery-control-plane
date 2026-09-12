package com.progressivedelivery.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
public class DeploymentController {

    @GetMapping("/api/deployments")
    public List<Deployment> getDeployments() {

        List<Deployment> deployments = new ArrayList<>();

        deployments.add(new Deployment(
                1,
                "payment-service",
                "v1.0",
                "Production",
                "100%",
                "Healthy"
        ));

        deployments.add(new Deployment(
                2,
                "user-service",
                "v2.0",
                "Canary",
                "20%",
                "Healthy"
        ));

        deployments.add(new Deployment(
                3,
                "order-service",
                "v1.5",
                "Staging",
                "0%",
                "Ready"
        ));

        return deployments;
    }

    public static class Deployment {

        private int id;
        private String serviceName;
        private String version;
        private String environment;
        private String traffic;
        private String status;

        public Deployment(int id, String serviceName, String version,
                          String environment, String traffic, String status) {
            this.id = id;
            this.serviceName = serviceName;
            this.version = version;
            this.environment = environment;
            this.traffic = traffic;
            this.status = status;
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

        public String getEnvironment() {
            return environment;
        }

        public String getTraffic() {
            return traffic;
        }

        public String getStatus() {
            return status;
        }
    }
}