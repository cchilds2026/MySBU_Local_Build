from __future__ import annotations

from app import app
from workflow_api import workflow_bp


app.register_blueprint(workflow_bp)


if __name__ == "__main__":
    app.run(debug=True, port=5050)
