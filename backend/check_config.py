#!/usr/bin/env python3
"""
配置检查脚本 - 验证.env配置是否正确
"""

import os
import sys
from pathlib import Path

def check_env_file():
    """检查.env文件是否存在"""
    env_file = Path(".env")
    if not env_file.exists():
        print("❌ .env文件不存在")
        return False
    
    print("✅ .env文件存在")
    return True

def check_config_loading():
    """检查配置是否能正常加载"""
    try:
        from app.core.config import settings
        print("✅ 配置模块加载成功")
        return True
    except Exception as e:
        print(f"❌ 配置加载失败: {e}")
        return False

def check_key_configs():
    """检查关键配置项"""
    try:
        from app.core.config import settings
        
        print("\n📋 关键配置检查:")
        print(f"  项目名称: {settings.PROJECT_NAME}")
        print(f"  服务器地址: {settings.HOST}:{settings.PORT}")
        print(f"  数据库URL: {settings.DATABASE_URL}")
        print(f"  LLM模型: {settings.LLM_MODEL}")
        print(f"  API Key: {'已设置' if settings.SILICONFLOW_API_KEY else '❌ 未设置'}")
        print(f"  调试模式: {settings.DEBUG}")
        print(f"  环境: {settings.ENVIRONMENT}")
        
        return True
    except Exception as e:
        print(f"❌ 配置检查失败: {e}")
        return False

def main():
    """主函数"""
    print("🦝 JianLi Tanuki 配置检查")
    print("=" * 40)
    
    checks = [
        ("环境文件检查", check_env_file),
        ("配置加载检查", check_config_loading),
        ("关键配置检查", check_key_configs)
    ]
    
    passed = 0
    for check_name, check_func in checks:
        print(f"\n🔍 {check_name}:")
        if check_func():
            passed += 1
        else:
            print(f"❌ {check_name}失败")
    
    print("\n" + "=" * 40)
    if passed == len(checks):
        print("🎉 所有检查通过！配置系统正常。")
        return True
    else:
        print(f"⚠️  {len(checks) - passed} 个检查失败")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
