
package com.elearning.servlet;

import com.elearning.model.Material;
import com.elearning.service.MaterialFileService;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.net.URI;
import java.util.List;

@WebServlet("/materials")
public class MaterialServlet extends HttpServlet {

    private final MaterialFileService service =
            new MaterialFileService();

    private static final String ADD_PAGE =
            "/WEB-INF/views/add-material.jsp";

    private static final String LIST_PAGE =
            "/WEB-INF/views/materials-list.jsp";

    private static final String EDIT_PAGE =
            "/WEB-INF/views/edit-material.jsp";

    // Display pages and search materials
    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        String action = request.getParameter("action");

        // Open Add Material page
        if ("add".equals(action)) {
            request.getRequestDispatcher(ADD_PAGE)
                    .forward(request, response);
            return;
        }

        // Open Edit Material page
        if ("edit".equals(action)) {

            String id = request.getParameter("id");
            Material material = service.findById(id);

            if (material == null) {
                response.sendError(
                        HttpServletResponse.SC_NOT_FOUND,
                        "Material not found"
                );
                return;
            }

            request.setAttribute("material", material);

            request.getRequestDispatcher(EDIT_PAGE)
                    .forward(request, response);
            return;
        }

        // Display all materials or search by topic
        String topic = request.getParameter("topic");
        List<Material> materials;

        if (topic == null || topic.trim().isEmpty()) {
            materials = service.getAllMaterials();
        } else {
            materials = service.searchByTopic(topic);
        }

        request.setAttribute("materials", materials);

        request.getRequestDispatcher(LIST_PAGE)
                .forward(request, response);
    }

    // Add, update and delete materials
    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");

        String action = request.getParameter("action");

        // CREATE
        if ("add".equals(action)) {

            String id = value(request, "materialId");
            String title = value(request, "title");
            String topic = value(request, "topic");
            String link = value(request, "link");

            if (!validId(id)
                    || !validText(title)
                    || !validText(topic)
                    || !validHttpUrl(link)) {

                request.setAttribute(
                        "error",
                        "Enter valid material details and an HTTP/HTTPS link."
                );

                request.getRequestDispatcher(ADD_PAGE)
                        .forward(request, response);
                return;
            }

            Material material =
                    new Material(id, title, topic, link);

            boolean added = service.addMaterial(material);

            if (!added) {
                request.setAttribute(
                        "error",
                        "This Material ID already exists."
                );

                request.getRequestDispatcher(ADD_PAGE)
                        .forward(request, response);
                return;
            }

            response.sendRedirect(
                    request.getContextPath() + "/materials"
            );
            return;
        }

        // UPDATE
        if ("update".equals(action)) {

            String id = value(request, "materialId");
            String title = value(request, "title");
            String link = value(request, "link");

            if (!validId(id)
                    || !validText(title)
                    || !validHttpUrl(link)) {

                response.sendError(
                        HttpServletResponse.SC_BAD_REQUEST,
                        "Invalid material details"
                );
                return;
            }

            boolean updated =
                    service.updateMaterial(id, title, link);

            if (!updated) {
                response.sendError(
                        HttpServletResponse.SC_NOT_FOUND,
                        "Material not found"
                );
                return;
            }

            response.sendRedirect(
                    request.getContextPath() + "/materials"
            );
            return;
        }

        // DELETE
        if ("delete".equals(action)) {

            String id = value(request, "materialId");

            if (!validId(id)) {
                response.sendError(
                        HttpServletResponse.SC_BAD_REQUEST,
                        "Invalid Material ID"
                );
                return;
            }

            boolean deleted = service.deleteMaterial(id);

            if (!deleted) {
                response.sendError(
                        HttpServletResponse.SC_NOT_FOUND,
                        "Material not found"
                );
                return;
            }

            response.sendRedirect(
                    request.getContextPath() + "/materials"
            );
            return;
        }

        response.sendError(
                HttpServletResponse.SC_BAD_REQUEST,
                "Invalid action"
        );
    }

    // Safely retrieve form values
    private String value(
            HttpServletRequest request, String name) {

        String result = request.getParameter(name);

        return result == null ? "" : result.trim();
    }

    // Validate material ID
    private boolean validId(String id) {
        return id != null
                && id.matches("[A-Za-z0-9_-]{1,30}");
    }

    // Validate text fields
    private boolean validText(String text) {
        return text != null
                && !text.trim().isEmpty()
                && !text.contains("|")
                && !text.contains("\n")
                && !text.contains("\r");
    }

    // Accept only HTTP or HTTPS URLs
    private boolean validHttpUrl(String link) {

        try {
            URI uri = new URI(link);
            String scheme = uri.getScheme();

            return uri.getHost() != null
                    && ("http".equalsIgnoreCase(scheme)
                    || "https".equalsIgnoreCase(scheme));

        } catch (Exception e) {
            return false;
        }
    }
}
