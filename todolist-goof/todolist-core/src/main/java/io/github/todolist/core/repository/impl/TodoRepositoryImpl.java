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

package io.github.todolist.core.repository.impl;

import io.github.todolist.core.domain.Todo;
import io.github.todolist.core.repository.api.TodoRepository;
import org.apache.commons.collections.list.UnmodifiableList;
import org.springframework.stereotype.Repository;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;
import java.util.List;

/**
 * Implementation of {@link TodoRepository} using JPA.
 *
 * @author Mahmoud Ben Hassine (mahmoud.benhassine@icloud.com)
 */
@Repository
public class TodoRepositoryImpl implements TodoRepository {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * {@inheritDoc}
     */
    public Todo getTodoById(final long id) {
        return entityManager.find(Todo.class, id);
    }

    /**
     * {@inheritDoc}
     */
    public List<Todo> getTodoListByUser(final long userId) {
        TypedQuery<Todo> query = entityManager.createNamedQuery("findTodosByUser", Todo.class);
        query.setParameter(1, userId);
        return UnmodifiableList.decorate(query.getResultList());
    }

    /**
     * {@inheritDoc}
     */
    public List<Todo> getTodoListByUserAndTitle(final long userId, final String title) {
        TypedQuery<Todo> query = entityManager.createNamedQuery("findTodosByTitle", Todo.class);
        query.setParameter(1, userId);
        query.setParameter(2, "%" + title.toUpperCase() + "%");
        return UnmodifiableList.decorate(query.getResultList());
    }

    /**
     * {@inheritDoc}
     */
    public Todo update(Todo todo) {
        return entityManager.merge(todo);
    }

    /**
     * {@inheritDoc}
     */
    public Todo create(final Todo todo) {
        entityManager.persist(todo);
        return todo;
    }

    /**
     * {@inheritDoc}
     */
    public void remove(final Todo todo) {
        Todo t = entityManager.find(Todo.class, todo.getId());
        entityManager.remove(t);
    }

}
