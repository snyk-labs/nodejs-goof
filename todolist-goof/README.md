## Todolist Goof

A vulnerable demo application, initially based on [Ben Hassine](https://github.com/benas/)'s [TodoMVC](https://github.com/benas/todolist-mvc). 

The goal of this application is to demonstrate through example how to find, exploit and fix vulnerable Maven packages. 

This repo is still incomplete, a work in progress to support related presentations.


## Build and run Todolist MVC

(from the original README)

### Local build and run

*Note that to run locally, you need JDK 8.*

1.  Check out the project source code from github : `git clone https://github.com/snyk/java-goof.git`
2.  Open a terminal and run the following command from root directory : `mvn install`
3.  Choose a web framework to test and run it. For example : `cd todolist-web-struts && mvn tomcat7:run` (note: this example currently only copied the Struts demo)
4.  Browse the following URL : `localhost:8080/`
5.  You can register a new account or login using the following credentials : foo@bar.org / foobar

### Build and run with docker-compose

*Note, we run build on and a Tomcat 8.5 image here to support tomcat-rce base image demo.*
```bash
docker-compose up --build
docker-compose down
```

## Deploy Application on Heroku

- [Heroku instructions](DEPLOY_HEROKU.md)

## Open source vulnerability exploit

TODO

## Container base image vulnerability exploit

- [Container base image exploit instructions](exploits/tomcat-rce/README.md)

## Log4Shell exploits 

- [Log4Shell exploits explained](exploits/log4shell/README.md)

## License
This repo is available released under the [MIT License](http://opensource.org/licenses/mit-license.php/).
# java-goof
