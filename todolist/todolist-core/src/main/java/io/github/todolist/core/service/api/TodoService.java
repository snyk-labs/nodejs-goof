/*
 * The MIT License
 *
 * Copyright (c) 2015, Mahmoud Ben Hassine (mahmoud.benhassine@icloud.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

package io.github.todolist.core.service.api;

import io.github.todolist.core.domain.Todo;

import java.util.List;

/**
 * Business interface for todo service.
 *
 * @author Mahmoud Ben Hassine (mahmoud.benhassine@icloud.com)
 */
public interface TodoService {

    /**
     * Get todo by id.
     *
     * @param id the todo's id
     * @return the todo having the given id or null if no todo found with the given id
     */
    Todo getTodoById(final long id);

    /**
     * Get todo list for the given user.
     *
     * @param userId the user's id
     * @return the todo list for the given user
     */
    List<Todo> getTodoListByUser(final long userId);

    /**
     * Search todo list by title for the given user.
     *
     * @param title  the todo's title
     * @param userId the user's id
     * @return the todo list containing the 'title' parameter in their title for the given user
     */
    List<Todo> searchTodoListByTitle(final long userId, final String title);

    /**
     * Update a todo.
     *
     * @param todo the todo to update
     * @return the updated todo
     */
    Todo update(Todo todo);

    /**
     * Create a new todo.
     *
     * @param todo the todo to create
     * @return the created todo
     */
    Todo create(final Todo todo);

    /**
     * Remove a todo.
     *
     * @param todo the todo to remove
     */
    void remove(final Todo todo);

}
