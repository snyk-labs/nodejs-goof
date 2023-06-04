<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<%@ include file="common/header.jspf"%>

<div class="container">
    <div class="row well">
        <div class="span10 offset1">
            <div class="row">

                <div class="span5">
                    <h3>Welcome to Todolist MVC</h3>
                    <p>
                    <h4>Todolist MVC is a web-based task manager which allows you to:</h4>
                    <ul>
                        <li>Save and organize your todo list</li>
                        <li>Search easily your todo list</li>
                        <li>Sort and filter your todo list</li>
                        <li>Export and report your todo list</li>
                    </ul>
                    <h4>And which is totally Free! Enjoy !</h4>
                    </p>

                    <c:if test="${sessionScope.user == null}">
                    <p>
                        <a class="btn btn-primary btn-large" href="<%= response.encodeURL(request.getContextPath() + "/login") %>"> Sign in </a> or <a class="btn btn-primary btn-large" href=<%= response.encodeURL(request.getContextPath() + "/register") %>"> Sign up </a>
                    </p>
                    </c:if>

                    <c:if test="${sessionScope.user != null}">
                        <p>
                            <a class="btn btn-primary btn-large" href="<%= response.encodeURL(request.getContextPath() + "/user/home") %>"> Go to my Home page </a>
                        </p>
                    </c:if>

                </div>

                <div class="span5">
                    <img src="<%= response.encodeURL(request.getContextPath() + "/static/img/todolist.jpg") %>" alt="todolist">
                </div>

            </div>

        </div>

    </div>
</div>

<%@ include file="common/footer.jspf"%>
