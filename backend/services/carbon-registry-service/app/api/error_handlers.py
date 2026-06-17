from uuid import uuid4

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.application.commands.register_project import ProjectAlreadyExistsError
from app.application.dto import ErrorResponse
from app.application.queries.get_projects import ProjectNotFoundError


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ProjectAlreadyExistsError)
    async def project_exists_handler(request: Request, exc: ProjectAlreadyExistsError) -> JSONResponse:
        correlation_id = request.headers.get("X-Correlation-Id") or str(uuid4())
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=ErrorResponse(
                code="PROJECT_ALREADY_EXISTS",
                message=str(exc),
                correlation_id=correlation_id,
            ).model_dump(mode="json"),
        )

    @app.exception_handler(ProjectNotFoundError)
    async def project_not_found_handler(request: Request, exc: ProjectNotFoundError) -> JSONResponse:
        correlation_id = request.headers.get("X-Correlation-Id") or str(uuid4())
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=ErrorResponse(
                code="PROJECT_NOT_FOUND",
                message=str(exc),
                correlation_id=correlation_id,
            ).model_dump(mode="json"),
        )
