"""
User Management Module
Handles user registration, login, and profile management
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from rich.console import Console

console = Console()

class User(BaseModel):
    """User model with all required fields"""
    id: str
    name: str
    age: int
    gender: str
    current_weight: float
    target_weight: float
    has_home_equipment: bool
    has_gym_access: bool
    goals: List[str]
    fitness_level: str = "beginner"
    fitness_sublevel: int = 1
    fitness_score: Optional[int] = None
    fitness_type: str = "gym"  # "gym" or "yoga"
    created_at: datetime = Field(default_factory=datetime.now)
    last_workout: Optional[datetime] = None
    workout_streak: int = 0
    total_workouts: int = 0
    calories_burned_total: float = 0.0
    # Nutrition tracking fields
    weekly_calorie_intake: float = 0.0  # Total calories consumed in the week
    weekly_calorie_burned: float = 0.0  # Total calories burned through exercise in the week
    nutrition_goal: str = "maintain"  # maintain, lose, gain
    calorie_balance_history: List[Dict] = []  # History of weekly calorie balances

class UserManager:
    """Manages user data and operations"""
    
    def __init__(self, data_file: str = "data/users.json"):
        self.data_file = data_file
        self.users: Dict[str, User] = {}
        self.backup_dir = "data/backup"
        self._ensure_data_directory()
        self._load_users()
    
    def _ensure_data_directory(self):
        """Ensure data directory exists"""
        os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
        os.makedirs(self.backup_dir, exist_ok=True)
    
    def _create_backup(self, file_path: str) -> bool:
        """Create a backup of a data file"""
        try:
            if not os.path.exists(file_path):
                return True  # No file to backup
                
            # Create timestamped backup
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = os.path.basename(file_path)
            backup_path = os.path.join(self.backup_dir, f"{filename}.{timestamp}.bak")
            
            # Copy file
            import shutil
            shutil.copy2(file_path, backup_path)
            
            # Verify backup was created successfully
            if not os.path.exists(backup_path):
                console.print("⚠️  Backup creation failed - file not found after copy", style="yellow")
                return False
            
            # Keep only last 5 backups
            self._cleanup_old_backups(file_path)
            
            console.print(f"💾 Backup created: {os.path.basename(backup_path)}", style="dim")
            return True
        except PermissionError:
            console.print("❌ Permission denied when creating backup. Check file permissions.", style="red")
            return False
        except Exception as e:
            console.print(f"⚠️  Failed to create backup: {e}", style="yellow")
            return False
    
    def _cleanup_old_backups(self, file_path: str):
        """Keep only the 5 most recent backups"""
        try:
            filename = os.path.basename(file_path)
            backup_files = []
            
            for file in os.listdir(self.backup_dir):
                if file.startswith(filename) and file.endswith('.bak'):
                    backup_files.append(os.path.join(self.backup_dir, file))
            
            # Sort by modification time and keep only recent ones
            backup_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
            
            # Remove old backups
            for old_backup in backup_files[5:]:
                try:
                    os.remove(old_backup)
                except Exception:
                    pass
        except Exception:
            pass  # Ignore backup cleanup errors
    
    def _load_users(self):
        """Load users from JSON file with improved error handling"""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                    for user_id, user_data in data.items():
                        try:
                            # Convert datetime strings back to datetime objects
                            if 'created_at' in user_data:
                                user_data['created_at'] = datetime.fromisoformat(user_data['created_at'])
                            if 'last_workout' in user_data and user_data['last_workout']:
                                user_data['last_workout'] = datetime.fromisoformat(user_data['last_workout'])
                            self.users[user_id] = User(**user_data)
                        except Exception as e:
                            console.print(f"⚠️  Skipping corrupted user data for {user_id}: {e}", style="yellow")
                            continue
            except json.JSONDecodeError as e:
                console.print(f"❌ Corrupted users.json file: {e}", style="red")
                console.print("🔧 Creating new empty users database", style="yellow")
                self.users = {}
            except Exception as e:
                console.print(f"❌ Error loading users: {e}", style="red")
                self.users = {}
    
    def _save_users(self):
        """Save users to JSON file with improved error handling"""
        try:
            # Create backup before saving
            self._create_backup(self.data_file)
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
            
            data = {}
            for user_id, user in self.users.items():
                try:
                    user_dict = user.dict()
                    # Convert datetime objects to strings
                    user_dict['created_at'] = user.created_at.isoformat()
                    if user.last_workout:
                        user_dict['last_workout'] = user.last_workout.isoformat()
                    data[user_id] = user_dict
                except Exception as e:
                    console.print(f"⚠️  Skipping user {user_id} due to serialization error: {e}", style="yellow")
                    continue
            
            with open(self.data_file, 'w') as f:
                json.dump(data, f, indent=2)
        except PermissionError:
            console.print("❌ Permission denied when saving users. Check file permissions.", style="red")
        except Exception as e:
            console.print(f"❌ Error saving users: {e}", style="red")
    
    def create_user(self, user_data: Dict) -> User:
        """Create a new user"""
        user_id = f"user_{len(self.users) + 1}_{user_data['name'].lower().replace(' ', '_')}"
        
        # Set default fitness type if not provided
        fitness_type = user_data.get('fitness_type', 'gym')
        
        user = User(
            id=user_id,
            name=user_data['name'],
            age=user_data['age'],
            gender=user_data['gender'],
            current_weight=user_data['current_weight'],
            target_weight=user_data['target_weight'],
            has_home_equipment=user_data['has_home_equipment'],
            has_gym_access=user_data['has_gym_access'],
            goals=user_data['goals'],
            fitness_type=fitness_type
        )
        
        self.users[user_id] = user
        self._save_users()
        
        console.print(f"✅ User {user.name} created successfully!", style="green")
        return user
    
    def get_user(self, username: str) -> Optional[User]:
        """Get user by name"""
        for user in self.users.values():
            if user.name.lower() == username.lower():
                return user
        return None
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return self.users.get(user_id)
    
    def list_users(self) -> List[User]:
        """List all users"""
        return list(self.users.values())
    
    def update_user(self, user: User):
        """Update user data"""
        self.users[user.id] = user
        self._save_users()
    
    def delete_user(self, user_id: str) -> bool:
        """Delete a user"""
        if user_id in self.users:
            del self.users[user_id]
            self._save_users()
            return True
        return False
    
    def get_user_stats(self, user: User) -> Dict:
        """Get user statistics"""
        return {
            "name": user.name,
            "fitness_level": user.fitness_level,
            "workout_streak": user.workout_streak,
            "total_workouts": user.total_workouts,
            "calories_burned_total": user.calories_burned_total,
            "days_since_last_workout": (datetime.now() - user.last_workout).days if user.last_workout else None,
            "weight_progress": user.current_weight - user.target_weight
        }
