from typing import Any, ClassVar, Dict, List, Optional

from loguru import logger

from dyslexxy.database.repository import ensure_record_id, repo_query
from dyslexxy.domain.base import ObjectModel
from dyslexxy.exceptions import DatabaseOperationError


class Quiz(ObjectModel):
    table_name: ClassVar[str] = "quiz"
    source: str
    title: str
    questions: List[Dict[str, Any]] = []

    def _prepare_save_data(self) -> Dict[str, Any]:
        data = super()._prepare_save_data()
        # Convert source string to RecordID for SurrealDB record<source> field
        data["source"] = ensure_record_id(self.source)
        return data

    async def get_source(self) -> "Source":
        from dyslexxy.domain.notebook import Source

        try:
            src = await repo_query(
                """
            select source.* from $id fetch source
            """,
                {"id": ensure_record_id(self.id)},
            )
            return Source(**src[0]["source"])
        except Exception as e:
            logger.error(f"Error fetching source for quiz {self.id}: {str(e)}")
            logger.exception(e)
            raise DatabaseOperationError(e)

    @classmethod
    async def get_for_source(cls, source_id: str) -> List["Quiz"]:
        try:
            result = await repo_query(
                """
                SELECT * FROM quiz WHERE source=$id ORDER BY created DESC
                """,
                {"id": ensure_record_id(source_id)},
            )
            return [Quiz(**quiz) for quiz in result] if result else []
        except Exception as e:
            logger.error(
                f"Error fetching quizzes for source {source_id}: {str(e)}"
            )
            logger.exception(e)
            raise DatabaseOperationError(e)
