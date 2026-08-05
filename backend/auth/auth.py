print("======================================")
print("AUTH FILE LOADED")
print(__file__)
print("======================================")

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
    print("========== REGISTER CALLED ==========")
    print(user)

    # DEBUG: Show all users
    print("\n===== USERS IN DATABASE =====")
    users = db.query(User).all()
    for u in users:
        print(
            f"ID={u.id} | Email={u.email} | Phone={u.phone}"
        )
    print("=============================\n")

    existing_user = db.query(User).filter(
        (User.email == user.email) |
        (User.phone == user.phone)
    ).first()

    print("Incoming email:", user.email)
    print("Incoming phone:", user.phone)
    print("Existing user:", existing_user)

    if existing_user:

        print("Existing email:", existing_user.email)
        print("Existing phone:", existing_user.phone)

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


# ==========================
# LOGIN
# ==========================
@router.post("/login")
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    print("\n========== LOGIN CALLED ==========")
    print("Incoming email:", repr(login_data.email))
    print("Incoming password:", repr(login_data.password))

    user = db.query(User).filter(
        User.email == login_data.email
    ).first()

    print("User object:", user)

    if user:
        print("DB email:", repr(user.email))
        print("DB password hash:", user.password)
        print(
            "Password verification:",
            verify_password(login_data.password, user.password)
        )

    if not user:
        print("User NOT found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(
        login_data.password,
        user.password
    ):
        print("Password mismatch")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    print("Login successful")

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