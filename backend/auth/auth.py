from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.user import User
from backend.schemas.user import UserCreate

from backend.auth.hashing import hash_password, verify_password
from backend.auth.security import create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    print("========== REGISTER CALLED ==========")
    print(user)

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    print("Existing user:", existing_user)

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    print("Hashing password...")

    hashed = hash_password(user.password)

    print("Hashed successfully")

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        password=hashed,
        role=user.role
    )

    print("Adding user...")

    db.add(new_user)

    print("Committing...")

    db.commit()

    print("Refreshing...")

    db.refresh(new_user)

    print("DONE!")

    return {
        "message": "User registered successfully"
    }

@router.post("/login")
def login(
    email: str,
    password: str,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    print("Plain password:", password)
    print("Stored hash:", user.password)

    if not verify_password(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

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