"""
数据库基础模型
"""
from datetime import datetime
from typing import Optional, Dict, Any
from abc import ABC, abstractmethod

class BaseModel(ABC):
    """数据库模型基类"""
    
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    @abstractmethod
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        pass
    
    @classmethod
    @abstractmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BaseModel':
        """从字典创建实例"""
        pass
    
    @abstractmethod
    def to_tuple(self) -> tuple:
        """转换为元组（用于数据库插入）"""
        pass
    
    @classmethod
    @abstractmethod
    def from_row(cls, row) -> 'BaseModel':
        """从数据库行创建实例"""
        pass
    
    def __repr__(self):
        return f"{self.__class__.__name__}({self.to_dict()})"
