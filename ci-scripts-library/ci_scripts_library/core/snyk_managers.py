import abc
from typing import Any, Dict, List
from xxlimited import Str
from snyk.errors import SnykError, SnykNotFoundError

#from ci_scripts_library.core.super_snyk_client import SuperSnykClient

class Manager(abc.ABC):
    def __init__(self, klass, client, instance=None):
        self.klass = klass
        self.client = client
        self.instance = instance
        self.params = {"limit": 100}

    @abc.abstractmethod
    def all(self):
        pass  # pragma: no cover

    def get(self, id: str):
        try:
            return next(x for x in self.all() if x.id == id)
        except StopIteration:
            raise SnykNotFoundError

    def first(self):
        try:
            return self.all()[0]
        except IndexError:
            raise SnykNotFoundError

    def _filter_by_kwargs(self, data, **kwargs: Any):
        if kwargs:
            for key, value in kwargs.items():
                data = [x for x in data if getattr(x, key) == value]
        return data

    def filter(self, **kwargs: Any):
        return self._filter_by_kwargs(self.all(), **kwargs)

    @staticmethod
    def factory(klass, client, instance=None):
        print(f"klass: {klass}")
        try:
            if isinstance(klass, str):
                key = klass
            else:
                key = klass.__name__
            manager = {
                "Target": TargetManager,
                "Project": ProjectManager,
                "Organization": OrganizationManager
            }[key]
            return manager(klass, client, instance)
        except KeyError:
            raise SnykError

class TargetManager(Manager):
    def _query(self):
        targets = []
        params = self.params
        if self.instance:
            path = f"orgs/{self.instance.id}/targets"
            data = self.client.get_v3_pages(path, params=params)
            if len(data) > 0:
                for target_data in data:
                    target_data['organization'] = self.instance.to_dict()
                    targets.append(self.klass.from_dict(target_data))
            for x in targets:
                x.organization = self.instance
        else:
            for org in self.client.organizations.all():
                targets.extend(org.targets.all())
        return targets

    def all(self):
        return self._query()
        
    def filter(self, **kwargs: Any):
        return self._filter_by_kwargs(self._query(), **kwargs)


    """ def get(self, id: str):
        if self.instance:
            path = f"orgs/{self.instance.id}/targets"
            print(f"path: {path}")
            data = self.client.get_v3_pages(path, params=self.params)
            print(data)
            target_data = data['attributes']
            for x in target_data:

            #target_data["organization"] = self.instance.to_dict()
            target_klass = self.klass.from_dict(target_data)
            target_klass.organization = self.instance
            return target_klass
        else:
            return super().get(id) """

class OrganizationManager(Manager):
    def all(self):
        orgs = []
        data = self.client.get_v3_pages("orgs", params=self.params)
        if len(data) > 0:
            for org_data in data:
                orgs.append(self.klass.from_dict(org_data))
        for org in orgs:
            org.client = self.client
        return orgs

class ProjectManager(Manager):
    def _query(self, tags: List[str] = []):
        projects = []
        params = self.params
        if self.instance:
            path = f"orgs/{self.instance.id}/projects"
            if tags:
               #todo check valid format of the tags
                params.update({"tags": ",".join(tags)})
            data = self.client.get_v3_pages(path, params=params)
            if len(data) > 0:
                for project_data in data:
                    project_data['organization'] = self.instance.to_dict()
                    projects.append(self.klass.from_dict(project_data))
            for x in projects:
                x.organization = self.instance
        else:
            for org in self.client.organizations.all():
                projects.extend(org.projects.all())
        return projects

    def all(self):
        return self._query()
        
    def filter(self, tags: List[str] = [], **kwargs: Any):
        if tags:
            return self._filter_by_kwargs(self._query(tags), **kwargs)
        else:
            return super().filter(**kwargs)

    def get(self, id: str):
        if self.instance:
            path = f"orgs/{self.instance.id}/project/{id}"
            print(f"path: {path}")
            data = self.client.get_v3_pages(path, params=self.params)
            project_data = data
            project_data["organization"] = self.instance.to_dict()
            project_klass = self.klass.from_dict(project_data)
            project_klass.organization = self.instance
            return project_klass
        else:
            return super().get(id)
