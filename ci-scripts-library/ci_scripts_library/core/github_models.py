from dataclasses import InitVar, dataclass, field
from typing import Any, Dict, List, Optional, Union
from github import Github
from github.Issue import Issue as GithubIssue
from mashumaro.mixins.json import DataClassJSONMixin

@dataclass
class IssueMetadata(Dict):
    key: str
    value: Any

    def __getitem__(self, item):
        return getattr(self, item)

@dataclass
class IssueAndMetadata(DataClassJSONMixin):
    issue_number: int
    issue_repo_full_name: str
    issue: Any
    issue_metadata: List[IssueMetadata]

    def __getitem__(self, item):
        return getattr(self, item)
