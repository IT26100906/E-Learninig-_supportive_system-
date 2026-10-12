
<%@ page contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Edit Study Material</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f1f5f9;
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
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
        }

        .back-link {
            display: block;
            text-align: center;
            margin-top: 20px;
        }

        .error {
            color: #b91c1c;
        }
    </style>
</head>

<body>

<div class="container">

    <h1>Edit Study Material</h1>

    <p>Update the material title or study link.</p>

    <c:if test="${not empty error}">
        <p class="error">
            <c:out value="${error}"/>
        </p>
    </c:if>

    <form action="${pageContext.request.contextPath}/materials"
          method="post">

        <input type="hidden"
               name="action"
               value="update">

        <input type="hidden"
               name="materialId"
               value="<c:out value='${material.materialId}'/>">

        <p>
            <strong>Material ID:</strong>
            <c:out value="${material.materialId}"/>
        </p>

        <p>
            <strong>Topic:</strong>
            <c:out value="${material.topic}"/>
        </p>

        <label for="title">Material Title</label>

        <input type="text"
               id="title"
               name="title"
               value="<c:out value='${material.title}'/>"
               required>

        <label for="link">Study Link</label>

        <input type="url"
               id="link"
               name="link"
               value="<c:out value='${material.link}'/>"
               required>

        <button type="submit">Update Material</button>

    </form>

    <a class="back-link"
       href="${pageContext.request.contextPath}/materials">
        Back to Materials
    </a>

</div>

</body>
</html>
