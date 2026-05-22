

# Email verification view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import UserProfile
from django.contrib.auth.models import User

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            profile = UserProfile.objects.get(email_verification_token=token)
            if profile.is_email_verified:
                return Response({'message': 'Email already verified.'}, status=status.HTTP_200_OK)
            profile.is_email_verified = True
            # DO NOT set token to None here, so React Strict Mode double-firing works gracefully
            # profile.email_verification_token = None
            profile.save()
            
            user = profile.user
            user.is_active = True
            user.save()
            return Response({'message': 'Email verified successfully.'}, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Invalid or expired verification token.'}, status=status.HTTP_400_BAD_REQUEST)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission, SAFE_METHODS, IsAdminUser
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Room, Instructor, Course, ClassSchedule, Student, Section
from .serializers import (
    UserSerializer, RoomSerializer, InstructorSerializer, 
    CourseSerializer, ClassScheduleSerializer, StudentSerializer, SectionSerializer
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

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .models import UserProfile
        from .email_utils import send_verification_email

        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')

        if not username or not password or not email:
            return Response({'error': 'Username, password and email are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, password=password, email=email)
        user.is_active = False
        user.save()
        
        # Create user profile
        profile = UserProfile.objects.create(user=user)
        profile.generate_verification_token()
        
        # Send verification email
        try:
            send_verification_email(user, request)
        except Exception as e:
            user.delete()
            return Response({'error': f'Email service unavailable: {str(e)}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        return Response({'message': 'User registered successfully. Please check your email to verify your account.', 'user': UserSerializer(user).data}, status=status.HTTP_201_CREATED)


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

class SectionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    queryset = Section.objects.all()
    serializer_class = SectionSerializer

class StudentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

