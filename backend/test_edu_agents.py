from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_current_user
from app.models import User

# Mock user to bypass auth
def override_get_current_user():
    return User(id=1, username="test_admin", email="admin@test.com")

app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

def test_dashboard():
    print("Testing GET /edu-agents/dashboard...")
    response = client.get("/edu-agents/dashboard")
    if response.status_code == 200:
        data = response.json()
        print(f"SUCCESS: Retrieved {len(data)} agents.")
        for agent in data:
            print(f" - {agent['name']} ({agent['status']})")
    else:
        print(f"FAILED: {response.status_code} - {response.text}")

def test_action():
    print("\nTesting POST /edu-agents/sim-action/adaptive_path...")
    response = client.post("/edu-agents/sim-action/adaptive_path")
    if response.status_code == 200:
        print(f"SUCCESS: {response.json()['action_taken']}")
    else:
        print(f"FAILED: {response.status_code} - {response.text}")

if __name__ == "__main__":
    try:
        test_dashboard()
        test_action()
    except Exception as e:
        print(f"Error: {e}")
