package com.geoquiz;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GeoQuizApplication {
    public static void main(String[] args) {
        SpringApplication.run(GeoQuizApplication.class, args);
    }
}
