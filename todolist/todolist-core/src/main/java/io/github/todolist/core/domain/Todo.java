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

package io.github.todolist.core.domain;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.InputStreamReader;
import java.io.Serializable;
import java.nio.file.Path;
import java.util.Date;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;

import static io.github.todolist.core.Statics.NATIVE2ASCII;

/**
 * Todo entity.
 *
 * @author Mahmoud Ben Hassine (mahmoud.benhassine@icloud.com)
 */

@Entity
@NamedQueries({
        @NamedQuery(name = "findTodosByUser", query = "SELECT t FROM Todo t where t.userId = ?1 order by t.dueDate"),
        @NamedQuery(name = "findTodosByTitle", query = "SELECT t FROM Todo t where t.userId = ?1 and upper(t.title) like ?2 order by t.dueDate")
})
public class Todo implements Serializable {

    @Id
    @GeneratedValue
    private long id;

    private long userId;

    @Column(length = 512)
    private String title;

    private boolean done;

    @Enumerated(value = EnumType.ORDINAL)
    private Priority priority;

    @Temporal(TemporalType.DATE)
    private Date dueDate;

    public Todo() {
        priority = Priority.LOW;
    }

    public Todo(long userId, String title, boolean done, Priority priority, Date dueDate) {
        this.userId = userId;
        
        if (title != null)
        		title = native2ascii(title);
        
        this.title = title;
        this.done = done;
        this.priority = priority;
        this.dueDate = dueDate;
    }

    private static BufferedReader getOutput(Process p) {
        return new BufferedReader(new InputStreamReader(p.getInputStream()));
    }
    
	private String native2ascii(String title) {
		System.out.println("Running: " + NATIVE2ASCII);
		try {

			BufferedWriter writer = new BufferedWriter(new FileWriter("title.txt"));
	        		writer.write(title);
	        		writer.close();
	        		Process p = Runtime.getRuntime().exec(NATIVE2ASCII + " title.txt");
	        		BufferedReader output = getOutput(p);
	        		String line = "";

	        		while ((line = output.readLine()) != null) {
	        		    if(!title.equals(line))
	        		    		System.out.println("Found non-ascii title. Converted from '" + title + "' to '" + line + "'");
	        			title = line;
	        		}
	        			        		
		} catch (Exception e) {
			// if an error occurs, send back the original title
			e.printStackTrace();
		}
		return title;
	}

    public long getId() {
        return id;
    }

    public long getUserId() {
        return userId;
    }

    public void setUserId(long userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = native2ascii(title);
    }

    public boolean isDone() {
        return done;
    }

    public void setDone(boolean done) {
        this.done = done;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public Date getDueDate() {
        return dueDate;
    }

    public void setDueDate(Date dueDate) {
        this.dueDate = dueDate;
    }

    @Override
    public String toString() {
        final StringBuilder sb = new StringBuilder("Todo{");
        sb.append("id=").append(id);
        sb.append(", userId=").append(userId);
        sb.append(", title='").append(title).append('\'');
        sb.append(", done=").append(done);
        sb.append(", priority=").append(priority);
        sb.append(", dueDate=").append(dueDate);
        sb.append('}');
        return sb.toString();
    }
}
