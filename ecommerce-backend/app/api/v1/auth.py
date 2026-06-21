from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.crud.user import user as user_crud
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserOut, UserUpdate

router = APIRouter(tags=["authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    existing_email = await user_crud.get_by_email(db, email=user_in.email)
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    existing_username = await user_crud.get_by_username(db, username=user_in.username)
    if existing_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
    return await user_crud.create(db, obj_in=user_in)


@router.post("/login", response_model=Token)
async def login(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    user = await user_crud.authenticate(db, username=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user_crud.is_active(user):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_my_profile(
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_in.email and user_in.email != current_user.email:
        existing = await user_crud.get_by_email(db, email=user_in.email)
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already taken")
    if user_in.username and user_in.username != current_user.username:
        existing = await user_crud.get_by_username(db, username=user_in.username)
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="Username already taken")

    safe_update = UserUpdate(
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name,
        password=user_in.password,
    )
    return await user_crud.update(db, db_obj=current_user, obj_in=safe_update)
