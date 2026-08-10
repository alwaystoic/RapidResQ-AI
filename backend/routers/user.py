from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.user import User
from backend.schemas.user import (
    UserCreate,
    UserUpdate,
)

from backend.auth.roles import require_role
from backend.auth.hashing import hash_password

router = APIRouter()


def user_response(user):
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "status": user.status,
    }


# =========================================================
# GET ALL USERS
# Admin Only
# =========================================================

@router.get("/users")
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin")),
):
    users = db.query(User).all()

    return {
        "logged_in_as": current_user.email,
        "users": [
            user_response(user)
            for user in users
        ],
    }


# =========================================================
# CREATE USER
# Admin Only
# =========================================================

@router.post(
    "/users",
    status_code=status.HTTP_201_CREATED
)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin")),
):
    existing_email = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    existing_phone = db.query(User).filter(
        User.phone == user.phone
    ).first()

    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered",
        )

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        password=hash_password(user.password),
        role=user.role,
        status=user.status,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully",
        "data": user_response(new_user),
    }


# =========================================================
# GET SINGLE USER
# Admin Only
# =========================================================

@router.get("/users/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin")),
):
    db_user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user_response(db_user)


# =========================================================
# UPDATE USER
# Admin Only
# =========================================================

@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin")),
):
    db_user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check email uniqueness
    existing_email = db.query(User).filter(
        User.email == user.email,
        User.id != user_id,
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Check phone uniqueness
    existing_phone = db.query(User).filter(
        User.phone == user.phone,
        User.id != user_id,
    ).first()

    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered",
        )

    db_user.full_name = user.full_name
    db_user.email = user.email
    db_user.phone = user.phone
    db_user.role = user.role
    db_user.status = user.status

    # Only change password if one was supplied
    if user.password:
        db_user.password = hash_password(user.password)

    db.commit()
    db.refresh(db_user)

    return {
        "message": "User updated successfully",
        "data": user_response(db_user),
    }


# =========================================================
# DELETE USER
# Admin Only
# =========================================================

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin")),
):
    db_user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent admin from deleting their own account
    if db_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account",
        )

    db.delete(db_user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }