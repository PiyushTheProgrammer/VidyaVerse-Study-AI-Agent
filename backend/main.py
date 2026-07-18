import os
import logging
import hashlib
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from pymongo import MongoClient

# Import our AI agent logic
from agent_logic import (
    parse_goal_intent,
    generate_curriculum_tasks,
    recalculate_plan,
    generate_nudge,
    generate_remedial_task,
    TaskItem,
    Milestone,
    has_openai,
    llm
)

load_dotenv(override=True)

# Logger configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI-Powered Personal Learning Agent API")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "personal_learning_agent")

mongo_client = None
db = None
use_mock_db = False

# Attempt 1: Configured URI
try:
    logger.info("Attempting connection to configured MongoDB...")
    mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
    mongo_client.server_info()  # Forces connection check
    db = mongo_client[DB_NAME]
    logger.info("Connected to configured MongoDB successfully!")
except Exception as e1:
    logger.warning(f"Configured MongoDB connection failed: {e1}.")
    
    # Attempt 2: Localhost fallback
    if MONGODB_URI != "mongodb://localhost:27017":
        try:
            logger.info("Attempting connection to local MongoDB fallback (mongodb://localhost:27017)...")
            mongo_client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
            mongo_client.server_info()
            db = mongo_client[DB_NAME]
            logger.info("Connected to local MongoDB fallback successfully!")
        except Exception as e2:
            logger.warning("All MongoDB connection attempts failed. Falling back to in-memory simulated database.")
            use_mock_db = True
    else:
        logger.warning("Local MongoDB connection failed. Falling back to in-memory simulated database.")
        use_mock_db = True

# In-memory Mock DB Storage
MOCK_DB = {
    "users": {},          # user_id -> user dict
    "user_progress": {},  # user_id -> progress dict
    "plans": {}           # user_id -> active plan dict
}

# Request / Response Schemas
class GoalRequest(BaseModel):
    user_id: str
    goal: str
    domain: str
    current_skill_level: str
    target_timeline_weeks: int = Field(default=4, ge=1, le=12)

class TaskToggleRequest(BaseModel):
    user_id: str
    task_id: str
    is_completed: bool

class TaskSkipRequest(BaseModel):
    user_id: str
    task_id: str
    is_skipped: bool

class DemoTriggerRequest(BaseModel):
    user_id: str
    demo_type: str

class QuizSubmission(BaseModel):
    user_id: str
    score: float = Field(..., ge=0, le=100)
    weak_topic: str
    week: int
    quiz_type: Optional[str] = "quiz"

class UserSignup(BaseModel):
    username: str
    password: str
    full_name: str
    dob: str
    mobile_no: str
    email: str
    profile_pic_url: Optional[str] = ""

class UserLogin(BaseModel):
    username: str
    password: str

class ProfileUpdate(BaseModel):
    user_id: str
    full_name: str
    dob: str
    mobile_no: str
    email: str
    profile_pic_url: Optional[str] = ""

class ChatMessage(BaseModel):
    user_id: str
    message: str

# Helpers to abstract DB operations
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_user_progress(user_id: str) -> dict:
    default_progress = {
        "user_id": user_id,
        "streak": 1,
        "last_active": datetime.utcnow().strftime("%Y-%m-%d"),
        "time_spent": 0,
        "planned_time": 0,
        "quiz_scores": [],
        "completed_tasks": 0,
        "skipped_tasks": 0,
        "missed_deadlines": 0,
        "study_hours": 0.0,
        "consistency": 100.0,
        "strong_topics": [],
        "weak_topics": [],
        "preferred_style": "Videos + Interactive Labs",
        "best_study_time": "8–10 PM",
        "decision_log": [
            "Learner Digital Twin created. Initialized custom route map for progress."
        ]
    }
    if not use_mock_db and db is not None:
        progress = db.user_progress.find_one({"user_id": user_id})
        if not progress:
            progress = default_progress
            db.user_progress.insert_one(progress)
        else:
            # Ensure new keys are present
            modified = False
            for k, v in default_progress.items():
                if k not in progress:
                    progress[k] = v
                    modified = True
            if modified:
                db.user_progress.replace_one({"user_id": user_id}, progress)
        return progress
    else:
        if user_id not in MOCK_DB["user_progress"]:
            MOCK_DB["user_progress"][user_id] = default_progress
        else:
            # Ensure new keys are present in mock
            progress = MOCK_DB["user_progress"][user_id]
            for k, v in default_progress.items():
                if k not in progress:
                    progress[k] = v
        return MOCK_DB["user_progress"][user_id]

def update_user_progress(user_id: str, progress_data: dict):
    if not use_mock_db and db is not None:
        db.user_progress.replace_one({"user_id": user_id}, progress_data, upsert=True)
    else:
        MOCK_DB["user_progress"][user_id] = progress_data

def get_active_plan(user_id: str) -> Optional[dict]:
    if not use_mock_db and db is not None:
        return db.plans.find_one({"user_id": user_id, "is_active": True})
    return MOCK_DB["plans"].get(user_id)

def save_active_plan(user_id: str, plan_data: dict):
    plan_data["user_id"] = user_id
    plan_data["is_active"] = True
    if not use_mock_db and db is not None:
        if "_id" in plan_data:
            plan_id = plan_data["_id"]
            if isinstance(plan_id, str):
                try:
                    plan_id = ObjectId(plan_id)
                except Exception:
                    pass
            update_data = dict(plan_data)
            update_data.pop("_id", None)
            db.plans.replace_one({"_id": plan_id}, update_data)
        else:
            # Deactivate old plans for this user
            db.plans.update_many({"user_id": user_id, "is_active": True}, {"$set": {"is_active": False}})
            db.plans.insert_one(plan_data)
    else:
        MOCK_DB["plans"][user_id] = plan_data



