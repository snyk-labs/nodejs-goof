<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="s" uri="/struts-tags"%>

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
                    <h1>Upload your todo list</h1>
                </div>
                <s:form namespace="/todo" id="updateTodoForm" action="upload.do" method="post" cssClass="form-horizontal" enctype="multipart/form-data">

                    <fieldset>

                        <div class="control-group">
                            <label class="control-label" for="title">File to upload</label>
                            <div class="controls">
                                <s:file name="upload" label="File"/>
                            </div>
                        </div>


                        <div class="form-actions">
                            <s:submit cssClass="btn btn-primary" value="Upload"/>
                        </div>

                    </fieldset>



                </s:form>

            </div>
        </div>
    </div>
</div>

<%--end content--%>
<%@ include file="../common/footer.jspf"%>
