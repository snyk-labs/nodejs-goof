/*
 * The MIT License
 *
 *   Copyright (c) 2015, Mahmoud Ben Hassine (mahmoud.benhassine@icloud.com)
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *   THE SOFTWARE.
 */

package io.github.benas.todolist.web.common.tags;

import io.github.benas.todolist.web.common.util.TodoListUtils;

import javax.servlet.jsp.JspException;
import javax.servlet.jsp.JspWriter;
import javax.servlet.jsp.tagext.SimpleTagSupport;
import java.io.IOException;

/**
 * Utility tag to transcode todo status to css style value.
 *
 * @author Mahmoud Ben Hassine (mahmoud.benhassine@icloud.com)
 */

public class StatusStyleTag extends SimpleTagSupport {

    /**
     * The todo status.
     */
    private boolean status;

    @Override
    public void doTag() throws JspException, IOException {

        JspWriter out = getJspContext().getOut();
        String statusStyle = TodoListUtils.getStatusStyle(status);
        out.print(statusStyle);

    }

    /*
     * setters for tag attributes
     */

    public void setStatus(boolean status) {
        this.status = status;
    }

}
