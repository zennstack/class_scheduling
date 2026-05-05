from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    RegisterView, LogoutView, ProfileView, ChangePasswordView,
    UserViewSet, RoomViewSet, InstructorViewSet, 
    CourseViewSet, ClassScheduleViewSet, HealthCheckView, CreateFirstAdminView,
    ActivateAccountView
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'instructors', InstructorViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'schedules', ClassScheduleViewSet)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/activate/<str:uidb64>/<str:token>/', ActivateAccountView.as_view(), name='activate'),
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('auth/login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('', include(router.urls)),
    path('setup-admin/', CreateFirstAdminView.as_view(), name='setup-admin'),
    path('health/', HealthCheckView.as_view(), name='health'),]
