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
import com.opensymphony.xwork2.ActionSupport;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import io.github.benas.todolist.web.action.BaseAction;
import io.github.benas.todolist.web.common.form.ChangePasswordForm;
import io.github.benas.todolist.web.common.form.RegistrationForm;
import io.github.benas.todolist.web.common.util.TodoListUtils;
import io.github.todolist.core.domain.User;

import javax.validation.ConstraintViolation;
import java.text.MessageFormat;
import java.util.Set;

/**
 * Action class for Account CRUD operations.
 *
 * @author Mahmoud Ben Hassine (mahmoud.benhassine@icloud.com)
 */
public class AccountAction extends BaseAction {

    private static final Logger LOGGER = LogManager.getLogger(AccountAction.class.getName());

    private ChangePasswordForm changePasswordForm;

    private RegistrationForm registrationForm;

    private User user;

    private String updateProfileSuccessMessage, updatePasswordSuccessMessage;

    private String error, errorName, errorEmail, errorPassword, errorNewPassword,
            errorCurrentPassword, errorConfirmationPassword, errorConfirmationPasswordMatching;

    /**
     * **************
     * Account details
     * ***************
     */

    public String account() {
        user = getSessionUser();
        return Action.SUCCESS;
    }

    /**
     * *******************
     * Register new account
     * *******************
     */

    public String register() {
        return Action.SUCCESS;
    }

    public String doRegister() {

        validateRegistrationForm();

        if (error != null) {
            return ActionSupport.INPUT;
        }

        if (isAlreadyUsed(registrationForm.getEmail())) {
            error = MessageFormat.format(getText("register.error.global.account"), registrationForm.getEmail());
            return ActionSupport.INPUT;
        }

        User user = new User(registrationForm.getName(), registrationForm.getEmail(), registrationForm.getPassword());
        user = userService.create(user);
        session.put(TodoListUtils.SESSION_USER, user);
        return Action.SUCCESS;
    }

    private boolean isAlreadyUsed(String email) {
        return userService.getUserByEmail(email) != null;
    }

    private void validateRegistrationForm() {
        validateName();

        validateEmail();

        validatePassword();

        validateConfirmationPassword();

        checkPasswordsMatch();
    }

    private void checkPasswordsMatch() {
        if (confirmationPasswordDoesNotMatchPassword()) {
            errorConfirmationPasswordMatching = getText("register.error.password.confirmation.error");
            error = getText("register.error.global");
        }
    }

    private boolean confirmationPasswordDoesNotMatchPassword() {
        return !registrationForm.getConfirmationPassword().equals(registrationForm.getPassword());
    }

    private void validateConfirmationPassword() {
        Set<ConstraintViolation<RegistrationForm>> constraintViolations = validator.validateProperty(registrationForm, "confirmationPassword");
        if (!constraintViolations.isEmpty()) {
            errorConfirmationPassword = constraintViolations.iterator().next().getMessage();
            error = getText("register.error.global");
        }
    }

    private void validatePassword() {
        Set<ConstraintViolation<RegistrationForm>> constraintViolations = validator.validateProperty(registrationForm, "password");
        if (!constraintViolations.isEmpty()) {
            errorPassword = constraintViolations.iterator().next().getMessage();
            error = getText("register.error.global");
        }
    }

    private void validateEmail() {
        Set<ConstraintViolation<RegistrationForm>> constraintViolations = validator.validateProperty(registrationForm, "email");
        if (!constraintViolations.isEmpty()) {
            errorEmail = constraintViolations.iterator().next().getMessage();
            error = getText("register.error.global");
        }
    }

    private void validateName() {
        Set<ConstraintViolation<RegistrationForm>> constraintViolations = validator.validateProperty(registrationForm, "name");
        if (!constraintViolations.isEmpty()) {
            errorName = constraintViolations.iterator().next().getMessage();
            error = getText("register.error.global");
        }
    }

    /**
     * *******************
     * Update account
     * *******************
     */

    public String doUpdate() {
        User user = getSessionUser();

        String email = this.user.getEmail();

        if (isAlreadyUsed(email) && isDifferent(user.getEmail())) {
            error = MessageFormat.format(getText("account.email.alreadyUsed"), email);
            return Action.INPUT;
        }

        user.setName(this.user.getName());
        user.setEmail(email);
        userService.update(user);
        session.put(TodoListUtils.SESSION_USER, user);
        updateProfileSuccessMessage = getText("account.profile.update.success");
        return Action.SUCCESS;

    }

    private boolean isDifferent(String email) {
        return !this.user.getEmail().equals(email);
    }

