import time
from attr import attributes
import typer
import sys
import re
import json

sys.path.append("../../ci_scripts_library")

from ci_scripts_library.core.github import GithubWithIssueMetadata as GitHub
from ci_scripts_library.core.utils import *
from ci_scripts_library.core import SuperSnykClient

app = typer.Typer(add_completion=False)

# globals
METADATA_PREFIX = "snyk_scm_issues_to_gh_issues"
METADATA_KEY_ID = "id"
g = {}

@app.callback()
def main(ctx: typer.Context,
    github_token: str = typer.Option(
        None,
        envvar="GITHUB_TOKEN",
        help="GitHub access token, if not set here will load from ENV VAR GITHUB_TOKEN"
    ),
    snyk_token: str = typer.Option(
        None,
        envvar="SNYK_TOKEN",
        help="Please specify your Snyk token. https://docs.snyk.io/tutorials/amazon-web-services/aws-code-suite/snyk-security/create-account-and-obtain-a-token"
    ),
    remote_repo_url: str = typer.Option(
        None,
        envvar="REMOTE_REPO_URL",
        help="full name of the github repo e.g. owner/repo"
    ),
    snyk_prefix: str = typer.Option(
        "",
        envvar="SNYK_PREFIX",
        help="Prefix for Snyk organization"
    )
):
    g['github_token'] = github_token
    g['snyk_token'] = snyk_token
    g['remote_repo_url'] = remote_repo_url
    g['snyk_prefix']= snyk_prefix

    g['github_client'] = GitHub(g['github_token'])
    typer.echo(f"Github client created successfully: {g['github_client']}")

    g['snyk_client'] = SuperSnykClient(g['snyk_token'])
    typer.echo(f"Snyk client created successfully: {g['snyk_client']}")

    g['github_org'] = get_github_org_name(remote_repo_url)

    g['snyk_org'] = find_snyk_org_from_github_org(g['snyk_client'], g['github_org'], g['snyk_prefix'])

    if not g['snyk_org']:
        sys.exit(f"Can not find GitHub organization in Snyk.  Check Snyk to make sure {g['github_org']} is the current Snyk organization slug.")

    g['repo_full_name'] = get_repo_full_name_from_repo_url(remote_repo_url)

    g['github_org'] = get_github_org_name(remote_repo_url)

    g['github_repo'] = get_github_repo_name(remote_repo_url)

    g['repo_open_issues'] = g['github_client'].get_repo_issues_and_metadata(g['repo_full_name'], METADATA_PREFIX)

    g['snyk_open_projects_with_issues'] = get_snyk_open_project_issues(g['snyk_client'], g['snyk_org'], g['repo_full_name'])

    return

@app.command()
def create_new_issues():
    # Sleep for 60 seconds to wait for completion of Snyk GitHub integration to scan
    print("Sleeping for a minute while Snyk Scan runs")
    time.sleep(5)

    """
    Create Github Issues from the detected Snyk Issues
    """
    github_client = g['github_client']
    projects_with_issues = g['snyk_open_projects_with_issues']

    # This is the GitHub repo full name
    
    gh_repo_full_name = (g['repo_full_name'])

    typer.echo(f"Starting issues creation")

    for project_with_issues in projects_with_issues:
        issues = project_with_issues.issues.json()['issues']

        for issue in issues:
            snyk_unique_issue_id = issue['id']
            snyk_title = issue['issueData']['title']
            snyk_severity = issue['issueData']['severity']
            snyk_description = issue['issueData']['description']
            snyk_package_name = issue['pkgName']
            snyk_package_version = issue['pkgVersions']

            try:
                snyk_cve = issue['issueData']['identifiers']['CVE'][0]
            except:
                snyk_cve = "No CVE"
                typer.echo("Issue does not have a CVE")

            try:
                snyk_cwe = "No CWE"
                snyk_cwe = issue['issueData']['identifiers']['CWE'][0]

            except:
                typer.echo("Issue does not have a CWE")

            snyk_issue_id = f"{issue.packageName}/{snyk_unique_issue_id}"
            typer.echo(f"{snyk_issue_id=}")

            title = f"{snyk_cve} - {snyk_severity} detected in {snyk_package_name}"
            #labels = "Secerity Vulnerability"
            body = (
                f"Package Name: {snyk_package_name} <br/>"
                f"Package Version: {snyk_package_version} <br/>"
                f"Package Manager: {issue.projectType} <br/>"
                f"Target File: {issue.packageName} <br/>"
                f"Severity Level: {snyk_severity} <br/> "
                f"Snyk ID: {snyk_unique_issue_id} <br/> "
                f"Snyk CVE: {snyk_cve} <br/> "
                f"Snyk CWE: {snyk_cwe} <br/> "
                f"Link to issue in Snyk: {issue.projectBrowseUrl} <br/> <br/>"
                f"Snyk Description: {snyk_description} <br/> "
            )

            gh_issue_exists = snyk_issue_id in \
                [x.issue_metadata['id'] for x in g['repo_open_issues'] if x.issue_metadata is not None]

            if gh_issue_exists:
                print(f"already exists (skipping issue)")
                pass
            else:
                print(f"does not exists (creating new issue)")
                github_client.create_issue_with_metadata(
                repo_full_name=gh_repo_full_name,
                metadata_prefix=METADATA_PREFIX,
                metadata_key=METADATA_KEY_ID,
                metadata_value=snyk_issue_id,
                title=title,
                body=body,
                #labels=labels
                )
                time.sleep(2)

@app.command()
def close_fixed_issues():
    """
    Close Github Issues when matching snyk Issue is no longer found
    """
    typer.echo("Checking for fixed Github Issues to close...")
    github_client = g['github_client']
    project_with_issues = g['snyk_open_project_issues']
    open_issues = g['repo_open_issues']
    snyk_issue_ids = create_github_issue_key_list(project_with_issues)

    for issue in open_issues:
        snyk_issue_exists: bool = False
        for snyk_issue_id in snyk_issue_ids:
            snyk_issue_exists = (
                issue.issue_metadata[METADATA_KEY_ID] == snyk_issue_id
            )
            if snyk_issue_exists:
                break
        
        if not snyk_issue_exists:
            # close the github issue
            print(f"Closing issue...{issue.issue_metadata[METADATA_KEY_ID]}")
            issue.issue.edit(state="closed")
            time.sleep(2)    


@app.command()
def sync_issues():
    close_fixed_issues()
    create_new_issues()

if __name__ == "__main__":
    app()
