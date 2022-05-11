from mashumaro.mixins.json import DataClassJSONMixin  # type: ignore
from dataclasses import dataclass, field
from typing import Optional, Any, Dict, List
from uuid import UUID
from .snyk_managers import Manager as V3Manager
from snyk.models import AggregatedIssue


@dataclass
class OrganizationGroup(DataClassJSONMixin):
    name: str
    id: str

@dataclass
class OrganizationAttributes(Dict):
    is_personal: str
    name: str
    slug: str

@dataclass
class Organization(DataClassJSONMixin):
    attributes: OrganizationAttributes
    id: UUID
    type: str
    group: Optional[OrganizationGroup] = None
    client: Optional[Any] = None

    @property
    def projects(self) -> V3Manager:
        return V3Manager.factory(Project, self.client, self)
    
    @property
    def targets(self) -> V3Manager:
        return V3Manager.factory(Target, self.client, self)

    @property
    def tags(self) -> V3Manager:
        return V3Manager.factory("Tag", self.organization.client, self)

@dataclass
class ProjectTag(Dict):
    key: str
    value: str

@dataclass
class ProjectAttributes(DataClassJSONMixin):
    name: str
    origin: str
    status: str
    targetReference: str
    tags: Optional[List[ProjectTag]] = field(default_factory=list)

@dataclass
class Data(Dict):
    id: UUID
    type: str

@dataclass
class RelationshipData(DataClassJSONMixin):
    data: Data

@dataclass
class ProjectRelationships(DataClassJSONMixin):
    org: Optional[RelationshipData] = None
    target: Optional[RelationshipData] = None

@dataclass
class Project(DataClassJSONMixin):
    id: str
    type: str
    attributes: ProjectAttributes
    relationships: ProjectRelationships
   # _tags: Optional[List[Any]] = field(default_factory=list)

@dataclass
class TargetAttributes(DataClassJSONMixin):
    origin: str
    isPrivate: bool
    displayName: str
    remoteUrl: str
    #tags: Optional[List[ProjectTag]] = field(default_factory=list)

@dataclass
class TargetRelationships(DataClassJSONMixin):
    org: Optional[RelationshipData] = None
    target: Optional[RelationshipData] = None

@dataclass
class Target(DataClassJSONMixin):
    id: str
    type: str
    attributes: TargetAttributes
    relationships: TargetRelationships

@dataclass
class ProjectIssues(DataClassJSONMixin):
    projectId: UUID
    projectName: str
    projectBrowseUrl: str
    packageName: str
    projectType: str
    issues: List[AggregatedIssue]