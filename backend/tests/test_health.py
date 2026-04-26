"""Tests for the health check endpoint."""

from unittest.mock import patch

from app.extensions import db


class TestHealthCheck:
    """GET /api/health"""

    def test_returns_healthy_when_db_is_reachable(self, client, session):
        """When the DB session executes a SELECT, status is healthy + connected."""
        response = client.get("/api/health")
        assert response.status_code == 200
        body = response.get_json()
        assert body["status"] == "healthy"
        assert body["database"] == "connected"

    def test_returns_degraded_when_db_session_raises(self, client, session):
        """When db.get_session() blows up, status flips to degraded/disconnected."""
        with patch.object(db, "get_session", side_effect=RuntimeError("boom")):
            response = client.get("/api/health")
        assert response.status_code == 200  # health endpoint always 200
        body = response.get_json()
        assert body["status"] == "degraded"
        assert body["database"] == "disconnected"
