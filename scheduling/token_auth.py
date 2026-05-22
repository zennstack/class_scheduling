from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_key):
    """Validate the JWT access token and return the corresponding User, or AnonymousUser."""
    try:
        close_old_connections()
        token = AccessToken(token_key)
        user_id = token.get("user_id")
        return User.objects.get(id=user_id)
    except (InvalidToken, TokenError, User.DoesNotExist, Exception):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Django Channels middleware that reads ?token=<access_token> from the
    WebSocket handshake URL and authenticates the user via simplejwt.
    Falls back to AnonymousUser if the token is missing or invalid.
    """

    async def __call__(self, scope, receive, send):
        # Extract token from query string: ws://host/ws/notifications/?token=xxx
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token_list = params.get("token", [None])
        token_key = token_list[0] if token_list else None

        if token_key:
            scope["user"] = await get_user_from_token(token_key)
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """Wraps the inner application with JWTAuthMiddleware."""
    return JWTAuthMiddleware(inner)
