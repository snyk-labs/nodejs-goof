import typer
import os
import sys

from ci_scripts_library.core.github import GithubWithIssueMetadata as Github
from ci_scripts_library.core.utils import (
    load_json_file,
    construct_vulndb_url
)

app = typer.Typer(add_completion=False)

# globals
METADATA_PREFIX = "snyk_sarif_to_gh_issues"
METADATA_KEY_ID = "id"
g = {}

@app.callback()
def main(ctx: typer.Context,
    github_token: str = typer.Option(
        None,
        envvar="GITHUB_TOKEN",
        help="GitHub access token, if not set here will load from ENV VAR GITHUB_TOKEN"
    ),
    snyk_sarif_file: str = typer.Option(
        "snyk.sarif",
        envvar="SNYK_SARIF_FILE",
        help="Path to Snyk CLI sarif output file"
    ),
   repo_name: str = typer.Option(
        None,
        envvar="REPO",
        help="full name of the github repo e.g. owner/repo"
    )
):
    """" 
    entrypoint for application
    """
    g['github_token'] = github_token
    g['snyk_sarif_file'] = snyk_sarif_file
    g['repo_name'] = repo_name

    g['gh_client'] = Github(g['github_token'])
    typer.echo(f"Github client created: {g['gh_client']}")

    g['snyk_sarif'] = load_json_file(g['snyk_sarif_file'])
    typer.echo(f"Snyk SARIF file loaded")

    # load rules from sarif
    g['rules'] = g['snyk_sarif']['runs'][0]['tool']['driver']['rules']
    g['results'] = g['snyk_sarif']['runs'][0]['results']
    typer.echo(f"{len(g['results'])} Snyk Issues found")

    g['repo_open_issues'] = g['gh_client'].get_repo_issues_and_metadata(g['repo_name'], METADATA_PREFIX)
    typer.echo(f"{len(g['repo_open_issues'])} Open GH Issues retrieved")

    return

@app.command()
def create_new_issues():
    """
    Create Github Issues from the detected Snyk Issues
    """
    typer.echo("Checking for new Github Issues to create...")
    gh_client: Github = g['gh_client']
    rules = g['rules']
    results = g['results']

    for result in results:
        gh_issue_exists: bool = False
        # print(result)
        locationUri = result['locations'][0]['physicalLocation']['artifactLocation']['uri']
        rule_id = result['ruleId']

        print(f"{locationUri}, {rule_id}, ", end="")

        # for each single issue find the rule text to create the issue
        matching_rule = [x for x in rules if x['id'] == rule_id].pop()

        snyk_issue_id = f"{locationUri}/{rule_id}"

        title = f"{matching_rule['shortDescription']['text']} ({locationUri})"
        body = (
            f"{matching_rule['help']['markdown']} <br/> "
            f"[{rule_id}]({construct_vulndb_url(rule_id)}) <br/> "
            f"{matching_rule['fullDescription']['text']}"
        )

        gh_issue_exists = snyk_issue_id in \
            [x.issue_metadata['id'] for x in g['repo_open_issues'] if x.issue_metadata is not None]

        if gh_issue_exists:
            print(f"already exists (skipping issue)")
            pass
        else:
            print(f"does not exists (creating new issue)")
            gh_client.create_issue_with_metadata(
            repo_full_name=g['repo_name'],
            metadata_prefix=METADATA_PREFIX,
            metadata_key=METADATA_KEY_ID,
            metadata_value=snyk_issue_id,
            title=title,
            body=body
        )

@app.command()
def close_fixed_issues():
    """
    Close Github Issues when matching snyk Issue is no longer found
    """
    typer.echo("Checking for fixed Github Issues to close...")
    gh_client: Github = g['gh_client']
    rules = g['rules']
    results = g['results']

    for issue in g['repo_open_issues']:
        snyk_issue_exists: bool = False
        for result in results:
            locationUri = result['locations'][0]['physicalLocation']['artifactLocation']['uri']
            rule_id = result['ruleId']
            snyk_issue_id = f"{locationUri}/{rule_id}"
            snyk_issue_exists = (
                issue.issue_metadata and issue.issue_metadata[METADATA_KEY_ID] == snyk_issue_id
            )
            if snyk_issue_exists:
                break
        
        if not snyk_issue_exists:
            # close the github issue
            issue.issue.edit(state="closed")

@app.command()
def sync_issues():
    """
    create new issues and close fixed issues in a single command
    """
    create_new_issues()
    close_fixed_issues()

if __name__ == "__main__":
    app()
