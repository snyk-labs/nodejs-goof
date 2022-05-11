# create and return a pysnyk client given a token
from attr import Attribute
from snyk import SnykClient
from ci_scripts_library.core import SuperSnykClient

USER_AGENT_STRING = "pysnyk/snyk-labs/ci-scripts/"

def get(snyk_token: str):
    return SnykClient(str(snyk_token), user_agent=USER_AGENT_STRING, tries=3, delay=1)

def get_v3(snyk_token: str, version="2022-02-16~experimental"):
    return SnykClient(
        str(snyk_token),
        version=version,
        url="https://api.snyk.io/rest",
        user_agent=USER_AGENT_STRING,
        tries=2,
        delay=3,
    )

# Return list of organizations for Snyk token
def get_snyk_orgs(snyk_client:SnykClient):
    return snyk_client.get_rest_pages("/orgs", {"limit": 100})

# Return snyk organizations that match Github Organizations
def get_snyk_org(snyk_client:SnykClient, github_org_name: str):
    snyk_orgs = get_snyk_orgs(snyk_client)
    return [x for x in snyk_orgs if github_org_name == x['attributes']['slug']][0]

# Return list of Snyk projects for a Snyk organization        
def get_snyk_org_projects(snyk_client:SnykClient, snyk_orgid: str):
    return snyk_client.get_rest_pages(f"/orgs/{snyk_orgid}/projects", {"limit": 100})

def search_for_matching_repo(snyk_client:SnykClient, snyk_orgid: str, repo_name:str):
    project_list = get_snyk_org_projects(snyk_client, snyk_orgid)
    return [x for x in project_list if repo_name == x['attributes']['name']][0]
