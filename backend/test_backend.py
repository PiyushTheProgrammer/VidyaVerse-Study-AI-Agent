import json
import sys
from fastapi.testclient import TestClient

# Add current directory to path to ensure main can be imported
sys.path.append(".")

try:
    from main import app
except ImportError as e:
    print(f"Error importing app from main.py: {e}")
    sys.exit(1)

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("RUNNING BACKEND ENDPOINT TESTS")
    print("=" * 60)

    # 1. Test Root Endpoint
    print("\n[TEST 1] Root Welcome Endpoint...")
    res = client.get("/")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print(f"[OK] Success: {res.json()}")

    # 1.5. Test Signup Endpoint to get a valid user_id
    print("\n[TEST 1.5] Registering Test User (/api/signup)...")
    import random
    test_username = f"testuser_{random.randint(1000, 9999)}"
    signup_payload = {
        "username": test_username,
        "password": "testpassword",
        "full_name": "Test Student",
        "dob": "2000-01-01",
        "mobile_no": "1234567890",
        "email": "test@example.com",
        "profile_pic_url": ""
    }
    res = client.post("/api/signup", json=signup_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    signup_data = res.json()
    user_id = signup_data["user"]["user_id"]
    print(f"[OK] Success: Registered user with ID: {user_id}")

    # 2. Test Goal Intake Endpoint
    print("\n[TEST 2] Parsing Goal Intent (/api/parse-goal)...")
    payload = {
        "user_id": user_id,
        "goal": "Build an AI Agent in 2 weeks",
        "domain": "programming",
        "current_skill_level": "Beginner",
        "target_timeline_weeks": 2
    }
    res = client.post("/api/parse-goal", json=payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert "milestones" in data, "Milestones missing in response"
    assert "tasks" in data, "Granular tasks missing in response"
    print(f"[OK] Success: Generated {len(data['milestones'])} milestones and {len(data['tasks'])} tasks.")
    print(f"  First Milestone: {data['milestones'][0]['title']}")
    print(f"  First Task: {data['tasks'][0]['title']} (Due: {data['tasks'][0]['due_date']})")

    # Store first task ID for toggle test
    task_id = data['tasks'][0]['id']

    # 3. Test Dashboard Endpoint
    print("\n[TEST 3] Fetching Dashboard Data (/api/dashboard)...")
    res = client.get(f"/api/dashboard?user_id={user_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    dash_data = res.json()
    assert dash_data["has_plan"] is True, "Expected has_plan to be True"
    assert dash_data["completion_percentage"] == 0, "Expected initial completion percentage to be 0"
    assert len(dash_data["upcoming_tasks"]) > 0, "Expected list of upcoming tasks"
    print(f"[OK] Success: Streak is {dash_data['streak']} and Completion is {dash_data['completion_percentage']}%")

    # 4. Test Toggle Task Endpoint
    print(f"\n[TEST 4] Toggling Task {task_id} to completed (/api/toggle-task)...")
    toggle_payload = {
        "user_id": user_id,
        "task_id": task_id,
        "is_completed": True
    }
    res = client.post("/api/toggle-task", json=toggle_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    toggle_data = res.json()
    # Verify that the task status is indeed changed
    task_status = next(t["is_completed"] for t in toggle_data["tasks"] if t["id"] == task_id)
    assert task_status is True, "Expected task is_completed to be True"
    print("[OK] Success: Task toggled to True.")

    # Re-verify dashboard completion percentage
    res_dash = client.get(f"/api/dashboard?user_id={user_id}")
    dash_data_updated = res_dash.json()
    print(f"  New Completion Percentage: {dash_data_updated['completion_percentage']}%")
    print(f"  New Time Spent: {dash_data_updated['time_spent']} min")

    # 5. Test Check Status (Nudge Generator)
    print("\n[TEST 5] Checking Status and Nudges (/api/check-status)...")
    res = client.get(f"/api/check-status?user_id={user_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    status_data = res.json()
    print(f"[OK] Success: Nudge Triggered: {status_data['nudge_triggered']}")
    if status_data['nudge_triggered']:
        print(f"  Coach Nudge: {status_data['nudge_message']}")

    # 6. Test Quiz Submission & Active Feedback loop (Low Score)
    print("\n[TEST 6] Submitting Practice Quiz with Failing Score < 60 (/api/save-quiz)...")
    quiz_payload = {
        "user_id": user_id,
        "score": 45.0,
        "weak_topic": "FastAPI Routing Path parameters",
        "week": 1
    }
    res = client.post("/api/save-quiz", json=quiz_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    quiz_data = res.json()
    assert quiz_data["passed"] is False, "Expected passed to be False"
    assert quiz_data["remedial_added"] is True, "Expected remedial task to be added"
    assert quiz_data["remedial_task"] is not None, "Expected remedial task details in response"
    print(f"[OK] Success: Remedial Review added: {quiz_data['remedial_task']['title']}")
    print(f"  Details: {quiz_data['remedial_task']['description']}")

    # 7. Test Quiz Submission (Passing Score)
    print("\n[TEST 7] Submitting Practice Quiz with Passing Score >= 60 (/api/save-quiz)...")
    quiz_payload_pass = {
        "user_id": user_id,
        "score": 85.0,
        "weak_topic": "None",
        "week": 1
    }
    res = client.post("/api/save-quiz", json=quiz_payload_pass)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    quiz_data_pass = res.json()
    assert quiz_data_pass["passed"] is True, "Expected passed to be True"
    assert quiz_data_pass["remedial_added"] is False, "Expected no remedial task to be added"
    print("[OK] Success: Quiz submission processed with passing status.")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