from bson import ObjectId

@app.get("/")
def read_root():
    return {"message": "AI-Powered Personal Learning Agent API is running."}

@app.post("/api/signup")
async def api_signup(payload: UserSignup):
    # Check if username exists
    if not use_mock_db and db is not None:
        existing_user = db.users.find_one({"username": payload.username})
    else:
        existing_user = next((u for u in MOCK_DB["users"].values() if u["username"] == payload.username), None)
        
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists.")
    
    user_doc = {
        "username": payload.username,
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name,
        "dob": payload.dob,
        "mobile_no": payload.mobile_no,
        "email": payload.email,
        "profile_pic_url": payload.profile_pic_url or "",
        "credits": 0
    }
    
    if not use_mock_db and db is not None:
        db.users.insert_one(user_doc)
        user_id = str(user_doc["_id"])
    else:
        user_id = "mock_user_" + str(len(MOCK_DB["users"]) + 1)
        user_doc["_id"] = user_id
        MOCK_DB["users"][user_id] = user_doc
    
    # Initialize progress documentation
    get_user_progress(user_id)
    
    return {"message": "User registered successfully", "user": serialize_user(user_doc)}

@app.post("/api/login")
async def api_login(payload: UserLogin):
    if not use_mock_db and db is not None:
        user_doc = db.users.find_one({
            "username": payload.username,
            "password_hash": hash_password(payload.password)
        })
    else:
        user_doc = next((u for u in MOCK_DB["users"].values() 
                         if u["username"] == payload.username and u["password_hash"] == hash_password(payload.password)), None)
                         
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    
    return {"message": "Login successful", "user": serialize_user(user_doc)}

