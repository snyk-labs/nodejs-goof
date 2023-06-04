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

import io.github.todolist.core.domain.User;
import io.github.todolist.core.repository.api.UserRepository;
import org.springframework.stereotype.Repository;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;
import java.util.List;

/**
 * Implementation of {@link UserRepository} using JPA.
 *
 * @author Mahmoud Ben Hassine (mahmoud.benhassine@icloud.com)
 */
@Repository
public class UserRepositoryImpl implements UserRepository {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * {@inheritDoc}
     */
    public User create(final User user) {
        entityManager.persist(user);
        return user;
    }

    /**
     * {@inheritDoc}
     */
    public User update(User user) {
        return entityManager.merge(user);
    }

    /**
     * {@inheritDoc}
     */
    public void remove(final User user) {
        entityManager.createNativeQuery("DELETE FROM todo t WHERE t.userId = " + user.getId()).executeUpdate();
        User u = entityManager.find(User.class, user.getId());
        entityManager.remove(u);
    }

    /**
     * {@inheritDoc}
     */
    public User getUserByEmail(final String email) {
        TypedQuery<User> query = entityManager.createNamedQuery("findUserByEmail", User.class);
        query.setParameter("p_email", email);
        List<User> users = query.getResultList();
        return (users != null && !users.isEmpty()) ? users.get(0) : null;
    }

    /**
     * {@inheritDoc}
     */
    public boolean login(final String email, final String password) {
        TypedQuery<User> query = entityManager.createNamedQuery("findUserByEmailAndPassword", User.class);
        query.setParameter("p_email", email);
        query.setParameter("p_password", password);
        List<User> users = query.getResultList();
        return (users != null && !users.isEmpty());
    }

}
