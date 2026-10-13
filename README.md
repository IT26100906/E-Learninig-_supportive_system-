# LearnHub — Member 2: Course Details Management

This is a **standalone IntelliJ IDEA project** for the assigned portion of the E-Learning Supportive System.

## Features
Add, view/search, edit title/duration, and delete courses.

## Requirements
- JDK 17 or newer
- IntelliJ IDEA
- Internet connection on first Maven import (to download dependencies)

## Run in IntelliJ
1. Extract this ZIP folder (or open this folder from the combined ZIP after extracting).
2. In IntelliJ, choose **File → Open** and select this folder, the one containing `pom.xml`.
3. Trust/open the Maven project and wait for dependencies to finish loading.
4. Run `LearnHubMember2Application.java`.
5. Open **http://localhost:8082**.

Data is stored in a local H2 database under this project's `data` folder; it persists between restarts. H2 console: `http://localhost:8082/h2-console` (JDBC URL from `application.properties`).

## REST API
- `GET /api/courses` — list all
- `GET /api/courses?q=...` — search
- `GET /api/courses/{id}` — get one
- `POST /api/courses` — create JSON record
- `PUT /api/courses/{id}` — update JSON record
- `DELETE /api/courses/{id}` — delete

The HTML UI at `/` uses this API. This member project runs independently on port 8082; run only one project at a time if you change ports manually.