@app.post("/api/profile/update")
async def api_profile_update(payload: ProfileUpdate):
    if not use_mock_db and db is not None:
        try:
            obj_id = ObjectId(payload.user_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user ID format.")
            
        user_doc = db.users.find_one({"_id": obj_id})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found.")
            
        db.users.update_one(
            {"_id": obj_id},
            {"$set": {
                "full_name": payload.full_name,
                "dob": payload.dob,
                "mobile_no": payload.mobile_no,
                "email": payload.email,
                "profile_pic_url": payload.profile_pic_url or ""
            }}
        )
        updated_user = db.users.find_one({"_id": obj_id})
    else:
        user_doc = MOCK_DB["users"].get(payload.user_id)
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found.")
        user_doc["full_name"] = payload.full_name
        user_doc["dob"] = payload.dob
        user_doc["mobile_no"] = payload.mobile_no
        user_doc["email"] = payload.email
        user_doc["profile_pic_url"] = payload.profile_pic_url or ""
        updated_user = user_doc
        
    return {"message": "Profile updated successfully", "user": serialize_user(updated_user)}

@app.post("/api/parse-goal")
async def api_parse_goal(payload: GoalRequest):
    try:
        # Step 1: Parse high-level milestones using LangChain
        parsed_milestones = parse_goal_intent(
            goal=payload.goal,
            domain=payload.domain,
            level=payload.current_skill_level,
            timeline_weeks=payload.target_timeline_weeks
        )
        
        # Step 2: Use CrewAI to generate daily actionable tasks
        tasks = generate_curriculum_tasks(parsed_milestones)
        
        # Calculate total planned minutes
        total_planned = sum(task.estimated_minutes for task in tasks)
        
        # Create plan dict
        plan_dict = {
            "goal": payload.goal,
            "domain": payload.domain,
            "current_skill_level": payload.current_skill_level,
            "target_timeline_weeks": payload.target_timeline_weeks,
            "milestones": [m.model_dump() for m in parsed_milestones.milestones],
            "tasks": [t.model_dump() for t in tasks],
            "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Save to database for this user
        save_active_plan(payload.user_id, plan_dict)
        
        # Reset progress tracker for this user
        progress = {
            "user_id": payload.user_id,
            "streak": 1,
            "last_active": datetime.utcnow().strftime("%Y-%m-%d"),
            "time_spent": 0,
            "planned_time": total_planned,
            "quiz_scores": []
        }
        update_user_progress(payload.user_id, progress)
        
        if "_id" in plan_dict:
            plan_dict["_id"] = str(plan_dict["_id"])
            
        return plan_dict
    except Exception as e:
        logger.error(f"Error in parse-goal endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard")
async def api_get_dashboard(user_id: str):
    plan = get_active_plan(user_id)
    progress = get_user_progress(user_id)
    
    # Serialize progress _id
    if "_id" in progress:
        progress["_id"] = str(progress["_id"])
        
    if not plan:
        return {
            "has_plan": False,
            "streak": progress["streak"],
            "time_spent": progress["time_spent"],
            "planned_time": progress["planned_time"],
            "completion_percentage": 0,
            "upcoming_tasks": [],
            "progress": progress
        }
        
    tasks = plan.get("tasks", [])
    completed_tasks = [t for t in tasks if t.get("is_completed", False)]
    completion_percentage = int((len(completed_tasks) / len(tasks)) * 100) if tasks else 0
    upcoming_tasks = [t for t in tasks if not t.get("is_completed", False)]
    
    clean_plan = dict(plan)
    if "_id" in clean_plan:
        clean_plan["_id"] = str(clean_plan["_id"])
        
    return {
        "has_plan": True,
        "plan": clean_plan,
        "streak": progress["streak"],
        "time_spent": progress["time_spent"],
        "planned_time": progress["planned_time"],
        "completion_percentage": completion_percentage,
        "upcoming_tasks": upcoming_tasks[:5],
        "total_tasks_count": len(tasks),
        "completed_tasks_count": len(completed_tasks),
        "progress": progress
    }

@app.post("/api/toggle-task")
async def api_toggle_task(payload: TaskToggleRequest):
    plan = get_active_plan(payload.user_id)
    if not plan:
        raise HTTPException(status_code=404, detail="No active plan found.")
        
    tasks = plan.get("tasks", [])
    task_found = False
    task_minutes = 0
    
    task_title = ""
    for t in tasks:
        if t["id"] == payload.task_id:
            task_title = t.get("title", "Task")
            if not t["is_completed"] and payload.is_completed:
                task_minutes = t.get("estimated_minutes", 60)
            elif t["is_completed"] and not payload.is_completed:
                task_minutes = -t.get("estimated_minutes", 60)
                
            t["is_completed"] = payload.is_completed
            task_found = True
            break
            
    if not task_found:
        raise HTTPException(status_code=404, detail=f"Task with ID {payload.task_id} not found.")
        
    save_active_plan(payload.user_id, plan)
    
    progress = get_user_progress(payload.user_id)
    progress["time_spent"] = max(0, progress["time_spent"] + task_minutes)
    progress["study_hours"] = round(progress["time_spent"] / 60.0, 1)
    
    # Calculate completed task count
    progress["completed_tasks"] = len([t for t in tasks if t.get("is_completed", False)])
    
    # Count missed deadlines
    missed_count = 0
    today_dt = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    for t in tasks:
        if not t.get("is_completed", False) and not t.get("is_skipped", False):
            try:
                due_dt = datetime.strptime(t.get("due_date", ""), "%Y-%m-%d")
                if due_dt < today_dt:
                    missed_count += 1
            except:
                pass
    progress["missed_deadlines"] = missed_count
    
    # Calculate consistency
    total_metrics = progress["completed_tasks"] + progress["skipped_tasks"] + progress["missed_deadlines"]
    progress["consistency"] = round((progress["completed_tasks"] / max(1, total_metrics)) * 100, 1)
    
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    last_active_str = progress.get("last_active")
    
    if last_active_str != today_str and payload.is_completed:
        try:
            last_active_dt = datetime.strptime(last_active_str, "%Y-%m-%d")
            delta = datetime.utcnow() - last_active_dt
            if delta.days <= 1:
                progress["streak"] += 1
            else:
                progress["streak"] = 1
        except Exception:
            progress["streak"] = 1
        progress["last_active"] = today_str
        
    # Log task completion decision
    action_type = "Completed" if payload.is_completed else "Uncompleted"
    progress["decision_log"].append(
        f"{action_type} task '{task_title}'. Updated metrics: Consistency={progress['consistency']}%, Streak={progress['streak']} days."
    )
    
    update_user_progress(payload.user_id, progress)
    
    if "_id" in plan:
        plan["_id"] = str(plan["_id"])
        
    if "_id" in progress:
        progress["_id"] = str(progress["_id"])
        
    return {"message": "Task status updated", "tasks": plan["tasks"], "progress": progress}

@app.post("/api/skip-task")
async def api_skip_task(payload: TaskSkipRequest):
    plan = get_active_plan(payload.user_id)
    if not plan:
        raise HTTPException(status_code=404, detail="No active plan found.")
        
    tasks = plan.get("tasks", [])
    task_found = False
    task_title = ""
    
    for t in tasks:
        if t["id"] == payload.task_id:
            task_title = t.get("title", "Task")
            t["is_skipped"] = payload.is_skipped
            # If skipping a task, it shouldn't be marked completed
            if payload.is_skipped:
                t["is_completed"] = False
            task_found = True
            break
            
    if not task_found:
        raise HTTPException(status_code=404, detail=f"Task with ID {payload.task_id} not found.")
        
    save_active_plan(payload.user_id, plan)
    
    progress = get_user_progress(payload.user_id)
    
    # Calculate counts
    progress["skipped_tasks"] = len([t for t in tasks if t.get("is_skipped", False)])
    progress["completed_tasks"] = len([t for t in tasks if t.get("is_completed", False)])
    
    # Count missed deadlines
    missed_count = 0
    today_dt = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    for t in tasks:
        if not t.get("is_completed", False) and not t.get("is_skipped", False):
            try:
                due_dt = datetime.strptime(t.get("due_date", ""), "%Y-%m-%d")
                if due_dt < today_dt:
                    missed_count += 1
            except:
                pass
    progress["missed_deadlines"] = missed_count
    
    # Calculate consistency
    total_metrics = progress["completed_tasks"] + progress["skipped_tasks"] + progress["missed_deadlines"]
    progress["consistency"] = round((progress["completed_tasks"] / max(1, total_metrics)) * 100, 1)
    
    # Log task skip decision
    action_type = "Skipped" if payload.is_skipped else "Unskipped"
    progress["decision_log"].append(
        f"{action_type} task '{task_title}'. Updated Digital Twin: Consistency={progress['consistency']}%, Skipped Tasks Count={progress['skipped_tasks']}."
    )
    
    update_user_progress(payload.user_id, progress)
    
    if "_id" in plan:
        plan["_id"] = str(plan["_id"])
        
    if "_id" in progress:
        progress["_id"] = str(progress["_id"])
        
    return {"message": "Task skip status updated", "tasks": plan["tasks"], "progress": progress}

@app.get("/api/check-status")
async def api_check_status(user_id: str):
    plan = get_active_plan(user_id)
    if not plan:
        return {"nudge_triggered": False, "message": "No active plan to monitor."}
        
    progress = get_user_progress(user_id)
    last_active_str = progress.get("last_active")
    days_inactive = 0
    if last_active_str:
        try:
            last_active_dt = datetime.strptime(last_active_str, "%Y-%m-%d")
            days_inactive = (datetime.utcnow() - last_active_dt).days
        except Exception:
            pass
            
    recent_quiz_score = None
    scores = progress.get("quiz_scores", [])
    avg_score = 0
    if scores:
        recent_quiz_score = scores[-1]["score"]
        avg_score = int(sum(q["score"] for q in scores) / len(scores))
        
    # Check if project work is delayed (due date is in the past for incomplete, non-skipped project tasks)
    project_delayed = False
    tasks = plan.get("tasks", [])
    today_dt = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    for t in tasks:
        if not t.get("is_completed", False) and not t.get("is_skipped", False):
            title_lower = t.get("title", "").lower()
            desc_lower = t.get("description", "").lower()
            if "project" in title_lower or "app" in title_lower or "build" in title_lower or "create" in title_lower:
                try:
                    due_dt = datetime.strptime(t.get("due_date", ""), "%Y-%m-%d")
                    if due_dt < today_dt:
                        project_delayed = True
                        break
                except:
                    pass

    inactivity_trigger = days_inactive >= 3
    performance_trigger = recent_quiz_score is not None and recent_quiz_score < 60
    daily_study_trigger = days_inactive <= 1 and progress.get("streak", 1) >= 2
    project_delay_trigger = project_delayed and not inactivity_trigger
    
    nudge_triggered = inactivity_trigger or performance_trigger or daily_study_trigger or project_delay_trigger
    nudge = ""
    recalculation_done = False
    
    if nudge_triggered:
        nudge = generate_nudge(
            goal=plan.get("goal", ""),
            domain=plan.get("domain", ""),
            days_inactive=days_inactive,
            streak=progress.get("streak", 1),
            weak_topics=progress.get("weak_topics", []),
            strong_topics=progress.get("strong_topics", []),
            project_delayed=project_delayed,
            avg_score=avg_score,
            recent_quiz_score=recent_quiz_score
        )
        
        if inactivity_trigger:
            task_objects = [TaskItem(**t) for t in plan.get("tasks", [])]
            completed_ids = [t["id"] for t in plan.get("tasks", []) if t.get("is_completed", False)]
            updated_tasks = recalculate_plan(task_objects, completed_ids, days_to_shift=3)
            plan["tasks"] = [t.model_dump() for t in updated_tasks]
            save_active_plan(user_id, plan)
            recalculation_done = True
            
            # Reset active time to today and document recalculation route
            progress["last_active"] = datetime.utcnow().strftime("%Y-%m-%d")
            progress["decision_log"].append(
                f"Inactivity Recalculation Triggered: student inactive for {days_inactive} days. "
                "Recalculating plan: shifted future task deadlines forward by 3 days to keep user on track."
            )
            update_user_progress(user_id, progress)
            
    return {
        "nudge_triggered": nudge_triggered,
        "nudge_message": nudge,
        "days_inactive": days_inactive,
        "recent_quiz_score": recent_quiz_score,
        "recalculation_done": recalculation_done,
        "tasks": plan["tasks"] if recalculation_done else None
    }

@app.post("/api/save-quiz")
async def api_save_quiz(payload: QuizSubmission):
    plan = get_active_plan(payload.user_id)
    if not plan:
        raise HTTPException(status_code=404, detail="No active plan found.")
        
    progress = get_user_progress(payload.user_id)
    quiz_entry = {
        "score": payload.score,
        "topic": payload.weak_topic,
        "week": payload.week,
        "quiz_type": payload.quiz_type or "quiz",
        "date": datetime.utcnow().strftime("%Y-%m-%d")
    }
    progress["quiz_scores"].append(quiz_entry)
    
    # Update strong/weak topics and append log
    session_label = "Weekly Test" if payload.quiz_type == "test" else "Practice Quiz"
    if payload.score < 60:
        if payload.weak_topic not in progress["weak_topics"]:
            progress["weak_topics"].append(payload.weak_topic)
        if payload.weak_topic in progress["strong_topics"]:
            progress["strong_topics"].remove(payload.weak_topic)
        progress["decision_log"].append(
            f"Active Feedback Loop: Student scored {payload.score}% on {payload.weak_topic} {session_label}. "
            f"Updating Digital Twin: added remedial review task, injected alternative resources, delayed next milestone, and shifted subsequent tasks forward by 2 days."
        )
    else:
        if payload.weak_topic not in progress["strong_topics"]:
            progress["strong_topics"].append(payload.weak_topic)
        if payload.weak_topic in progress["weak_topics"]:
            progress["weak_topics"].remove(payload.weak_topic)
        progress["decision_log"].append(
            f"Active Feedback Loop: Student achieved mastery ({payload.score}%) on {payload.weak_topic} {session_label}. "
            f"Updating Digital Twin: recorded strong skill topic, route status clear, next milestone schedule locked."
        )
        
    update_user_progress(payload.user_id, progress)
    
    # Award 50 credits/points to user document in database
    if not use_mock_db and db is not None:
        try:
            obj_id = ObjectId(payload.user_id)
            db.users.update_one({"_id": obj_id}, {"$inc": {"credits": 50}})
            updated_user = db.users.find_one({"_id": obj_id})
        except Exception as e:
            logger.error(f"Failed to award user credits: {e}")
            updated_user = None
    else:
        updated_user = MOCK_DB["users"].get(payload.user_id)
        if updated_user:
            updated_user["credits"] = updated_user.get("credits", 0) + 50
        
    remedial_added = False
    new_remedial_task = None
    
    if payload.score < 60:
        target_date = (datetime.utcnow() + timedelta(days=2)).strftime("%Y-%m-%d")
        new_task = generate_remedial_task(
            goal=plan.get("goal", ""),
            weak_topic=payload.weak_topic,
            week=payload.week,
            target_date=target_date
        )
        
        # Add alternative content links inside description
        alternative_resources = (
            f"\n\n**Recommended Alternative Content:**\n"
            f"- [Documentation on {payload.weak_topic}](https://www.google.com/search?q={payload.weak_topic.replace(' ', '+')}+documentation)\n"
            f"- [Short Video Tutorial for {payload.weak_topic}](https://www.youtube.com/results?search_query={payload.weak_topic.replace(' ', '+')})\n"
            f"- [Quick Interactive Guide](https://devdocs.io/)"
        )
        new_task.description += alternative_resources
        
        # Shift subsequent tasks forward by 2 days to delay next milestone
        task_objects = [TaskItem(**t) for t in plan.get("tasks", [])]
        completed_ids = [t["id"] for t in plan.get("tasks", []) if t.get("is_completed", False)]
        shifted_tasks = recalculate_plan(task_objects, completed_ids, days_to_shift=2)
        
        plan["tasks"] = [t.model_dump() for t in shifted_tasks]
        plan["tasks"].append(new_task.model_dump())
        progress["planned_time"] += new_task.estimated_minutes
        
        save_active_plan(payload.user_id, plan)
        update_user_progress(payload.user_id, progress)
        
        remedial_added = True
        new_remedial_task = new_task.model_dump()
        
    if "_id" in plan:
        plan["_id"] = str(plan["_id"])
        
    credits = updated_user.get("credits", 0) if updated_user else 0
    
    return {
        "score": payload.score,
        "passed": payload.score >= 60,
        "remedial_added": remedial_added,
        "remedial_task": new_remedial_task,
        "plan": plan,
        "credits_awarded": 50,
        "total_credits": credits
    }

@app.get("/api/parent-report")
async def api_parent_report(user_id: str):
    plan = get_active_plan(user_id)
    progress = get_user_progress(user_id)
    
    user_doc = None
    if not use_mock_db and db is not None:
        try:
            user_doc = db.users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            pass
    else:
        user_doc = MOCK_DB["users"].get(user_id)
        
    full_name = user_doc.get("full_name", "Student") if user_doc else "Student"
    credits = user_doc.get("credits", 0) if user_doc else 0
    
    quiz_scores = progress.get("quiz_scores", [])
    avg_score = 0
    if quiz_scores:
        avg_score = round(sum(q["score"] for q in quiz_scores) / len(quiz_scores), 1)
        
    completed_tasks_count = 0
    total_tasks_count = 0
    if plan:
        tasks = plan.get("tasks", [])
        total_tasks_count = len(tasks)
        completed_tasks_count = len([t for t in tasks if t.get("is_completed", False)])
        
    return {
        "full_name": full_name,
        "credits": credits,
        "quiz_history": quiz_scores,
        "average_score": avg_score,
        "weak_topics": progress.get("weak_topics", []),
        "strong_topics": progress.get("strong_topics", []),
        "decision_log": progress.get("decision_log", []),
        "completed_tasks": progress.get("completed_tasks", completed_tasks_count),
        "skipped_tasks": progress.get("skipped_tasks", 0),
        "missed_deadlines": progress.get("missed_deadlines", 0),
        "study_hours": progress.get("study_hours", round(progress.get("time_spent", 0) / 60, 1)),
        "consistency": progress.get("consistency", 100.0),
        "tasks_completed": completed_tasks_count,
        "total_tasks": total_tasks_count,
        "time_spent": progress.get("time_spent", 0),
        "planned_time": progress.get("planned_time", 0),
        "streak": progress.get("streak", 0),
        "goal": plan.get("goal", "") if plan else "",
        "domain": plan.get("domain", "") if plan else "",
        "current_skill_level": plan.get("current_skill_level", "") if plan else "",
        "study_time_preference": progress.get("best_study_time", "8–10 PM")
    }

class RecalculateRequest(BaseModel):
    user_id: str
    days: int

@app.post("/api/demo-trigger")
async def api_demo_trigger(payload: DemoTriggerRequest):
    plan = get_active_plan(payload.user_id)
    progress = get_user_progress(payload.user_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Please create a learning goal plan first to run demos.")
        
    nudge_message = ""
    recalculation_done = False
    
    # CASE 1: Inactivity (3+ days)
    if payload.demo_type == "case1":
        progress["streak"] = 1
        three_days_ago = (datetime.utcnow() - timedelta(days=3)).strftime("%Y-%m-%d")
        progress["last_active"] = three_days_ago
        update_user_progress(payload.user_id, progress)
        
        task_objects = [TaskItem(**t) for t in plan.get("tasks", [])]
        completed_ids = [t["id"] for t in plan.get("tasks", []) if t.get("is_completed", False)]
        updated_tasks = recalculate_plan(task_objects, completed_ids, days_to_shift=3)
        plan["tasks"] = [t.model_dump() for t in updated_tasks]
        save_active_plan(payload.user_id, plan)
        recalculation_done = True
        
        nudge_message = generate_nudge(
            goal=plan.get("goal", ""),
            domain=plan.get("domain", ""),
            days_inactive=3,
            streak=1,
            weak_topics=progress.get("weak_topics", []),
            strong_topics=progress.get("strong_topics", []),
            project_delayed=False,
            avg_score=0
        )
        
        progress["decision_log"].append(
            "Judge Demo Trigger: Simulated 3-day inactivity. "
            "Google Maps recalculation active: shifted all subsequent task deadlines forward by 3 days."
        )
        progress["last_active"] = datetime.utcnow().strftime("%Y-%m-%d")
        update_user_progress(payload.user_id, progress)

    # CASE 2: Daily Study (streak >= 5)
    elif payload.demo_type == "case2":
        progress["streak"] = 5
        progress["last_active"] = datetime.utcnow().strftime("%Y-%m-%d")
        update_user_progress(payload.user_id, progress)
        
        nudge_message = generate_nudge(
            goal=plan.get("goal", ""),
            domain=plan.get("domain", ""),
            days_inactive=0,
            streak=5,
            weak_topics=progress.get("weak_topics", []),
            strong_topics=progress.get("strong_topics", []),
            project_delayed=False,
            avg_score=85
        )
        progress["decision_log"].append(
            "Judge Demo Trigger: Simulated Case 2 (Daily Study Streak). "
            "Coach reinforced consistency: recorded learning streak of 5 days."
        )
        update_user_progress(payload.user_id, progress)

    # CASE 3: Postponed Project Work
    elif payload.demo_type == "case3":
        tasks = plan.get("tasks", [])
        modified = False
        yesterday_str = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
        
        for t in tasks:
            title_lower = t.get("title", "").lower()
            if "project" in title_lower or "app" in title_lower or "build" in title_lower:
                t["due_date"] = yesterday_str
                t["is_completed"] = False
                t["is_skipped"] = False
                modified = True
                break
                
        if not modified and tasks:
            for t in tasks:
                if not t.get("is_completed", False):
                    t["title"] = "Project Milestone: Core Build Setup"
                    t["due_date"] = yesterday_str
                    t["is_skipped"] = False
                    modified = True
                    break
                    
        save_active_plan(payload.user_id, plan)
        
        scores = progress.get("quiz_scores", [])
        avg_score = int(sum(q["score"] for q in scores) / len(scores)) if scores else 85
        
        nudge_message = generate_nudge(
            goal=plan.get("goal", ""),
            domain=plan.get("domain", ""),
            days_inactive=0,
            streak=progress.get("streak", 1),
            weak_topics=progress.get("weak_topics", []),
            strong_topics=progress.get("strong_topics", []),
            project_delayed=True,
            avg_score=avg_score
        )
        progress["decision_log"].append(
            "Judge Demo Trigger: Simulated Case 3 (Postponed Projects). "
            "Coach warned student: detected strong quizzes but overdue project milestones."
        )
        update_user_progress(payload.user_id, progress)

    # FAIL QUIZ: Active Feedback Loop Recalculation
    elif payload.demo_type == "fail_quiz":
        weak_topic = "VPC & Networking"
        week = plan.get("milestones", [{}])[0].get("week", 1)
        
        quiz_entry = {
            "score": 35.0,
            "topic": weak_topic,
            "week": week,
            "quiz_type": "quiz",
            "date": datetime.utcnow().strftime("%Y-%m-%d")
        }
        progress["quiz_scores"].append(quiz_entry)
        if weak_topic not in progress["weak_topics"]:
            progress["weak_topics"].append(weak_topic)
        if weak_topic in progress["strong_topics"]:
            progress["strong_topics"].remove(weak_topic)
            
        progress["decision_log"].append(
            f"Active Feedback Loop: Student scored 35% on {weak_topic} Practice Quiz. "
            f"Updating Digital Twin: added remedial review task, injected alternative resources, delayed next milestone, and shifted subsequent tasks forward by 2 days."
        )
        
        target_date = (datetime.utcnow() + timedelta(days=2)).strftime("%Y-%m-%d")
        new_task = generate_remedial_task(goal=plan.get("goal", ""), weak_topic=weak_topic, week=week, target_date=target_date)
        alternative_resources = (
            f"\n\n**Recommended Alternative Content:**\n"
            f"- [Documentation on {weak_topic}](https://www.google.com/search?q={weak_topic.replace(' ', '+')}+documentation)\n"
            f"- [Short Video Tutorial for {weak_topic}](https://www.youtube.com/results?search_query={weak_topic.replace(' ', '+')})\n"
            f"- [Quick Interactive Guide](https://devdocs.io/)"
        )
        new_task.description += alternative_resources
        
        task_objects = [TaskItem(**t) for t in plan.get("tasks", [])]
        completed_ids = [t["id"] for t in plan.get("tasks", []) if t.get("is_completed", False)]
        shifted_tasks = recalculate_plan(task_objects, completed_ids, days_to_shift=2)
        
        plan["tasks"] = [t.model_dump() for t in shifted_tasks]
        plan["tasks"].append(new_task.model_dump())
        progress["planned_time"] += new_task.estimated_minutes
        
        save_active_plan(payload.user_id, plan)
        update_user_progress(payload.user_id, progress)
        recalculation_done = True
        nudge_message = f"Quiz Result: 35%. Active Feedback Loop triggered. A remedial task has been added to Week {week} checklist, alternative docs links provided, and subsequent milestones shifted."

    # PASS QUIZ: Mastery Upgrade
    elif payload.demo_type == "pass_quiz":
        strong_topic = "Core Functions"
        week = plan.get("milestones", [{}])[0].get("week", 1)
        
        quiz_entry = {
            "score": 95.0,
            "topic": strong_topic,
            "week": week,
            "quiz_type": "quiz",
            "date": datetime.utcnow().strftime("%Y-%m-%d")
        }
        progress["quiz_scores"].append(quiz_entry)
        if strong_topic not in progress["strong_topics"]:
            progress["strong_topics"].append(strong_topic)
        if strong_topic in progress["weak_topics"]:
            progress["weak_topics"].remove(strong_topic)
            
        progress["decision_log"].append(
            f"Active Feedback Loop: Student achieved mastery (95%) on {strong_topic} Practice Quiz. "
            f"Updating Digital Twin: recorded strong skill topic, route status clear, next milestone schedule locked."
        )
        update_user_progress(payload.user_id, progress)
        nudge_message = f"Quiz Result: 95%. Demonstrated mastery! Topic added to Strong Concepts list, +50 Credits awarded."
        
    if "_id" in plan:
        plan["_id"] = str(plan["_id"])
        
    if "_id" in progress:
        progress["_id"] = str(progress["_id"])
        
    return {
        "nudge_triggered": True,
        "nudge_message": nudge_message,
        "recalculation_done": recalculation_done,
        "plan": plan,
        "progress": progress
    }

@app.post("/api/recalculate")
async def api_recalculate(payload: RecalculateRequest):
    plan = get_active_plan(payload.user_id)
    if not plan:
        raise HTTPException(status_code=404, detail="No active plan found.")
        
    task_objects = [TaskItem(**t) for t in plan.get("tasks", [])]
    completed_ids = [t["id"] for t in plan.get("tasks", []) if t.get("is_completed", False)]
    updated_tasks = recalculate_plan(task_objects, completed_ids, days_to_shift=payload.days)
    plan["tasks"] = [t.model_dump() for t in updated_tasks]
    save_active_plan(payload.user_id, plan)
    
    if "_id" in plan:
        plan["_id"] = str(plan["_id"])
        
    return {"message": f"Tasks shifted forward by {payload.days} days", "plan": plan}

KNOWLEDGE_BASE = {
    "control flow": (
        "### Control Flow Statements in Python & FastAPI\n\n"
        "Control flow refers to the order in which individual statements or instructions are executed in a program. "
        "In Python, this is managed using conditional statements (`if`, `elif`, `else`) and loops (`for`, `while`).\n\n"
        "#### Control Flow in FastAPI Endpoints\n"
        "In web APIs like FastAPI, control flow is typically used inside **path operations** to check request inputs, validate permissions, or query databases:\n"
        "```python\n"
        "from fastapi import FastAPI, HTTPException\n\n"
        "app = FastAPI()\n\n"
        "@app.get('/items/{item_id}')\n"
        "async def read_item(item_id: int, q: str = None):\n"
        "    # Control Flow: validation check\n"
        "    if item_id < 0:\n"
        "        raise HTTPException(status_code=400, detail='Item ID must be positive')\n"
        "    \n"
        "    # Control Flow: conditional processing\n"
        "    if q:\n"
        "        return {'item_id': item_id, 'query': q, 'status': 'custom search'}\n"
        "    else:\n"
        "        return {'item_id': item_id, 'status': 'default fetch'}\n"
        "```\n\n"
        "What specific feature (like loop iterations or error raising) would you like to discuss next?"
    ),
    "fastapi": (
        "### FastAPI Web Framework\n\n"
        "**FastAPI** is a modern, high-performance web framework for building APIs with Python 3.8+ based on standard Python type hints.\n\n"
        "#### Key Strengths of FastAPI:\n"
        "- **Speed**: Very fast performance, on par with NodeJS and Go (thanks to Starlette and Pydantic).\n"
        "- **Automatic Documentation**: Generates interactive Swagger UI (`/docs`) and ReDoc (`/redoc`) APIs automatically.\n"
        "- **Type Safety**: Automatic query/path parameter parsing and response validation using Pydantic schemas.\n\n"
        "#### Basic Code Structure:\n"
        "```python\n"
        "from fastapi import FastAPI\n\n"
        "app = FastAPI()\n\n"
        "@app.get('/')\n"
        "def home():\n"
        "    return {'message': 'Hello, World!'}\n"
        "```\n"
        "You can run this using Uvicorn: `uvicorn main:app --reload`.\n\n"
        "What specific feature of FastAPI (like query parameters, post bodies, or database integration) would you like to explore?"
    ),
    "list": (
        "### Python Lists Syntax & Operations\n\n"
        "A **list** is a mutable, ordered collection of items in Python. It can store elements of different data types and is defined using square brackets `[]`.\n\n"
        "#### Basic List Operations:\n"
        "```python\n"
        "# 1. Declaration\n"
        "languages = ['Python', 'JavaScript', 'Go']\n\n"
        "# 2. Appending elements\n"
        "languages.append('Rust')  # ['Python', 'JavaScript', 'Go', 'Rust']\n\n"
        "# 3. Slicing lists\n"
        "subset = languages[0:2]   # ['Python', 'JavaScript']\n\n"
        "# 4. List Comprehension (highly optimized)\n"
        "upper_langs = [lang.upper() for lang in languages]\n"
        "# ['PYTHON', 'JAVASCRIPT', 'GO', 'RUST']\n"
        "```\n\n"
        "Do you want to know about sorting lists, removing items, or nested list comprehensions?"
    ),
    "pandas": (
        "### Data Manipulation with Pandas\n\n"
        "**Pandas** is the primary Python library used for tabular data analysis and manipulation. It provides two main data structures: **Series** (1D) and **DataFrame** (2D).\n\n"
        "#### Common Pandas Code Snippets:\n"
        "```python\n"
        "import pandas as pd\n\n"
        "# Load a dataset\n"
        "df = pd.read_csv('students.csv')\n\n"
        "# Filter rows\n"
        "passing_students = df[df['score'] >= 60]\n\n"
        "# Group by and compute mean\n"
        "avg_by_domain = df.groupby('domain')['score'].mean()\n"
        "print(avg_by_domain)\n"
        "```\n\n"
        "Let me know if you would like an explanation on handling missing values, joining tables, or exporting data."
    ),
    "react": (
        "### React Frontend Development\n\n"
        "**React** is a popular component-based JavaScript library for building user interfaces. It uses a virtual DOM to optimize rendering speed.\n\n"
        "#### Core Hooks in React:\n"
        "- **useState**: Tracks local variable state changes within a component.\n"
        "- **useEffect**: Executes side-effects (e.g. data fetching, event listeners, theme updates) when dependency values change.\n"
        "- **useRef**: References DOM nodes or stores persistent mutable values without triggering re-renders.\n\n"
        "#### Example React Component:\n"
        "```jsx\n"
        "import React, { useState } from 'react';\n\n"
        "function Counter() {\n"
        "  const [count, setCount] = useState(0);\n"
        "  return (\n"
        "    <button onClick={() => setCount(count + 1)}>\n"
        "      Clicked {count} times\n"
        "    </button>\n"
        "  );\n"
        "}\n"
        "```\n\n"
        "Would you like to know more about React props, custom hooks, or state sharing?"
    ),
    "tailwind": (
        "### Styling with Tailwind CSS\n\n"
        "**Tailwind CSS** is a utility-first CSS framework that allows developers to style web pages by applying pre-defined utility classes directly to HTML/JSX tags.\n\n"
        "#### Basic Utility Classes:\n"
        "- `flex flex-col items-center justify-between`: Establishes a flexbox container layout.\n"
        "- `bg-slate-50 text-slate-800`: Background color and text color utilities.\n"
        "- `p-4 rounded-xl border border-slate-200`: Padding, border radius, and border colors.\n"
        "- `hover:scale-105 transition-all duration-300`: Micro-interaction utility class.\n\n"
        "Would you like to see how to create a responsive grid or set up dark mode using Tailwind CSS?"
    ),
    "mongodb": (
        "### MongoDB Database Integration\n\n"
        "**MongoDB** is a document-oriented NoSQL database that stores data as JSON-like documents. It is highly scalable and fits well with Python applications.\n\n"
        "#### Basic PyMongo Queries:\n"
        "```python\n"
        "from pymongo import MongoClient\n\n"
        "client = MongoClient('mongodb://localhost:27017')\n"
        "db = client['learning_db']\n\n"
        "# Insert Document\n"
        "db.users.insert_one({'name': 'Alice', 'credits': 100})\n\n"
        "# Query Document\n"
        "user = db.users.find_one({'name': 'Alice'})\n"
        "print(user['credits'])  # 100\n"
        "```\n\n"
        "Do you need details on aggregate pipelines, indexing, or updating nested sub-document arrays?"
    ),
    "design": (
        "### UI/UX Design Principles\n\n"
        "Good design focuses on usability, clarity, and visual aesthetics. Key Gestalt principles include:\n"
        "- **Law of Proximity**: Elements placed close to each other are perceived as related.\n"
        "- **Contrast**: Using color, scale, or weight differences to emphasize important items (e.g. key actions).\n"
        "- **Visual Hierarchy**: Guiding the user's eye from the most critical elements down to details using typography sizes.\n\n"
        "Let me know if you would like information on grid systems, dark mode palettes, or typography selection."
    )
}

@app.post("/api/chat")
async def api_chat(payload: ChatMessage):
    plan = get_active_plan(payload.user_id)
    goal_context = f"The student's active goal is '{plan['goal']}' in the domain '{plan['domain']}' at a '{plan['current_skill_level']}' level." if plan else "The student hasn't configured a learning plan yet."
    
    # 1. Normalize query
    msg = payload.message.lower()
    
    # 2. Key matching logic
    matched_key = None
    if "control flow" in msg or "flow statement" in msg or "conditional" in msg or "if statement" in msg or "loop" in msg:
        matched_key = "control flow"
    elif "fastapi" in msg or "fast api" in msg or "uvicorn" in msg:
        matched_key = "fastapi"
    elif "list" in msg or "array" in msg:
        matched_key = "list"
    elif "pandas" in msg or "dataframe" in msg:
        matched_key = "pandas"
    elif "react" in msg or "hook" in msg or "useeffect" in msg or "usestate" in msg:
        matched_key = "react"
    elif "tailwind" in msg or "css" in msg or "style" in msg or "styling" in msg:
        matched_key = "tailwind"
    elif "mongodb" in msg or "database" in msg or "pymongo" in msg or "nosql" in msg:
        matched_key = "mongodb"
    elif "design" in msg or "ui" in msg or "ux" in msg or "figma" in msg or "layout" in msg or "typography" in msg:
        matched_key = "design"
        
    progress = get_user_progress(payload.user_id)
    
    # 3. Follow-up state retrieval
    is_followup = any(x in msg for x in ["explain", "describe", "elaborate", "tell me more", "show example", "that topic", "what is that", "tell me something about"])
    if is_followup and not matched_key:
        matched_key = progress.get("last_topic")
        
    if matched_key:
        # Save last topic in progress
        progress["last_topic"] = matched_key
        update_user_progress(payload.user_id, progress)
        return {"reply": KNOWLEDGE_BASE[matched_key]}
        
    # 4. Try LLM if no direct syllabus match
    if has_openai and llm:
        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            messages = [
                SystemMessage(content=(
                    "You are a friendly, encouraging AI Study Coach on the Antigravity Learn platform. "
                    "Help the student with their queries, explain concepts simply, and keep them motivated. "
                    f"Context: {goal_context}"
                )),
                HumanMessage(content=payload.message)
            ]
            response = llm.invoke(messages)
            return {"reply": response.content}
        except Exception as e:
            logger.error(f"Error in chat endpoint: {e}. Falling back to offline simulated coach.")
            
    # 5. Domain-specific context fallback
    goal = plan.get("goal", "your syllabus") if plan else "your syllabus"
    domain = plan.get("domain", "programming") if plan else "programming"
    return {"reply": (
        f"I'm operating in offline tutor mode right now! That is a great query related to {domain} and '{goal}'.\n\n"
        f"You can ask me to explain core syllabus topics like **FastAPI**, **Control Flow Statements**, "
        f"**Python Lists**, **Pandas**, **React Hooks**, **Tailwind CSS**, or **MongoDB**!"
    )}

def serialize_user(user_doc) -> dict:
    return {
        "user_id": str(user_doc["_id"]),
        "username": user_doc["username"],
        "full_name": user_doc["full_name"],
        "dob": user_doc["dob"],
        "mobile_no": user_doc["mobile_no"],
        "email": user_doc["email"],
        "profile_pic_url": user_doc.get("profile_pic_url", ""),
        "credits": user_doc.get("credits", 0)
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)

