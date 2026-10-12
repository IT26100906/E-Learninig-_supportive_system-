
<%@ page contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Study Materials</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f1f5f9;
            margin: 0;
            padding: 30px 20px;
        }

        .container {
            max-width: 1100px;
            margin: auto;
        }

        h1 {
            color: #1e3a8a;
        }

        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        .button {
            display: inline-block;
            padding: 10px 15px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }

        .search-box {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 10px;
        }

        input {
            padding: 10px;
            border: 1px solid #cbd5e1;
            border-radius: 5px;
            max-width: 100%;
            box-sizing: border-box;
        }

        .table-wrapper {
            overflow-x: auto;
            background: white;
            border-radius: 10px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            padding: 14px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }

        th {
            background: #dbeafe;
            color: #1e3a8a;
        }

        .edit-link {
            color: #2563eb;
        }

        .delete-button {
            background: #dc2626;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 8px 10px;
            cursor: pointer;
        }

        .empty-message {
            text-align: center;
            padding: 25px;
        }
    </style>
</head>

<body>

<div class="container">

    <div class="top-bar">
        <div>
            <h1>Course Notes / Study Materials</h1>
            <p>View and manage your learning materials.</p>
        </div>

        <a class="button"
           href="${pageContext.request.contextPath}/materials?action=add">
            + Add New Material
        </a>
    </div>

    <div class="search-box">

        <h3>Search Materials by Topic</h3>

        <form action="${pageContext.request.contextPath}/materials"
              method="get">

            <input type="text"
                   name="topic"
                   placeholder="Example: Java, Encapsulation">

            <button class="button" type="submit">
                Search
            </button>

            <a class="button"
               href="${pageContext.request.contextPath}/materials">
                Show All
            </a>

        </form>

    </div>

    <div class="table-wrapper">

        <table>
            <thead>
            <tr>
                <th>Material ID</th>
                <th>Title</th>
                <th>Topic</th>
                <th>Study Link</th>
                <th>Actions</th>
            </tr>
            </thead>

            <tbody>

            <c:forEach var="m" items="${materials}">

                <tr>
                    <td>
                        <c:out value="${m.materialId}"/>
                    </td>

                    <td>
                        <c:out value="${m.title}"/>
                    </td>

                    <td>
                        <c:out value="${m.topic}"/>
                    </td>

                    <td>
                        <a href="${m.link}"
                           target="_blank"
                           rel="noopener noreferrer">
                            Open Material
                        </a>
                    </td>

                    <td>
                        <a class="edit-link"
                           href="${pageContext.request.contextPath}/materials?action=edit&amp;id=${m.materialId}">
                            Edit
                        </a>

                        <form action="${pageContext.request.contextPath}/materials"
                              method="post"
                              style="display:inline"
                              onsubmit="return confirm('Are you sure you want to delete this material?');">

                            <input type="hidden"
                                   name="action"
                                   value="delete">

                            <input type="hidden"
                                   name="materialId"
                                   value="<c:out value='${m.materialId}'/>">

                            <button class="delete-button"
                                    type="submit">
                                Delete
                            </button>

                        </form>
                    </td>
                </tr>

            </c:forEach>

            <c:if test="${empty materials}">
                <tr>
                    <td colspan="5" class="empty-message">
                        No study materials found.
                    </td>
                </tr>
            </c:if>

            </tbody>
        </table>

    </div>

</div>

</body>
</html>
