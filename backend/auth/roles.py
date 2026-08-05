from fastapi import Depends, HTTPException, status

from backend.auth.dependencies import get_current_user
from backend.models.user import User


def require_role(required_role: str):
    def role_checker(
        current_user: User = Depends(get_current_user)
    ):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. {required_role} role required."
            )

        return current_user

    return role_checker