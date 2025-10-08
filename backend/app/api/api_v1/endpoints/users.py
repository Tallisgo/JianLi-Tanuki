"""
用户管理API端点
"""
from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from app.services.auth_service import AuthService
from app.services.user_service import UserService

router = APIRouter()
security = HTTPBearer()
auth_service = AuthService()
user_service = UserService()

# 请求模型
class CreateUserRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: str = "user"

class UpdateUserRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None

# 响应模型
class UserResponse(BaseModel):
    success: bool
    message: str
    user: Optional[dict] = None

class UserListResponse(BaseModel):
    success: bool
    message: str
    users: List[dict]
    total: int
    page: int
    page_size: int

class UserStatsResponse(BaseModel):
    success: bool
    message: str
    statistics: dict

# 依赖函数
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

@router.get("/", response_model=UserListResponse)
async def get_users(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    role: Optional[str] = Query(None, description="角色筛选"),
    status: Optional[str] = Query(None, description="状态筛选"),
    current_admin: dict = Depends(get_current_admin)
):
    """获取用户列表"""
    try:
        offset = (page - 1) * page_size
        
        if search:
            users = user_service.search_users(search, page_size, offset)
        elif role:
            users = user_service.get_users_by_role(role, page_size, offset)
        elif status == "active":
            users = user_service.get_active_users(page_size, offset)
        else:
            users = user_service.get_all_users(page_size, offset)
        
        # 转换为字典格式
        user_list = [user.to_dict() for user in users]
        
        return UserListResponse(
            success=True,
            message="获取用户列表成功",
            users=user_list,
            total=len(user_list),
            page=page,
            page_size=page_size
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取用户列表失败: {str(e)}"
        )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_admin: dict = Depends(get_current_admin)
):
    """获取用户详情"""
    user = user_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    return UserResponse(
        success=True,
        message="获取用户详情成功",
        user=user.to_dict()
    )

@router.post("/", response_model=UserResponse)
async def create_user(
    request: CreateUserRequest,
    current_admin: dict = Depends(get_current_admin)
):
    """创建用户"""
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
    
    # 如果指定了角色，更新用户角色
    if request.role != "user":
        user = result["user"]
        role_result = user_service.update_user_role(user["id"], request.role)
        if role_result["success"]:
            result["user"] = role_result["user"]
    
    return UserResponse(**result)

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    request: UpdateUserRequest,
    current_admin: dict = Depends(get_current_admin)
):
    """更新用户信息"""
    # 构建更新数据
    update_data = {}
    if request.username is not None:
        update_data["username"] = request.username
    if request.email is not None:
        update_data["email"] = request.email
    if request.full_name is not None:
        update_data["full_name"] = request.full_name
    if request.phone is not None:
        update_data["phone"] = request.phone
    
    # 更新基本信息
    if update_data:
        result = user_service.update_user_profile(user_id, **update_data)
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
    
    # 更新角色
    if request.role is not None:
        role_result = user_service.update_user_role(user_id, request.role)
        if not role_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=role_result["message"]
            )
    
    # 更新状态
    if request.status is not None:
        status_result = user_service.update_user_status(user_id, request.status)
        if not status_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=status_result["message"]
            )
    
    # 获取更新后的用户信息
    user = user_service.get_user_by_id(user_id)
    return UserResponse(
        success=True,
        message="用户更新成功",
        user=user.to_dict() if user else None
    )

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_admin: dict = Depends(get_current_admin)
):
    """删除用户"""
    result = user_service.delete_user(user_id)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    return {"success": True, "message": "用户删除成功"}

@router.put("/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: int,
    status: str,
    current_admin: dict = Depends(get_current_admin)
):
    """更新用户状态"""
    result = user_service.update_user_status(user_id, status)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    return UserResponse(**result)

@router.put("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: int,
    role: str,
    current_admin: dict = Depends(get_current_admin)
):
    """更新用户角色"""
    result = user_service.update_user_role(user_id, role)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    return UserResponse(**result)

@router.get("/stats/overview", response_model=UserStatsResponse)
async def get_user_statistics(
    current_admin: dict = Depends(get_current_admin)
):
    """获取用户统计信息"""
    statistics = user_service.get_user_statistics()
    
    return UserStatsResponse(
        success=True,
        message="获取用户统计成功",
        statistics=statistics
    )
