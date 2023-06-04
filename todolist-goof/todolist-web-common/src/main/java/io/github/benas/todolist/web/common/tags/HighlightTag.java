/*
 * The MIT License
 *
 *  Copyright (c) 2015, Mahmoud Ben Hassine (mahmoud.benhassine@icloud.com)
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

package io.github.benas.todolist.web.common.tags;

import java.io.File;
import java.io.IOException;
import java.io.StringWriter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.jsp.JspException;
import javax.servlet.jsp.JspWriter;
import javax.servlet.jsp.tagext.SimpleTagSupport;

/**
 * Utility tag to highlight text patterns with css style.
 *
 * @author Mahmoud Ben Hassine (mahmoud.benhassine@icloud.com)
 */

public class HighlightTag extends SimpleTagSupport {

    /**
     * The pattern to highlight.
     */
    private String pattern;

    /**
     * the css class to apply for highlighting patterns.
     */
    private String cssClass;

    /**
     * Case sensitivity parameter for pattern search/replace.
     */
    private boolean caseSensitive;

    @Override
    public void doTag() throws JspException, IOException {

        JspWriter out = getJspContext().getOut();
        StringWriter stringWriter = new StringWriter();
        getJspBody().invoke(stringWriter);
        String highlightedValue = doHighlight(stringWriter.toString());
        out.print(highlightedValue);
    }

    /**
     * Apply a search/replace of the pattern in the input text.
     *
     * @param input text to which apply the style for each pattern matched
     * @return the transformed text
     */
    private String doHighlight(final String input) {

        String startSpanTag = "<span class=\"" + cssClass + "\">";
        String endSpanTag = "</span>";

        StringBuilder stringBuilder = new StringBuilder(startSpanTag);
        stringBuilder.append(pattern);
        stringBuilder.append(endSpanTag);

        Pattern pattern;

        if (caseSensitive) {
            pattern = Pattern.compile(this.pattern);
        } else {
            pattern = Pattern.compile(this.pattern, Pattern.CASE_INSENSITIVE);
        }
        Matcher matcher = pattern.matcher(input);

        return matcher.replaceAll(stringBuilder.toString());

    }

    /*
     * setters for tag attributes
     */

    public void setPattern(String pattern) {
        this.pattern = pattern;
    }

    public void setCssClass(String cssClass) {
        this.cssClass = cssClass;
    }

    public void setCaseSensitive(boolean caseSensitive) {
        this.caseSensitive = caseSensitive;
    }
}
