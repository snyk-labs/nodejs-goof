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

package io.github.benas.todolist.web.action.user;

import java.io.File;
import java.util.List;

import com.opensymphony.xwork2.Action;

import io.github.benas.todolist.web.action.BaseAction;
import io.github.benas.todolist.web.common.util.TodoListUtils;
import io.github.todolist.core.domain.Todo;
import io.github.todolist.core.domain.User;

/**
 * Action class to load user's todo list in home page.
 * <p/>
 * benas (mahmoud.benhassine@icloud.com)
 */
public class FilesAction extends BaseAction {

    private List<Todo> todoList;

    private int totalCount;

    private int doneCount;

    private int todoCount;

    public String execute() {
        User user = getSessionUser();
        todoList = todoService.getTodoListByUser(user.getId());
        totalCount = todoList.size();
        doneCount = TodoListUtils.countTotalDone(todoList);
        todoCount = totalCount - doneCount;
        return Action.SUCCESS;
    }

    /*
     * Getters for model attributes
     */

    public List<Todo> getTodoList() {
        return todoList;
    }

    public String getHomeTabStyle() {
        return "active";
    }

    public int getTotalCount() {
        return totalCount;
    }

    public int getDoneCount() {
        return doneCount;
    }

    public int getTodoCount() {
        return todoCount;
    }

}
