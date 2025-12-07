"""
用户认证API端点
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.services.auth_service import AuthService
from app.services.user_service import UserService

router = APIRouter()
security = HTTPBearer()
auth_service = AuthService()
user_service = UserService()

# 请求模型
class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# 响应模型
class AuthResponse(BaseModel):
    success: bool
    message: str
    user: Optional[dict] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: Optional[str] = None
    expires_in: Optional[int] = None

class UserResponse(BaseModel):
    success: bool
    message: str
    user: Optional[dict] = None

# 依赖函数
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """获取当前用户"""
    user = auth_service.require_auth(credentials.credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """获取当前管理员用户"""
    user = auth_service.require_admin(credentials.credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """用户登录"""
    result = auth_service.authenticate_user(request.username_or_email, request.password)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result["message"]
        )
    
    return AuthResponse(**result)

@router.post("/register", response_model=UserResponse)
async def register(request: RegisterRequest):
    """用户注册"""
    result = user_service.register_user(
        username=request.username,
        email=request.email,
        password=request.password,
        full_name=request.full_name,
        phone=request.phone
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    return UserResponse(**result)

@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(request: RefreshTokenRequest):
    """刷新访问令牌"""
    access_token = auth_service.refresh_access_token(request.refresh_token)
    
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌"
        )
    
    return AuthResponse(
        success=True,
        message="令牌刷新成功",
        access_token=access_token,
        token_type="bearer",
        expires_in=auth_service.access_token_expire_minutes * 60
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """获取当前用户信息"""
    return UserResponse(
        success=True,
        message="获取用户信息成功",
        user=current_user
    )

@router.put("/me", response_model=UserResponse)
async def update_profile(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """更新个人资料"""
    user_id = current_user["id"]
    result = user_service.update_user_profile(user_id, **request)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    return UserResponse(**result)

@router.post("/change-password", response_model=UserResponse)
async def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """修改密码"""
    user_id = current_user["id"]
    result = user_service.change_password(
        user_id=user_id,
        old_password=request.old_password,
        new_password=request.new_password
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    return UserResponse(**result)

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """用户登出"""
    return {"success": True, "message": "登出成功"}

@router.get("/validate")
async def validate_token(current_user: dict = Depends(get_current_user)):
    """验证令牌有效性"""
    return {
        "success": True,
        "message": "令牌有效",
        "user": current_user
    }



