
<%@ page contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Add Study Material</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 40px 20px;
        }

        .container {
            max-width: 550px;
            margin: auto;
            padding: 30px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px #00000015;
        }

        h1 {
            color: #1e3a8a;
            text-align: center;
        }

        label {
            display: block;
            margin-top: 18px;
            font-weight: bold;
        }

        input {
            width: 100%;
            box-sizing: border-box;
            padding: 12px;
            margin-top: 8px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
        }

        button {
            width: 100%;
            margin-top: 25px;
            padding: 13px;
            border: none;
            border-radius: 6px;
            background: #2563eb;
            color: white;
            font-size: 16px;
            cursor: pointer;
        }

        button:hover {
            background: #1d4ed8;
        }

        .error {
            color: #b91c1c;
            background: #fee2e2;
            padding: 10px;
            border-radius: 6px;
        }

        .back-link {
            display: block;
            text-align: center;
            margin-top: 20px;
        }
    </style>
</head>

<body>

<div class="container">

    <h1>Add Study Material</h1>

    <p>Enter the details of the new course material.</p>

    <c:if test="${not empty error}">
        <p class="error">
            <c:out value="${error}"/>
        </p>
    </c:if>

    <form action="${pageContext.request.contextPath}/materials"
          method="post">

        <input type="hidden" name="action" value="add">

        <label for="materialId">Material ID</label>
        <input type="text"
               id="materialId"
               name="materialId"
               placeholder="Example: MAT001"
               required>

        <label for="title">Material Title</label>
        <input type="text"
               id="title"
               name="title"
               placeholder="Example: Java OOP Notes"
               required>

        <label for="topic">Topic</label>
        <input type="text"
               id="topic"
               name="topic"
               placeholder="Example: Encapsulation"
               required>

        <label for="link">Web / Google Drive Link</label>
        <input type="url"
               id="link"
               name="link"
               placeholder="https://example.com/notes"
               required>

        <button type="submit">Add Material</button>

    </form>

    <a class="back-link"
       href="${pageContext.request.contextPath}/materials">
        View All Materials
    </a>

</div>

</body>
</html>
