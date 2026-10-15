import unittest
from unittest.mock import MagicMock, patch
import os

# Set dummy AWS credentials before importing app/config
os.environ["AWS_ACCESS_KEY_ID"] = "test-access-key"
os.environ["AWS_SECRET_ACCESS_KEY"] = "test-secret-key"
os.environ["AWS_BUCKET_NAME"] = "test-bucket"
os.environ["AWS_REGION"] = "us-east-1"
os.environ["FLASK_SECRET_KEY"] = "test-secret"

from src.app import app


class BaselineRouteTests(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_route_table_matches_baseline(self):
        """Regression Gate: route table (path, methods, endpoint) matches baseline."""
        expected_routes = {
            ("/", "GET", "index"),
            ("/upload", "POST", "upload"),
            ("/download/<path:filename>", "GET", "download"),
            ("/delete/<path:filename>", "POST", "delete"),
            ("/static/<path:filename>", "GET", "static"),
        }
        actual_routes = set()
        for rule in app.url_map.iter_rules():
            methods = rule.methods - {"HEAD", "OPTIONS"}
            for m in methods:
                actual_routes.add((rule.rule, m, rule.endpoint))

        self.assertEqual(expected_routes, actual_routes)

    @patch("src.app.s3")
    def test_index_route_loads(self, mock_s3):
        mock_s3.list_files.return_value = [
            {"key": "test_note.pdf", "size": 12.34, "last_modified": "2026-10-15 12:00:00"}
        ]
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Cloud Notes Storage Dashboard", response.data)
        self.assertIn(b"test_note.pdf", response.data)
        mock_s3.list_files.assert_called_with("")

    @patch("src.app.s3")
    def test_search_query_passed(self, mock_s3):
        mock_s3.list_files.return_value = []
        response = self.client.get("/?search=exam")
        self.assertEqual(response.status_code, 200)
        mock_s3.list_files.assert_called_with("exam")


if __name__ == "__main__":
    unittest.main()
