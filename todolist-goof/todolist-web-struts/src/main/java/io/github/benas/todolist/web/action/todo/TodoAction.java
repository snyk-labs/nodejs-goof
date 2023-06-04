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

import java.io.File;
import java.text.MessageFormat;

import org.zeroturnaround.zip.ZipUtil;

import com.opensymphony.xwork2.Action;

import io.github.benas.todolist.web.action.BaseAction;
import io.github.todolist.core.domain.Todo;

/**
 * Action class for Todo CRUD operations.
 *
 * @author Mahmoud Ben Hassine (mahmoud.benhassine@icloud.com)
 */
public class TodoAction extends BaseAction {

    private String error;

    private Todo todo;

    private long todoId;

    private File file;
    private String contentType;
    private String filename;

    public void setUpload(File file) {
        this.file = file;
    }

    public void setUploadContentType(String contentType) {
        this.contentType = contentType;
    }

    public void setUploadFileName(String filename) {
        this.filename = filename;
    }

    public String execute() {
        return Action.SUCCESS;
    }


    public String create() {
        return Action.SUCCESS;
    }
    public String upload() {
        return Action.SUCCESS;
    }

    public String doCreate() {
        todo.setUserId(getSessionUser().getId());
        todoService.create(todo);
        return Action.SUCCESS;
    }

    public String doUpload() {
        if (this.contentType.equals("application/zip")) {
            System.out.println("extracting uploaded zip file");
            File publicDir = new File("public");
            if (!publicDir.exists())
            		publicDir.mkdirs();
            
			ZipUtil.unpack(this.file, publicDir);
        }
       return Action.SUCCESS;
    }

    public String update() {
        todo = todoService.getTodoById(todoId);
        //FIXME the todo should belong to the logged user
        return Action.SUCCESS;
    }

    public String doUpdate() {

        Todo t = todoService.getTodoById(todoId); // Unable to update the model "todo" since there is no setter for the id
        t.setDone(todo.isDone());
        t.setDueDate(todo.getDueDate());
        t.setPriority(todo.getPriority());
        t.setTitle(todo.getTitle());
        t.setUserId(todo.getUserId());
        todoService.update(t);
        return Action.SUCCESS;
    }

    public String doDelete() {
        Todo todo = todoService.getTodoById(todoId);
        //FIXME the todo should belong to the logged user
        if (todo != null) {
            todoService.remove(todo);
            return Action.SUCCESS;
        } else {
            error = MessageFormat.format(getText("no.such.todo"), todoId);
            return Action.ERROR;
        }
    }

    /*
    * Getters for model attributes
    */
    public Todo getTodo() {
        return todo;
    }

    public String getError() {
        return error;
    }

    /*
     * Setters for request parameters binding
     */
    public void setTodo(Todo todo) {
        this.todo = todo;
    }

    public void setTodoId(long todoId) {
        this.todoId = todoId;
    }

}
