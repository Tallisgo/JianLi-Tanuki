"""
基础数据访问层
"""
from typing import List, Optional, Dict, Any, TypeVar, Generic
from database.config.connection import db_connection
from database.models.base import BaseModel

T = TypeVar('T', bound=BaseModel)

class BaseRepository(Generic[T]):
    """基础数据访问层"""
    
    def __init__(self, model_class: type):
        self.model_class = model_class
        self.connection = db_connection
    
    def create(self, model: T) -> bool:
        """创建记录"""
        raise NotImplementedError("子类必须实现 create 方法")
    
    def get_by_id(self, id: Any) -> Optional[T]:
        """根据ID获取记录"""
        raise NotImplementedError("子类必须实现 get_by_id 方法")
    
    def get_all(self, limit: int = 100, offset: int = 0) -> List[T]:
        """获取所有记录"""
        raise NotImplementedError("子类必须实现 get_all 方法")
    
    def update(self, model: T) -> bool:
        """更新记录"""
        raise NotImplementedError("子类必须实现 update 方法")
    
    def delete(self, id: Any) -> bool:
        """删除记录"""
        raise NotImplementedError("子类必须实现 delete 方法")
    
    def count(self) -> int:
        """获取记录总数"""
        raise NotImplementedError("子类必须实现 count 方法")
    
    def exists(self, id: Any) -> bool:
        """检查记录是否存在"""
        record = self.get_by_id(id)
        return record is not None
    
    def search(self, filters: Dict[str, Any], limit: int = 100, offset: int = 0) -> List[T]:
        """搜索记录"""
        raise NotImplementedError("子类必须实现 search 方法")
