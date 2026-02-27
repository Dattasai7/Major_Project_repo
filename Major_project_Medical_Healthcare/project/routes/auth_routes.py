from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Depends

from ..models import SignupRequest, LoginRequest, TokenResponse, UserResponse
from ..auth import hash_password, verify_password, create_access_token, get_current_user
from ..database import users_collection

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse)
async def signup(request: SignupRequest):
    """Register a new user and return a JWT token."""
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    # Create the user document
    user_doc = {
        "email": request.email,
        "password": hash_password(request.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    result = await users_collection.insert_one(user_doc)

    # Generate JWT
    access_token = create_access_token(data={"sub": request.email})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(id=str(result.inserted_id), email=request.email),
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Authenticate user and return a JWT token."""
    user = await users_collection.find_one({"email": request.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(request.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Generate JWT
    access_token = create_access_token(data={"sub": request.email})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(id=str(user["_id"]), email=user["email"]),
    )


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user
