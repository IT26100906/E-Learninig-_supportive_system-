package com.learnhub.member2;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin
public class CourseController {
    private final CourseRepository repository;
    public CourseController(CourseRepository repository) { this.repository = repository; }
    @GetMapping public List<Course> all(@RequestParam(required=false) String q) {
        if (q == null || q.isBlank()) return repository.findAll();
        return repository.findAll().stream().filter(x -> x.getCourseId().toLowerCase().contains(q.toLowerCase())).toList();
    }
    @GetMapping("/{id}") public Course one(@PathVariable String id) { return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")); }
    @PostMapping public Course create(@RequestBody Course value) { if (value.getCourseId() == null || value.getCourseId().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID is required"); if (repository.existsById(value.getCourseId())) throw new ResponseStatusException(HttpStatus.CONFLICT, "ID already exists"); return repository.save(value); }
    @PutMapping("/{id}") public Course update(@PathVariable String id, @RequestBody Course value) { if (!repository.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"); value.setCourseId(id); return repository.save(value); }
    @DeleteMapping("/{id}") public void delete(@PathVariable String id) { if (!repository.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"); repository.deleteById(id); }
}
