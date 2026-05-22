"""
End-to-end WebSocket notification test.
Run this while daphne is running: python -m daphne -b 127.0.0.1 -p 8000 ClassScheduling.asgi:application
"""
import asyncio
import json
import requests
import websockets

BASE = "http://127.0.0.1:8000"


def get_token(username, password):
    r = requests.post(f"{BASE}/api/auth/login/", json={"username": username, "password": password})
    if r.status_code == 200:
        return r.json()["access"]
    print(f"  [!] Login failed for {username}: {r.status_code} {r.text}")
    return None


def trigger_schedule_save():
    """Log in as admin and update the first schedule via the API."""
    token = get_token("admin", "admin")
    if not token:
        return False
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE}/api/schedules/", headers=headers)
    if r.status_code != 200 or not r.json():
        print("  [!] Could not fetch schedules:", r.text)
        return False
    schedule = r.json()[0]
    sid = schedule["id"]
    print(f"  [*] Triggering update on schedule id={sid}")
    patch_r = requests.patch(f"{BASE}/api/schedules/{sid}/", json={"section": schedule.get("section", "IT3R1")}, headers=headers)
    print(f"  [*] Patch response: {patch_r.status_code}")
    return patch_r.status_code in (200, 201)


async def listen_for_notification(token, label="User"):
    uri = f"ws://127.0.0.1:8000/ws/notifications/?token={token}"
    print(f"  [{label}] Connecting...")
    try:
        async with websockets.connect(uri, open_timeout=5) as ws:
            print(f"  [{label}] Connected! Waiting for notification (10s timeout)...")
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=10)
                data = json.loads(msg)
                print(f"")
                print(f"  [PASS] [{label}] NOTIFICATION RECEIVED!")
                print(f"     Type   : {data.get('type')}")
                print(f"     Action : {data.get('action')}")
                print(f"     Message: {data.get('message')}")
                print(f"     Course : {data.get('course')}")
                print(f"     Day    : {data.get('day')}")
                print(f"     Time   : {data.get('start_time')} - {data.get('end_time')}")
                print(f"     Room   : {data.get('room')}")
                print(f"     Section: {data.get('section')}")
                return True
            except asyncio.TimeoutError:
                print(f"  [FAIL] [{label}] No notification received within 10 seconds!")
                return False
    except Exception as e:
        print(f"  [FAIL] [{label}] WebSocket connection failed: {e}")
        return False


async def main():
    print("")
    print("========================================")
    print("  WebSocket Notification End-to-End Test")
    print("========================================")
    print("")

    print("[1] Getting JWT tokens...")
    admin_token = get_token("admin", "admin")
    user_token = get_token("testuser_ws", "testpass123")

    if not admin_token and not user_token:
        print("")
        print("[FAIL] Could not get any token. Check your usernames/passwords.")
        return

    print("")
    print("[2] Connecting WebSocket clients...")

    async def run_test():
        listeners = []
        if admin_token:
            listeners.append(listen_for_notification(admin_token, "Admin"))
        if user_token:
            listeners.append(listen_for_notification(user_token, "RegularUser"))

        listen_tasks = [asyncio.create_task(l) for l in listeners]
        await asyncio.sleep(1.5)

        print("")
        print("[3] Triggering schedule update via API (admin action)...")
        trigger_schedule_save()

        results = await asyncio.gather(*listen_tasks)
        return results

    results = await run_test()

    print("")
    print("========================================")
    if all(results):
        print("  [PASS] ALL TESTS PASSED -- WebSocket works!")
    else:
        print("  [FAIL] SOME TESTS FAILED -- check output above")
    print("========================================")
    print("")


asyncio.run(main())
