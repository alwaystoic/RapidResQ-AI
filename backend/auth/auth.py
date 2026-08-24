from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.user import User
from backend.schemas.user import UserCreate, UserLogin

from backend.auth.hashing import hash_password, verify_password
from backend.auth.security import create_access_token


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ==========================
# REGISTER
# ==========================
@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    # Check whether email or phone already exists
    existing_user = db.query(User).filter(
        (User.email == user.email) |
        (User.phone == user.phone)
    ).first()

    if existing_user:

        if existing_user.email == user.email:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        if existing_user.phone == user.phone:
            raise HTTPException(
                status_code=400,
                detail="Phone number already registered"
            )

    # Hash password before storing it
    hashed_password = hash_password(user.password)

    # Public registration ALWAYS creates a Citizen
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        password=hashed_password,
        role="Citizen",
        status="Active"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "role": new_user.role
    }


# ==========================
# LOGIN
# ==========================
@router.post("/login")
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == login_data.email
    ).first()

    # Same generic error for unknown email/password
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(
        login_data.password,
        user.password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Prevent inactive users from logging in
    if user.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Generate JWT
    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }