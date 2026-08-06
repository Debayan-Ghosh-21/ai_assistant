from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create test client for testing accuracy_logs router."""
    from api.main import app
    return TestClient(app)


class TestAccuracyLogsApi:
    """Test suite for Accuracy Logs API endpoints."""

    @patch("api.routers.accuracy_logs.chat_graph")
    @patch("api.routers.accuracy_logs.provision_langchain_model")
    @patch("api.routers.accuracy_logs.AccuracyLog")
    def test_create_accuracy_log(self, mock_log_cls, mock_provision, mock_chat_graph, client):
        """Test that creating an accuracy log works and generates a score."""
        mock_state = MagicMock()
        mock_ai_msg = MagicMock()
        mock_ai_msg.type = "ai"
        mock_ai_msg.content = "Test summary"
        mock_state.values = {"messages": [mock_ai_msg], "context": "Test context"}
        mock_chat_graph.get_state.return_value = mock_state

        mock_llm = AsyncMock()
        mock_resp = MagicMock()
        mock_resp.content = '{"score": 90, "reasoning": "Looks accurate"}'
        mock_llm.ainvoke = AsyncMock(return_value=mock_resp)
        mock_provision.return_value = mock_llm

        mock_log = AsyncMock()
        mock_log.id = "accuracy_log:abc123"
        mock_log.chat_id = "chat_session:session123"
        mock_log.accuracy_score = 90
        mock_log.insight_id = None
        mock_log.reasoning = "Looks accurate"
        mock_log.created_at = datetime(2026, 6, 22, 12, 0, 0, tzinfo=timezone.utc)
        mock_log.created = datetime(2026, 6, 22, 12, 0, 0, tzinfo=timezone.utc)
        mock_log.save = AsyncMock()
        mock_log_cls.return_value = mock_log

        response = client.post(
            "/api/accuracy-logs",
            json={"chat_id": "chat_session:session123"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "accuracy_log:abc123"
        assert data["chat_id"] == "chat_session:session123"
        assert 80 <= data["accuracy_score"] <= 98
        assert "2026-06-22T12:00:00" in data["created_at"]

    @patch("api.routers.accuracy_logs.AccuracyLog")
    def test_get_accuracy_stats(self, mock_log_cls, client):
        """Test fetching aggregated stats returns the correct math calculations."""
        # Create mock logs
        log1 = AsyncMock()
        log1.id = "accuracy_log:1"
        log1.chat_id = "chat_session:session1"
        log1.accuracy_score = 80
        log1.created_at = datetime(2026, 6, 21, 10, 0, 0, tzinfo=timezone.utc)
        log1.created = datetime(2026, 6, 21, 10, 0, 0, tzinfo=timezone.utc)
        log1.insight_id = None
        log1.reasoning = None

        log2 = AsyncMock()
        log2.id = "accuracy_log:2"
        log2.chat_id = "chat_session:session2"
        log2.accuracy_score = 90
        log2.created_at = datetime(2026, 6, 21, 14, 0, 0, tzinfo=timezone.utc)
        log2.created = datetime(2026, 6, 21, 14, 0, 0, tzinfo=timezone.utc)
        log2.insight_id = None
        log2.reasoning = None

        log3 = AsyncMock()
        log3.id = "accuracy_log:3"
        log3.chat_id = "chat_session:session3"
        log3.accuracy_score = 98
        log3.created_at = datetime(2026, 6, 22, 9, 0, 0, tzinfo=timezone.utc)
        log3.created = datetime(2026, 6, 22, 9, 0, 0, tzinfo=timezone.utc)
        log3.insight_id = None
        log3.reasoning = None

        mock_log_cls.get_all = AsyncMock(return_value=[log1, log2, log3])

        response = client.get("/api/accuracy-logs/stats")

        assert response.status_code == 200
        data = response.json()
        
        # 3 logs in total
        assert data["total_logs"] == 3
        # average: (80 + 90 + 98) / 3 = 89.333... -> rounded to 89.33
        assert data["average_score"] == 89.33
        assert data["min_score"] == 80
        assert data["max_score"] == 98
        
        # Daily averages:
        # 2026-06-21: (80 + 90) / 2 = 85.0
        # 2026-06-22: 98.0
        assert len(data["daily_averages"]) == 2
        assert data["daily_averages"][0]["date"] == "2026-06-21"
        assert data["daily_averages"][0]["avg_score"] == 85.0
        assert data["daily_averages"][1]["date"] == "2026-06-22"
        assert data["daily_averages"][1]["avg_score"] == 98.0

    @patch("api.routers.accuracy_logs.AccuracyLog")
    def test_get_accuracy_stats_empty(self, mock_log_cls, client):
        """Test fetching stats with no logs returns clean empty structure."""
        mock_log_cls.get_all = AsyncMock(return_value=[])

        response = client.get("/api/accuracy-logs/stats")

        assert response.status_code == 200
        data = response.json()
        assert data["total_logs"] == 0
        assert data["records"] == []
        assert data["daily_averages"] == []
        assert data["average_score"] == 0.0
