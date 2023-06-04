FROM maven:3-jdk-8-slim as build

RUN mkdir /usr/src/goof
WORKDIR /usr/src/goof

COPY pom.xml pom.xml
COPY src src
COPY todolist-core todolist-core
COPY todolist-web-common todolist-web-common
COPY todolist-web-struts todolist-web-struts
RUN --mount=target=$HOME/.m2,type=cache mvn install

FROM tomcat:8.5.21

RUN mkdir /tmp/extracted_files
COPY web.xml /usr/local/tomcat/conf/web.xml
COPY --from=build /usr/src/goof/todolist-web-struts/target/todolist /usr/local/tomcat/webapps/todolist
COPY --from=build /usr/local/openjdk-8/bin/native2ascii /docker-java-home/jre/bin/native2ascii
COPY --from=build /usr/local/openjdk-8/lib/tools.jar /docker-java-home/jre/lib/tools.jar






#Uncomment the next line for log4shell vulnerability if using base tomcat image > 8.5.33
#ENV JAVA_OPTS="-Dcom.sun.jndi.ldap.object.trustURLCodebase=true"
