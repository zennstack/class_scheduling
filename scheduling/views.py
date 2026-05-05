from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission, SAFE_METHODS
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Room, Instructor, Course, ClassSchedule
from .serializers import (
    UserSerializer, RoomSerializer, InstructorSerializer, 
    CourseSerializer, ClassScheduleSerializer
)
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class HealthCheckView(APIView):
    permission_classes = []
    def get(self, request):
        return Response({"status": "ok", "message": "API is running"}, status=status.HTTP_200_OK)

class CreateFirstAdminView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        if not User.objects.filter(is_superuser=True).exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'admin')
            return Response({"message": "Admin 'admin' with password 'admin' created successfully."}, status=status.HTTP_201_CREATED)
        return Response({"error": "An admin account already exists. For security, this setup endpoint is disabled."}, status=status.HTTP_403_FORBIDDEN)

import os
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')

        if not username or not password or not email:
            return Response({'error': 'Username, email, and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already registered.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, password=password, email=email)
        user.is_active = False # require email verification
        user.save()

        # Generate token for email verification
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
        activation_link = f"{frontend_url}/activate/{uid}/{token}"

        # Send activation email
        try:
            send_mail(
                'Verify your PlanClass account',
                f'Hello {user.username},\n\nPlease click the following link to verify your account:\n{activation_link}\n\nThank you!',
                os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@planclass.com'),
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            # If email fails, you might want to delete the user or log the error
            user.delete()
            return Response({'error': f'Failed to send verification email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'Registration successful. Please check your email to verify your account.'}, status=status.HTTP_201_CREATED)

class ActivateAccountView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response({'message': 'Account activated successfully.'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Activation link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                return Response({'message': 'Successfully logged out.'}, status=status.HTTP_200_OK)
            return Response({'error': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .serializers import PasswordChangeSerializer
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.data.get('old_password')):
                return Response({'old_password': ['Wrong password.']}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(serializer.data.get('new_password'))
            user.save()
            return Response({'message': 'Password updated successfully.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RoomViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

class InstructorViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    queryset = Instructor.objects.all()
    serializer_class = InstructorSerializer

class CourseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

class ClassScheduleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    queryset = ClassSchedule.objects.all()
    serializer_class = ClassScheduleSerializer

    def perform_create(self, serializer):
        try:
            serializer.save()
        except DjangoValidationError as e:
            if hasattr(e, 'message_dict'):
                raise ValidationError(e.message_dict)
            raise ValidationError({'error': list(e.messages)})
            
    def perform_update(self, serializer):
        try:
            serializer.save()
        except DjangoValidationError as e:
            if hasattr(e, 'message_dict'):
                raise ValidationError(e.message_dict)
            raise ValidationError({'error': list(e.messages)})

