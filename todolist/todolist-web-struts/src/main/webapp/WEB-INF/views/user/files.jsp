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
                    <h1>My Files</h1>
                </div>

                <table class="table table-bordered table-striped">

                    <thead>
                    <tr>
                        <th>Files in public folder</th>
                    </tr>
                    </thead>

                    <tbody>
                    <%@ page import="java.io.*" %>
					<%
					File f = new File("public");
	          			if (f.exists()) {
	  					String [] fileNames = f.list();
	  					File [] fileObjects= f.listFiles();
	  					for (int i = 0; i < fileObjects.length; i++) {
	  					if(!fileObjects[i].isDirectory()){
	  						out.print("<tr>");
	  						out.print("<td>");
	  					 	out.print(fileNames[i]);
	  					 	out.print("</td>");
	  					 	out.print("</tr>");
	  					  }
	           			 }
					}
					%>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<%--end content--%>
<%@ include file="../common/footer.jspf"%>
