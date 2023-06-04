package io.github.todolist.core;

import java.io.File;

public class Statics {

    public static final String JAVA_HOME = System.getenv("JAVA_HOME");
    public static final String NATIVE2ASCII = (JAVA_HOME != null ? JAVA_HOME : "./.jdk") + File.separator + "bin" + File.separator + "native2ascii";
}
