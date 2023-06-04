<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="s" uri="/struts-tags" %>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ include file="../common/header.jspf" %>

<div class="container">
    <div class="row">
        <div class="span3">
            <%@ include file="../common/sidebar.jspf" %>
        </div>
        <div class="span9">
            <div class="well">
                <div class="page-header">
                    <h1>My settings</h1>
                </div>

                <%@ include file="../common/error.jspf"%>

                <div class="row">
                    <div class="span8">
                        <s:form cssClass="form-horizontal" namespace="/user" method="post" action="update.do">
                            <fieldset>
                                <legend>Update my profile <p class="alert-success">${requestScope.updateProfileSuccessMessage}</p></legend>

                                <div class="control-group">
                                    <label class="control-label" for="id">Id:</label>

                                    <div class="controls">
                                        <s:textfield name="user.id" id="id" cssClass="input-medium" disabled="true"/>
                                    </div>
                                </div>

                                <div class="control-group">
                                    <label class="control-label" for="name">Name:</label>

                                    <div class="controls">
                                        <s:textfield name="user.name" id="name" cssClass="input-medium" required="required"/>
                                    </div>
                                </div>

                                <div class="control-group">
                                    <label class="control-label" for="email">Email:</label>

                                    <div class="controls">
                                        <s:textfield name="user.email" id="email" cssClass="input-medium" required="required"/>
                                    </div>
                                </div>

                                <div class="form-actions">
                                    <s:submit cssClass="btn btn-primary" value="Update my profile"/>
                                </div>

                            </fieldset>
                        </s:form>
                    </div>
                </div>

                <div class="row">
                    <div class="span8">
                        <s:form cssClass="form-horizontal" namespace="/user" action="changePassword.do" method="post">

                            <fieldset>

                                <legend>Update my Password <p class="alert-success">${requestScope.updatePasswordSuccessMessage}</p></legend>

                                <div class="control-group">
                                    <label class="control-label" for="currentPassword">Current password:</label>

                                    <div class="controls">
                                        <s:password id="currentPassword" name="changePasswordForm.currentPassword" cssClass="input-medium" placeholder="min 6 characters" required="required"/>
                                        <p class="help-block alert-error"><c:out value="${requestScope.errorCurrentPassword}"/></p>
                                    </div>
                                </div>

                                <div class="control-group">
                                    <label class="control-label" for="newPassword">New password:</label>

                                    <div class="controls">
                                        <s:password id="newPassword" name="changePasswordForm.newPassword" cssClass="input-medium" placeholder="min 6 characters" required="required"/>
                                        <p class="help-block alert-error"><c:out value="${requestScope.errorNewPassword}"/></p>
                                    </div>
                                </div>

                                <div class="control-group">
                                    <label class="control-label" for="confirmationPassword">Confirmation password:</label>

                                    <div class="controls">
                                        <s:password id="confirmationPassword" name="changePasswordForm.confirmationPassword" cssClass="input-medium" placeholder="min 6 characters" required="required"/>
                                        <p class="help-block alert-error"><c:out value="${requestScope.errorConfirmationPassword}"/></p>
                                    </div>
                                </div>

                                <div class="form-actions">
                                    <s:submit cssClass="btn btn-primary" value="Update my password"/>
                                </div>
                            </fieldset>
                        </s:form>
                    </div>
                </div>

                <div class="row">
                    <div class="span8">
                        <s:form cssClass="form-horizontal" namespace="/user" action="updateAvatar.do" method="post">
                            <fieldset>
                                <legend>Update my avatar</legend>
                                <div class="alert alert-block">
                                    <p>Upload a new avatar for your profile. The image will be resized to 100x100 pixels.</p>
                                    <p>
                                        <a class="btn btn-primary" href="#"> <i class="icon-upload icon-white"></i> Upload a new avatar</a>
                                    </p>
                                </div>
                                <div class="form-actions">
                                    <s:submit cssClass="btn btn-primary" value="Update my avatar"/>
                                </div>
                            </fieldset>
                        </s:form>
                    </div>
                </div>
                <div class="row">
                    <div class="span8">
                        <fieldset>
                            <legend>Delete my account</legend>
                            <div class="alert alert-block alert-error fade in">
                                <p>You are about to remove your account from "Todolist MVC". This will completely
                                    delete all your data and you will be no more able to use your account.
                                    Please be sure.</p>
                                <p>
                                    <a class="btn btn-danger" data-toggle="modal" href="#deleteAccountLink"> <i class="icon-remove icon-white"></i> Delete my account</a>
                                </p>
                                <div class="modal hide" id="deleteAccountLink">
                                    <div class="modal-header">
                                        <h3>Confirmation</h3>
                                    </div>
                                    <div class="modal-body">
                                        <p>Are you sure to delete your account?</p>
                                    </div>
                                    <div class="modal-footer">
                                        <s:form cssClass="form-horizontal" namespace="/user" action="delete.do" method="post">
                                            <p>
                                                <a href="#" class="btn" data-dismiss="modal">No, I'm not sure</a>
                                                <s:submit cssClass="btn btn-danger" value="Yes, I do confirm!"/>
                                            </p>
                                        </s:form>
                                    </div>
                                </div>
                            </div>
                        </fieldset>
                    </div>
                </div>

            </div>
        </div>
    </div>
</div>

<%--end content--%>
<%@ include file="../common/footer.jspf" %>
