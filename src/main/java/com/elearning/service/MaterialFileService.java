
package com.elearning.service;

import com.elearning.model.Material;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;

public class MaterialFileService {

    private final Path filePath = Paths.get(
            System.getProperty("user.dir"),
            "data",
            "materials.txt"
    );

    // Create the data folder and file if they do not exist
    private void ensureFileExists() throws IOException {

        Path folder = filePath.getParent();

        if (!Files.exists(folder)) {
            Files.createDirectories(folder);
        }

        if (!Files.exists(filePath)) {
            Files.createFile(filePath);
        }
    }

    // READ: Read all materials from the text file
    private List<Material> readAll() throws IOException {

        ensureFileExists();

        List<Material> materials = new ArrayList<>();
        List<String> lines = Files.readAllLines(
                filePath, StandardCharsets.UTF_8
        );

        for (String line : lines) {

            if (line.trim().isEmpty()) {
                continue;
            }

            String[] parts = line.split("\\|", 4);

            if (parts.length == 4) {
                Material material = new Material(
                        parts[0],
                        parts[1],
                        parts[2],
                        parts[3]
                );

                materials.add(material);
            }
        }

        return materials;
    }

    // WRITE: Save all materials to the text file
    private void writeAll(List<Material> materials)
            throws IOException {

        ensureFileExists();

        List<String> lines = new ArrayList<>();

        for (Material m : materials) {

            String line = m.getMaterialId() + "|"
                    + m.getTitle() + "|"
                    + m.getTopic() + "|"
                    + m.getLink();

            lines.add(line);
        }

        Files.write(
                filePath,
                lines,
                StandardCharsets.UTF_8,
                StandardOpenOption.CREATE,
                StandardOpenOption.TRUNCATE_EXISTING
        );
    }

    // READ: Get all materials
    public List<Material> getAllMaterials()
            throws IOException {

        return readAll();
    }

    // READ: Search by topic
    public List<Material> searchByTopic(String topic)
            throws IOException {

        List<Material> results = new ArrayList<>();

        for (Material m : readAll()) {

            if (m.getTopic().toLowerCase()
                    .contains(topic.trim().toLowerCase())) {

                results.add(m);
            }
        }

        return results;
    }

    // READ: Find one material by ID
    public Material findById(String id)
            throws IOException {

        for (Material m : readAll()) {

            if (m.getMaterialId().equals(id)) {
                return m;
            }
        }

        return null;
    }

    // CREATE: Add a new material
    public boolean addMaterial(Material material)
            throws IOException {

        List<Material> materials = readAll();

        for (Material m : materials) {

            if (m.getMaterialId().equals(
                    material.getMaterialId())) {

                return false;
            }
        }

        materials.add(material);
        writeAll(materials);

        return true;
    }

    // UPDATE: Update title and link
    public boolean updateMaterial(
            String id, String newTitle, String newLink)
            throws IOException {

        List<Material> materials = readAll();

        for (int i = 0; i < materials.size(); i++) {

            Material m = materials.get(i);

            if (m.getMaterialId().equals(id)) {

                Material updated = new Material(
                        m.getMaterialId(),
                        newTitle,
                        m.getTopic(),
                        newLink
                );

                materials.set(i, updated);
                writeAll(materials);

                return true;
            }
        }

        return false;
    }

    // DELETE: Remove a material by ID
    public boolean deleteMaterial(String id)
            throws IOException {

        List<Material> materials = readAll();
        int oldSize = materials.size();

        materials.removeIf(
                m -> m.getMaterialId().equals(id)
        );

        if (materials.size() == oldSize) {
            return false;
        }

        writeAll(materials);

        return true;
    }
}
