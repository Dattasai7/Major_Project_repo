from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Depends

from models import SignupRequest, LoginRequest, ProfileUpdateRequest, TokenResponse, UserResponse
from auth import hash_password, verify_password, create_access_token, get_current_user
from database import users_collection

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Profile field names that we store alongside the user document
PROFILE_FIELDS = [
    "name", "ageRange", "country", "city", "language",
    "gender", "height", "weight", "conditions", "personalization",
]


def _build_user_response(user_doc) -> UserResponse:
    """Build a UserResponse from a MongoDB user document."""
    data = {
        "id": str(user_doc["_id"]),
        "email": user_doc["email"],
    }
    for f in PROFILE_FIELDS:
        data[f] = user_doc.get(f)
    return UserResponse(**data)


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

    # Create the user document with all profile fields
    user_doc = {
        "email": request.email,
        "password": hash_password(request.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    # Add optional profile fields
    for f in PROFILE_FIELDS:
        val = getattr(request, f, None)
        if val is not None:
            user_doc[f] = val

    result = await users_collection.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    # Generate JWT
    access_token = create_access_token(data={"sub": request.email})

    return TokenResponse(
        access_token=access_token,
        user=_build_user_response(user_doc),
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
        user=_build_user_response(user),
    )


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user


@router.put("/profile")
async def update_profile(
    request: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update profile fields for the current user."""
    update_data = {}
    for f in PROFILE_FIELDS:
        val = getattr(request, f, None)
        if val is not None:
            update_data[f] = val

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    from bson import ObjectId
    await users_collection.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_data},
    )

    # Return updated user
    updated_user = await users_collection.find_one({"email": current_user["email"]})
    return _build_user_response(updated_user)
