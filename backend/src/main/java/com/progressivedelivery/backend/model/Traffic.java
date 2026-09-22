package com.progressivedelivery.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "traffic")
public class Traffic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private int stableTraffic;
    private int canaryTraffic;

    public Traffic() {
        // Required by JPA
    }

    public Traffic(int stableTraffic, int canaryTraffic) {
        this.stableTraffic = stableTraffic;
        this.canaryTraffic = canaryTraffic;
    }

    public Integer getId() {
        return id;
    }

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