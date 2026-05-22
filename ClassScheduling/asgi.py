"""
ASGI config for ClassScheduling project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ClassScheduling.settings')
django.setup()

# Import AFTER django.setup() so all apps are ready
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from scheduling.token_auth import JWTAuthMiddlewareStack
import scheduling.routing

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(
            scheduling.routing.websocket_urlpatterns
        )
    ),
})
