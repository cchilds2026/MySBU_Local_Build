from __future__ import annotations

"""
Local-development identity settings.

The Flask API uses this mock user while the prototype is running outside the
university authentication stack. Production should replace this file with an
identity provider that reads the signed-in user's email, display name, and roles
from Active Directory, SSO, or another backend identity layer.
"""

MOCK_CURRENT_USER = {
    "user_id": "BONAS\\cchilds",
    "email": "cchilds@sbu.edu",
    "display_name": "Cody Childs",
    "roles": ["student", "faculty", "asa_staff"],
}
