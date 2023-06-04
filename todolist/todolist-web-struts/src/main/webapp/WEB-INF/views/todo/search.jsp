<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="s" uri="/struts-tags"%>
<%@ taglib prefix="tl" uri="http://todolist.org/taglib" %>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ include file="../common/header.jspf"%>

<div class="container">
    <div class="row">
        <div class="span3">
            <%@ include file="../common/sidebar.jspf"%>
        </div>
        <div class="span9">
            <div class="well">
                <div class="page-header">
                    <h1>Search results for title: '${param.title}' </h1>
                </div>

                <table class="table table-bordered table-striped">

                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Due Date</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                    </thead>

                    <tbody>
                    <c:forEach items="${requestScope.todoList}" var="currentTodo">
                        <tr>
                            <td>${currentTodo.id}</td>
                            <td><tl:highlight pattern="${param.title}" cssClass="label label-warning">${currentTodo.title}</tl:highlight></td>
                            <td><fmt:formatDate value="${currentTodo.dueDate}" pattern="dd/MM/yyyy"/></td>
                            <td><i class="icon-circle-arrow-<tl:priorityIcon priority="${currentTodo.priority}"/>"></i> ${currentTodo.priority}</td>
                            <td><span class="label <tl:statusStyle status="${currentTodo.done}"/> "> <tl:statusLabel status="${currentTodo.done}"/></span></td>
                            <td>
                                <a class="btn btn-mini btn-primary" href=<%= response.encodeURL(request.getContextPath() + "/todo/update?todoId=${currentTodo.id}") %>><i class="icon-edit icon-white"></i> Edit</a>
                                <a class="btn btn-mini btn-danger" data-toggle="modal" href="#confirm_delete_${currentTodo.id}"><i class="icon-remove icon-white"></i> Delete</a>
                                <div class="modal hide" id="confirm_delete_${currentTodo.id}">
                                    <div class="modal-header">
                                        <button type="button" class="close" data-dismiss="modal">×</button>
                                        <h3>Confirmation</h3>
                                    </div>
                                    <div class="modal-body">
                                        <p>Are you sure to delete todo ${currentTodo.id} '${currentTodo.title}' ?</p>
                                    </div>
                                    <div class="modal-footer">
                                        <s:form namespace="/todo" action="delete.do" method="post">
                                            <%-- issue with s:hidden : not able to set 'value' attribute with ${currentTodo.id} nor %{currentTodo.id} --%>
                                            <input type="hidden" name="todoId" value="${currentTodo.id}" />
                                            <a href="#" class="btn" data-dismiss="modal">Cancel</a> <s:submit cssClass="btn btn-primary" value="Confirm"/>
                                        </s:form>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </c:forEach>

                    </tbody>
                </table>

                <c:if test="${empty requestScope.todoList}">
                    <div class="alert alert-info">
                        <div align="center">No todo with title '${param.title}'</div>
                    </div>
                </c:if>

                <c:if test="${not empty requestScope.todoList}">
                <div align="center">
                    <button class="btn" onclick="javascript:window.print()">
                        <i class="icon-print"></i>
                        Print todo list
                    </button>
                </div>
                </c:if>

            </div>
        </div>
    </div>
</div>

<%--end content--%>
<%@ include file="../common/footer.jspf"%>
