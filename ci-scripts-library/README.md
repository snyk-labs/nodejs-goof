# ci-scripts-library

Utility scripts to be used from CI workflows that provide additional functionality.

These scripts are packaged into a [container image](https://github.com/snyk-labs/ci-scripts-library/pkgs/container/ci-scripts) for ease of use in pulling into existing flows.

This project is structured such that common modules can be imported from `core` and each utility script is setup as `<script_name>/cli.py`, for example:

```
.
├── README.md
├── ci_scripts_library
│   ├── __init__.py
│   ├── core
│   │   ├── __init__.py
│   │   ├── github.py
│   │   ├── github_models.py
│   │   ├── snyk_client.py
│   │   └── utils.py
│   ├── snyk_sarif_to_gh_issues
│   │   └── cli.py
│   └── tests
│       └── fixtures
│           └── snyk.sarif
├── poetry.lock
├── pyproject.toml
└── requirements.txt
```

When running the container image directly, the first argument to the entrypoint script is the <script_name> and the remaining arguments are passed to <script_name>/cli.py.  For example:

```
docker run -it --rm ci-scripts:latest snyk_sarif_to_gh_issues --snyk-sarif-file=ci_scripts_library/test
s/fixtures/snyk.sarif --repo-name=scotte-snyk/appengine-test-renamed create-new-issues
```

This project uses [typer](https://typer.tiangolo.com/) for CLI interactions

This project's dependencies are managed with [Poetry](https://python-poetry.org/), but we also provide a `requirements.txt` file for convenience.
