#!/usr/bin/env python3
"""
JianLi Tanuki 配置设置脚本
帮助用户快速配置系统参数
"""

import os
import sys
from pathlib import Path

def create_env_file():
    """创建.env配置文件"""
    env_file = Path(".env")
    template_file = Path("config.env.template")
    
    if env_file.exists():
        print("⚠️  .env文件已存在")
        response = input("是否要覆盖现有配置？(y/N): ").strip().lower()
        if response != 'y':
            print("❌ 取消配置")
            return False
    
    if not template_file.exists():
        print("❌ 找不到配置模板文件 config.env.template")
        return False
    
    # 复制模板文件
    with open(template_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    with open(env_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ 已创建.env配置文件")
    return True

def interactive_config():
    """交互式配置"""
    print("\n🔧 开始交互式配置...")
    
    # 读取现有配置
    env_file = Path(".env")
    if not env_file.exists():
        print("❌ 请先运行 python setup_config.py --create 创建配置文件")
        return
    
    config = {}
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                config[key] = value
    
    # 配置关键参数
    print("\n📝 配置关键参数:")
    
    # SiliconFlow API Key
    if not config.get('SILICONFLOW_API_KEY'):
        print("\n🤖 LLM API配置:")
        api_key = input("请输入SiliconFlow API Key (必填): ").strip()
        if api_key:
            config['SILICONFLOW_API_KEY'] = api_key
        else:
            print("⚠️  未设置API Key，LLM功能将不可用")
    
    # 服务器配置
    print("\n🌐 服务器配置:")
    host = input(f"服务器地址 (当前: {config.get('HOST', '127.0.0.1')}): ").strip()
    if host:
        config['HOST'] = host
    
    port = input(f"服务器端口 (当前: {config.get('PORT', '8001')}): ").strip()
    if port:
        config['PORT'] = port
    
    # 环境配置
    print("\n🏗️  环境配置:")
    env = input("部署环境 (development/staging/production) [development]: ").strip()
    if env:
        config['ENVIRONMENT'] = env
        if env == 'production':
            config['DEBUG'] = 'false'
            config['DEBUG_MODE'] = 'false'
    
    # 数据库配置
    print("\n💾 数据库配置:")
    db_url = input(f"数据库URL (当前: {config.get('DATABASE_URL', 'sqlite:///./resume_parser.db')}): ").strip()
    if db_url:
        config['DATABASE_URL'] = db_url
    
    # 保存配置
    save_config(config)

def save_config(config):
    """保存配置到.env文件"""
    env_file = Path(".env")
    
    # 读取模板文件
    template_file = Path("config.env.template")
    with open(template_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 更新配置值
    updated_lines = []
    for line in lines:
        if line.strip() and not line.startswith('#') and '=' in line:
            key = line.split('=')[0]
            if key in config:
                updated_lines.append(f"{key}={config[key]}\n")
            else:
                updated_lines.append(line)
        else:
            updated_lines.append(line)
    
    # 写入文件
    with open(env_file, 'w', encoding='utf-8') as f:
        f.writelines(updated_lines)
    
    print("✅ 配置已保存")

def validate_config():
    """验证配置"""
    print("\n🔍 验证配置...")
    
    env_file = Path(".env")
    if not env_file.exists():
        print("❌ .env文件不存在")
        return False
    
    # 检查关键配置
    required_configs = {
        'SILICONFLOW_API_KEY': 'LLM API密钥',
        'HOST': '服务器地址',
        'PORT': '服务器端口',
        'DATABASE_URL': '数据库URL'
    }
    
    config = {}
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                config[key] = value
    
    missing_configs = []
    for key, description in required_configs.items():
        if not config.get(key) or config[key].strip() == '':
            missing_configs.append(description)
    
    if missing_configs:
        print("❌ 缺少以下配置:")
        for config in missing_configs:
            print(f"   - {config}")
        return False
    
    print("✅ 配置验证通过")
    return True

def show_config():
    """显示当前配置"""
    env_file = Path(".env")
    if not env_file.exists():
        print("❌ .env文件不存在")
        return
    
    print("\n📋 当前配置:")
    print("-" * 50)
    
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                if 'KEY' in key or 'PASSWORD' in key or 'SECRET' in key:
                    # 隐藏敏感信息
                    display_value = '*' * len(value) if value else '未设置'
                else:
                    display_value = value
                print(f"{key:<25} = {display_value}")

def main():
    """主函数"""
    print("🦝 JianLi Tanuki (简狸) 配置管理工具")
    print("=" * 50)
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == '--create':
            create_env_file()
        elif command == '--config':
            interactive_config()
        elif command == '--validate':
            validate_config()
        elif command == '--show':
            show_config()
        else:
            print("❌ 未知命令")
            print_help()
    else:
        print_help()

def print_help():
    """显示帮助信息"""
    print("\n📖 使用方法:")
    print("  python setup_config.py --create    创建配置文件")
    print("  python setup_config.py --config    交互式配置")
    print("  python setup_config.py --validate  验证配置")
    print("  python setup_config.py --show      显示当前配置")
    print("\n💡 建议流程:")
    print("  1. python setup_config.py --create")
    print("  2. python setup_config.py --config")
    print("  3. python setup_config.py --validate")

if __name__ == "__main__":
    main()
