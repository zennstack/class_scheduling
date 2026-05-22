import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # We can add them to a group "notifications"
        self.group_name = "notifications"
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # Receive message from room group
    async def schedule_notification(self, event):
        message = event["message"]
        action = event.get("action")
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "type": "schedule_notification",
            "message": message,
            "action": action
        }))
