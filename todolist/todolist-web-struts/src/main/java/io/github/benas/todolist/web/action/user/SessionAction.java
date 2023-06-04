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

import com.opensymphony.xwork2.Action;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import io.github.benas.todolist.web.action.BaseAction;
import io.github.benas.todolist.web.common.form.LoginForm;
import io.github.benas.todolist.web.common.util.TodoListUtils;
import io.github.todolist.core.domain.User;

/**
 * Action class that controls login/logout process.
 *
 * @author Mahmoud Ben Hassine (mahmoud.benhassine@icloud.com)
 */
public class SessionAction extends BaseAction {

    private static final Logger LOGGER = LogManager.getLogger(SessionAction.class.getName());

    private LoginForm loginForm;

    private String error;

    /**
     * ******
     * Login
     * *******
     */

    public String login() {
        return Action.SUCCESS;
    }

    public String doLogin() {
        if (userService.login(loginForm.getEmail(), loginForm.getPassword())) {
            User user = userService.getUserByEmail(loginForm.getEmail());
            session.put(TodoListUtils.SESSION_USER, user);
            return Action.SUCCESS;
        } else {
            LOGGER.error("Login failed for email: " + loginForm.getEmail());
            error = getText("login.error.global.invalid");
            return Action.INPUT;
        }
    }

    /**
     * ******
     * Logout
     * *******
     */

    public String doLogout() {
        if (session instanceof org.apache.struts2.dispatcher.SessionMap) {
            try {
                ((org.apache.struts2.dispatcher.SessionMap) session).invalidate();
            } catch (IllegalStateException e) {
                LOGGER.error("Unable to invalidate session.", e);
            }
        }
        return Action.SUCCESS;
    }

    /*
     * Getters and setters for model attributes
     */

    public LoginForm getLoginForm() {
        return loginForm;
    }

    public void setLoginForm(LoginForm loginForm) {
        this.loginForm = loginForm;
    }

    public String getLoginTabStyle() {
        return "active";
    }

    public String getError() {
        return error;
    }

}
