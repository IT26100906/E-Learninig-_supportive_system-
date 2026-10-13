package com.learnhub.member2;

import jakarta.persistence.*;

@Entity
@Table(name = "courses")
public class Course {
    @Id
    @Column(name = "courseId", nullable = false, unique = true)
    private String courseId;
    private String title;
    private String description;
    private String duration;
    public Course() {}
    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
}
