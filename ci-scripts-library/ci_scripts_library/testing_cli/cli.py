import typer
import os
import sys
from typing import Dict
from uuid import UUID

from ci_scripts_library.core import github_client
from ci_scripts_library.core.utils import (
    load_json_file,
    construct_vulndb_url
)
from ci_scripts_library.core import SuperSnykClient

app = typer.Typer(add_completion=False)

# globals
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
        help="GitHub access token, if not set here will load from ENV VAR GITHUB_TOKEN"
    )
):
    g['snyk_token'] = snyk_token

    g['snyk_client'] = SuperSnykClient(g['snyk_token'])
    typer.echo("super snyk client created successfully")

    return

@app.command()
def test():
    """
    Test the client
    """

    #print(f"orgs.all: {g['snyk_client'].organizations.all()}")
    #for org in g['snyk_client'].organizations.all():
    #    print(org)

    org = g['snyk_client'].organizations.first()
    typer.echo(f"first org: {org}")

    org = g['snyk_client'].organizations.filter(id=UUID('fdf3b63a-9a4e-43d8-bae3-85212f002bea')).pop()
    typer.echo(f"org by id: {org}")

   # org_projects = org.projects.all()
    #typer.echo(f"org_projects: {org_projects}")
    #the following should work, but it looks like the get project API is broken so we get a 404
    project = org.projects.get(id=UUID("023a5182-56af-4da4-929b-55d08c393e4d"))
    typer.echo(f"project: {project}")

if __name__ == "__main__":
    app()
