from typing import Any, ClassVar, Dict, Optional
from datetime import datetime
from pydantic import field_validator
from dyslexxy.domain.base import ObjectModel

class AccuracyLog(ObjectModel):
    table_name: ClassVar[str] = "accuracy_log"
    nullable_fields: ClassVar[set[str]] = {"chat_id", "insight_id", "reasoning"}
    chat_id: Optional[str] = None
    insight_id: Optional[str] = None
    accuracy_score: int
    reasoning: Optional[str] = None
    created_at: Optional[datetime] = None

    @field_validator("created_at", mode="before")
    @classmethod
    def parse_created_at(cls, value):
        if isinstance(value, str):
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        return value

    def _prepare_save_data(self) -> Dict[str, Any]:
        data = super()._prepare_save_data()
        # If created_at is None, let SurrealDB set the default (time::now())
        if "created_at" in data and data["created_at"] is None:
            data.pop("created_at")
        return data
