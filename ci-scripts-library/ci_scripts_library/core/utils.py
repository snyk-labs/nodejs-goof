# utilities
import json
import re
from typing import Dict, List
from ci_scripts_library.core import SuperSnykClient
from ci_scripts_library.core.snyk_models import ProjectIssues
#from pprintpp import pprint as pp

def load_json_file(json_file_path: str) -> Dict:
    """ return a JSON object as dictionary"""
    f = open(json_file_path)
    data = json.load(f)
    f.close()

    return data

def construct_vulndb_url(snyk_vuln_id: str) -> str:
    """ return a link to snyk's vulndb entry for given vuln ID"""
    return f"https://security.snyk.io/vuln/{snyk_vuln_id}"

#Parse out GitHub repo full name.  For example in this repo URL https://github.com/snyk-labs/java-goof it would be snyk-labs/java-goof
def get_repo_full_name_from_repo_url(repo_url:str) -> str:
    match = re.search('.+://.+/(.+/.+)\.git', repo_url)
    if match:
        return match.group(1)
    else:
        print(f"Failed to match GitHub full repo name.  Repo name is the follow: {repo_url} Please check that the repo name is valid like the following: https://github.com/snyk-labs/nodejs-goof.git")

# Parse GitHub organization name from GitHub repo full name 
def get_github_org_name(repo_url:str) -> str:
    try:
        repo_full_name = get_repo_full_name_from_repo_url(repo_url)
        github_org = repo_full_name.split("/")
        return github_org[0]
    except:
        print(f"The following remote repo: {repo_url} is invalid")       

# Parse GitHub repo name from GitHub repo full name 
def get_github_repo_name(repo_url:str) -> str:
    try:
        repo_full_name = get_repo_full_name_from_repo_url(repo_url)
        github_repo = repo_full_name.split("/")
        return github_repo[1]
    except:
        print(f"The following remote repo: {repo_url} is invalid")
    

# Return snyk organizations that match Github Organizations with Snyk rest api
def find_snyk_org_from_github_org(snyk_client:SuperSnykClient, github_org_name: str, snyk_prefix: str):
    snyk_org_slug = github_org_name
    snyk_orgs = snyk_client.organizations.all()

    if snyk_prefix:
        snyk_org_slug = f"{snyk_prefix}_{github_org_name}"
    
    snyk_org = [x for x in snyk_orgs if f"{snyk_org_slug}" == x.attributes['slug']]
    if len(snyk_org) > 0:
        return snyk_org[0]
    else:
        return None

# Return snyk organizations that match Github Organizations with Snyk rest api CLEAN UP
def find_github_repo_in_snyk(github_repo_name: str, snyk_projects):
    return [x for x in snyk_projects if github_repo_name == x.attributes.name]

def create_github_issue_key_list(snyk_issues):
    snyk_issue_ids = []
    for snyk_issues in snyk_issues:
            snyk_issue=snyk_issues.issues
            snyk_issues_json=snyk_issue.json()
            issues = snyk_issues_json['issues']
            for values in issues:
                snyk_unique_issue_id = values['id']
                snyk_issue_id = f"{snyk_issues.packageName}/{snyk_unique_issue_id}/{snyk_issues.projectId}"
                snyk_issue_ids.append(snyk_issue_id)
    
    return snyk_issue_ids


def get_snyk_open_project_issues(snyk_client:SuperSnykClient, snyk_org, gh_repo_full_name) -> List[ProjectIssues]:
    package_manager_names = ["npm", "yarn", "pip", "maven", "gradle", "sbt", "rubygems", "nuget", "gomodules", "govendor", "dep", "cocopods", "composer"] 
    results = list()

    values = { "includeDescription": True, "filters":  { "types": ["vuln"], "ignored": False }  }
    
    #snyk_org = find_snyk_org_from_github_org(snyk_client, gh_org, snyk_prefix)

    snyk_targets = snyk_org.targets.all()

    target = [x for x in snyk_targets if x.attributes.displayName == gh_repo_full_name][0]

    projects = snyk_client.v3_client.get_v3_pages(f"/orgs/{snyk_org.id}/projects", {"limit": 100, "targetId": target.id})

    for project in projects:
        if project['attributes']['type'] in package_manager_names:
            #issue_set = snyk_client.v1_client.organizations.get(f"{org_id}").projects.get(project['id']).issueset_aggregated.all()
            aggregated_issues = snyk_client.v1_client.post(f"/org/{snyk_org.id}/project/{project['id']}/aggregated-issues", body=values)

            snyk_browser_url = f"https://app.snyk.io/org/{snyk_org.attributes['slug']}/project/{project['id']}"
            package_name = project['attributes']['name'].split(":")[1]
            results.append(ProjectIssues(
                projectId= project['id'], 
                projectName = project['attributes']['name'], 
                projectBrowseUrl = snyk_browser_url,
                packageName = package_name,
                projectType = project['attributes']['type'],
                issues = aggregated_issues))

    return results

