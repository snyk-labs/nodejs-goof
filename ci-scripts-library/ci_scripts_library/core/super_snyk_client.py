""" 
combined client to simplify use of both 
V1 and REST(V3) Snyk APIs.
"""

from snyk import SnykClient
from snyk.managers import Manager as V1Manager
from ci_scripts_library.core.snyk_managers import Manager as V3Manager
from ci_scripts_library.core.snyk_models import Organization, Project, Target

class SuperSnykClient(object):

    USER_AGENT_STRING = "pysnyk/snyk-labs/ci-scripts/"
    V1_API_URL = "https://snyk.io/api/v1"
    V3_API_URL = "https://api.snyk.io/rest"
    V3_VERSION = "2022-04-06~experimental"

    def __init__(
        self,
        token: str,
        user_agent: str = USER_AGENT_STRING,
        v1_url: str = V1_API_URL,
        v3_url: str = V3_API_URL,
        v3_version: str = V3_VERSION,
        tries: int = 2,
        delay: int = 3,
        backoff: int = 2
    ):
        self.api_token = token
        self.api_v1_url = v1_url
        self.api_v3_url = v3_url
        self.api_v3_version = v3_version    
        self.tries = tries
        self.delay = delay
        self.backoff = backoff
        self.v1_client = SnykClient(
            token=self.api_token, 
            user_agent=self.USER_AGENT_STRING, 
            tries=self.tries, 
            delay=self.delay,
            backoff=self.backoff
        )
        self.v3_client = SnykClient(
            token=self.api_token,
            version=self.api_v3_version,
            url=self.V3_API_URL,
            user_agent=self.USER_AGENT_STRING,
            tries=self.tries,
            delay=self.delay,
            backoff=self.backoff
        )

    def __getitem__(self, item):
        return self.__dict__[item]

    
    @property
    def organizations(self) -> V3Manager:
        return V3Manager.factory(Organization, client=self.v3_client)

    @property
    def projects(self) ->V3Manager:
        return V3Manager.factory(Project, client=self.v3_client)

    @property
    def targets(self) -> V3Manager:
        return V3Manager.factory(Target, client=self.v3_client)
        