from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, Query, status

from app.api.dependencies import get_audit_writer, get_project_repository
from app.application.commands.register_project import RegisterCarbonProjectCommand
from app.application.dto import CarbonProjectResponse, ErrorResponse, RegisterCarbonProjectRequest
from app.application.ports import AuditWriter, CarbonProjectRepository
from app.application.queries.get_projects import GetCarbonProjectQuery, ListCarbonProjectsQuery
from app.infrastructure.security.current_user import CurrentUser, get_current_user

router = APIRouter(prefix="/api/v1/projects", tags=["Carbon Projects"])


@router.post(
    "",
    response_model=CarbonProjectResponse,
    status_code=status.HTTP_201_CREATED,
    responses={409: {"model": ErrorResponse}},
)
async def register_project(
    request: RegisterCarbonProjectRequest,
    repository: CarbonProjectRepository = Depends(get_project_repository),
    audit_writer: AuditWriter = Depends(get_audit_writer),
    current_user: CurrentUser = Depends(get_current_user),
    x_correlation_id: UUID | None = Header(default=None, alias="X-Correlation-Id"),
) -> CarbonProjectResponse:
    command = RegisterCarbonProjectCommand(repository, audit_writer)
    return await command.execute(
        request,
        actor_id=current_user.actor_id,
        actor_role=current_user.actor_role,
        correlation_id=x_correlation_id or uuid4(),
    )


@router.get("", response_model=list[CarbonProjectResponse])
async def list_projects(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    repository: CarbonProjectRepository = Depends(get_project_repository),
) -> list[CarbonProjectResponse]:
    query = ListCarbonProjectsQuery(repository)
    return await query.execute(limit=limit, offset=offset)


@router.get("/{project_id}", response_model=CarbonProjectResponse, responses={404: {"model": ErrorResponse}})
async def get_project(
    project_id: UUID,
    repository: CarbonProjectRepository = Depends(get_project_repository),
) -> CarbonProjectResponse:
    query = GetCarbonProjectQuery(repository)
    return await query.execute(project_id)
