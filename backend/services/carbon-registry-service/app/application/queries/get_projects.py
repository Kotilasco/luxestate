from uuid import UUID

from app.application.dto import CarbonProjectResponse
from app.application.ports import CarbonProjectRepository


class ProjectNotFoundError(Exception):
    pass


class GetCarbonProjectQuery:
    def __init__(self, repository: CarbonProjectRepository) -> None:
        self._repository = repository

    async def execute(self, project_id: UUID) -> CarbonProjectResponse:
        project = await self._repository.get_by_id(project_id)
        if project is None:
            raise ProjectNotFoundError(f"Carbon project {project_id} was not found.")
        return CarbonProjectResponse.model_validate(project)


class ListCarbonProjectsQuery:
    def __init__(self, repository: CarbonProjectRepository) -> None:
        self._repository = repository

    async def execute(self, limit: int, offset: int) -> list[CarbonProjectResponse]:
        projects = await self._repository.list(limit=limit, offset=offset)
        return [CarbonProjectResponse.model_validate(project) for project in projects]
