from app.main import app

print("Checking registered routes...")
found_dashboard = False
found_action = False

for route in app.routes:
    if hasattr(route, "path"):
        if "/edu-agents/dashboard" in route.path:
            found_dashboard = True
            print(f"FOUND: {route.path}")
        if "/edu-agents/sim-action/" in route.path:
            found_action = True
            print(f"FOUND: {route.path}")

if found_dashboard and found_action:
    print("SUCCESS: All Education Agent routes are registered.")
else:
    print("FAILURE: Some routes are missing.")
