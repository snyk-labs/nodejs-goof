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

package io.github.todolist.core.service.impl;

import io.github.todolist.core.domain.Todo;
import io.github.todolist.core.repository.api.TodoRepository;
import io.github.todolist.core.service.api.TodoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implementation of the {@link TodoService}.
 *
 * @author Mahmoud Ben Hassine (mahmoud.benhassine@icloud.com)
 */
@Service
@Transactional(readOnly = true)
public class TodoServiceImpl implements TodoService {

    @Autowired
    private TodoRepository todoRepository;

    /**
     * {@inheritDoc}
     */
    public Todo getTodoById(final long id) {
        return todoRepository.getTodoById(id);
    }

    /**
     * {@inheritDoc}
     */
    public List<Todo> getTodoListByUser(final long userId) {
        return todoRepository.getTodoListByUser(userId);
    }

    /**
     * {@inheritDoc}
     */
    public List<Todo> searchTodoListByTitle(final long userId, final String title) {
        return todoRepository.getTodoListByUserAndTitle(userId, title);
    }

    /**
     * {@inheritDoc}
     */
    @Transactional
    public Todo update(Todo todo) {
        return todoRepository.update(todo);
    }

    /**
     * {@inheritDoc}
     */
    @Transactional
    public Todo create(final Todo todo) {
        return todoRepository.create(todo);
    }

    /**
     * {@inheritDoc}
     */
    @Transactional
    public void remove(final Todo todo) {
        todoRepository.remove(todo);
    }
}