    /**
     * *******************
     * Delete account
     * *******************
     */

    public String doDelete() {
        User user = getSessionUser();
        userService.remove(user);

        invalidateSession();
        return Action.SUCCESS;
    }

    private void invalidateSession() {
        session.put(TodoListUtils.SESSION_USER, null);
        if (session instanceof org.apache.struts2.dispatcher.SessionMap) {
            try {
                ((org.apache.struts2.dispatcher.SessionMap) session).invalidate();
            } catch (IllegalStateException e) {
                LOGGER.error("Unable to invalidate session.", e);
            }
        }
    }

    /**
     * *******************
     * Change password
     * *******************
     */

    public String doChangePassword() {

        validateChangePasswordForm();

        if (error != null) {
            return Action.INPUT;
        }

        User user = getSessionUser();
        if (incorrectCurrentPassword(user)) {
            errorCurrentPassword = getText("account.password.error");
            error = getText("account.password.error.global");
            return Action.INPUT;
        }

        if (newPasswordDoesNotMatchConfirmationPassword()) {
            errorConfirmationPassword = getText("account.password.confirmation.error");
            error = getText("account.password.error.global");
            return Action.INPUT;
        }

        user.setPassword(changePasswordForm.getNewPassword());
        user = userService.update(user);
        session.put(TodoListUtils.SESSION_USER, user);
        this.user = user;
        updatePasswordSuccessMessage = getText("account.password.update.success");
        return Action.SUCCESS;
    }

    private boolean newPasswordDoesNotMatchConfirmationPassword() {
        return !changePasswordForm.getNewPassword().equals(changePasswordForm.getConfirmationPassword());
    }

    private boolean incorrectCurrentPassword(User user) {
        return !changePasswordForm.getCurrentPassword().equals(user.getPassword());
    }

    private void validateChangePasswordForm() {
        validateCurrentPassword();

        validateNewPassword();

        validateConfirmPassword();
    }

    private void validateConfirmPassword() {
        Set<ConstraintViolation<ChangePasswordForm>> constraintViolations;
        constraintViolations = validator.validateProperty(changePasswordForm, "confirmationPassword");
        if (!constraintViolations.isEmpty()) {
            errorConfirmationPassword = constraintViolations.iterator().next().getMessage();
            error = getText("account.password.error.global");
        }
    }

    private void validateNewPassword() {
        Set<ConstraintViolation<ChangePasswordForm>> constraintViolations;
        constraintViolations = validator.validateProperty(changePasswordForm, "newPassword");
        if (!constraintViolations.isEmpty()) {
            errorNewPassword = constraintViolations.iterator().next().getMessage();
            error = getText("account.password.error.global");
        }
    }

    private void validateCurrentPassword() {
        Set<ConstraintViolation<ChangePasswordForm>> constraintViolations;
        constraintViolations = validator.validateProperty(changePasswordForm, "currentPassword");
        if (!constraintViolations.isEmpty()) {
            errorCurrentPassword = constraintViolations.iterator().next().getMessage();
            error = getText("account.password.error.global");
        }
    }

    /**
     * ***************************
     * Getters for model attributes
     * ****************************
     */

    public String getRegisterTabStyle() {
        return "active";
    }

    public ChangePasswordForm getChangePasswordForm() {
        return changePasswordForm;
    }

    public RegistrationForm getRegistrationForm() {
        return registrationForm;
    }

    public User getUser() {
        return user;
    }

    public String getError() {
        return error;
    }

    public String getErrorName() {
        return errorName;
    }

    public String getErrorEmail() {
        return errorEmail;
    }

    public String getErrorPassword() {
        return errorPassword;
    }

    public String getErrorNewPassword() {
        return errorNewPassword;
    }

    public String getErrorConfirmationPassword() {
        return errorConfirmationPassword;
    }

    public String getErrorConfirmationPasswordMatching() {
        return errorConfirmationPasswordMatching;
    }

    public String getUpdateProfileSuccessMessage() {
        return updateProfileSuccessMessage;
    }

    public String getUpdatePasswordSuccessMessage() {
        return updatePasswordSuccessMessage;
    }

    public String getErrorCurrentPassword() {
        return errorCurrentPassword;
    }

    /**
     * *************************************
     * Setters for request parameters binding
     * **************************************
     */

    public void setChangePasswordForm(ChangePasswordForm changePasswordForm) {
        this.changePasswordForm = changePasswordForm;
    }

    public void setRegistrationForm(RegistrationForm registrationForm) {
        this.registrationForm = registrationForm;
    }

    public void setUser(User user) {
        this.user = user;
    }

}
