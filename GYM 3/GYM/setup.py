#!/usr/bin/env python3
"""
Setup script for Gym AI CLI
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    print("📦 Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ All packages installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing packages: {e}")
        return False

def create_directories():
    """Create necessary directories"""
    print("📁 Creating data directories...")
    directories = [
        "data",
        "data/progress_charts"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✅ Created directory: {directory}")

def main():
    """Main setup function"""
    print("🏋️  Gym AI CLI Setup")
    print("=" * 30)
    
    # Create directories
    create_directories()
    
    # Install requirements
    if install_requirements():
        print("\n🎉 Setup completed successfully!")
        print("\nTo run the application:")
        print("python main.py")
    else:
        print("\n❌ Setup failed. Please check the error messages above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
