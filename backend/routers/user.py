from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.user import User
from backend.schemas.user import UserCreate

from backend.auth.dependencies import get_current_user
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
        "status": user.status
    }


# ==========================
# GET ALL USERS (Admin Only)
# ==========================
@router.get("/users")
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):
    users = db.query(User).all()

    return {
        "logged_in_as": current_user.email,
        "users": [user_response(user) for user in users]
    }


# ==========================
# CREATE USER (Admin Only)
# ==========================
@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        password=hash_password(user.password),
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully",
        "data": user_response(new_user)
    }


# ==========================
# GET SINGLE USER (Admin Only)
# ==========================
@router.get("/users/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):
    db_user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user_response(db_user)


# ==========================
# UPDATE USER (Admin Only)
# ==========================
@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):
    db_user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    db_user.full_name = user.full_name
    db_user.email = user.email
    db_user.phone = user.phone
    db_user.password = hash_password(user.password)
    db_user.role = user.role

    db.commit()
    db.refresh(db_user)

    return {
        "message": "User updated successfully",
        "data": user_response(db_user)
    }


# ==========================
# DELETE USER (Admin Only)
# ==========================
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):
    db_user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    db.delete(db_user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }