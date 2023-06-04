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

package io.github.benas.todolist.web.action.todo;

import com.opensymphony.xwork2.Action;
import io.github.benas.todolist.web.action.BaseAction;
import io.github.todolist.core.domain.Todo;

import java.util.List;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

/**
 * Action class to search todo list by title.
 *
 * @author Mahmoud Ben Hassine (mahmoud.benhassine@icloud.com)
 */
public class SearchTodoAction extends BaseAction {
    private static final Logger logger = LogManager.getLogger(SearchTodoAction.class);

    private String title;

    List<Todo> todoList;

    public String execute() {
        logger.info("Searching for: " + title);
        todoList = todoService.searchTodoListByTitle(getSessionUser().getId(), title);
        return Action.SUCCESS;
    }

    /*
     * Getters for model attributes
     */
    public String getTitle() {
        return title;
    }

    public List<Todo> getTodoList() {
        return todoList;
    }

    /*
     * Setters for request parameters binding
     */

    public void setTitle(String title) {
        this.title = title;
    }

}
