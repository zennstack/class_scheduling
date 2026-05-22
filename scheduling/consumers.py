import json
from channels.generic.websocket import AsyncWebsocketConsumer


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Reject anonymous / unauthenticated users
        user = self.scope.get("user")
        if user is None or not user.is_authenticated:
            await self.close(code=4001)
            return

        # All authenticated users join the shared broadcast group
        self.group_name = "notifications"
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # group_name may not be set if connect() was rejected early
        group_name = getattr(self, "group_name", None)
        if group_name:
            await self.channel_layer.group_discard(
                group_name,
                self.channel_name
            )

    # Receive message from room group and forward to WebSocket client
    async def schedule_notification(self, event):
        await self.send(text_data=json.dumps({
            "type": "schedule_notification",
            "message": event.get("message", ""),
            "action": event.get("action", ""),
            "schedule_id": event.get("schedule_id"),
            "course": event.get("course", ""),
            "day": event.get("day", ""),
            "start_time": event.get("start_time", ""),
            "end_time": event.get("end_time", ""),
            "room": event.get("room", ""),
            "section": event.get("section", ""),
        }))

