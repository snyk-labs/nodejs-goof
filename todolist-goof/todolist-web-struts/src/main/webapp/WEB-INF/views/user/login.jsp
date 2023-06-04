<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="s" uri="/struts-tags"%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ include file="../common/header.jspf"%>
<%--content--%>

<div class="container">

    <div class="row">
        <div class="span6 offset3">
            <div class="page-header">
                <h1>Sign in</h1>
            </div>

            <%@ include file="../common/error.jspf"%>

            <s:form cssClass="well form-horizontal" method="post" action="login.do">
                <fieldset>

                    <div class="control-group">
                        <label class="control-label" for="email">Email:</label>
                        <div class="controls">
                            <s:textfield id="email" name="loginForm.email" cssClass="input-medium" placeholder="your@email.com" required="required"/>
                            <p class="help-block alert-error"><c:out value="${requestScope.errorEmail}"/></p>
                        </div>
                    </div>

                    <div class="control-group">
                        <label class="control-label" for="password">Password:</label>
                        <div class="controls">
                            <s:password id="password" name="loginForm.password" cssClass="input-medium" placeholder="min 6 characters" required="required"/>
                            <p class="help-block alert-error"><c:out value="${requestScope.errorPassword}"/></p>
                        </div>
                    </div>

                    <div class="form-actions">
                        <s:submit cssClass="btn btn-primary" value="Sign in"/>
                    </div>

                    <div align="center">
                        You don't have an account yet? <a href=<%= response.encodeURL(request.getContextPath() + "/register") %>>Register here for free!</a>
                    </div>

                </fieldset>
            </s:form>

        </div>
    </div>
</div>

<%--end content--%>
<%@ include file="../common/footer.jspf"%>
