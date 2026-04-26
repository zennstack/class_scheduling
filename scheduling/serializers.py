from rest_framework import serializers
from .models import Room, Instructor, Course, ClassSchedule
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

class InstructorSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Instructor
        fields = ['id', 'user', 'user_details', 'name', 'department']

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

class ClassScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassSchedule
        fields = '__all__'

    def validate(self, data):
        # We can run the model's clean method here to trigger our custom validation
        # If we're updating, we should use the existing instance and update it with new data
        if self.instance:
            instance = self.instance
            for attr, value in data.items():
                setattr(instance, attr, value)
        else:
            instance = ClassSchedule(**data)
            
        try:
            instance.clean()
        except DjangoValidationError as e:
            if hasattr(e, 'message_dict'):
                raise serializers.ValidationError(e.message_dict)
            raise serializers.ValidationError(e.messages)
        return data

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['room'] = RoomSerializer(instance.room).data
        representation['instructor'] = InstructorSerializer(instance.instructor).data
        representation['course'] = CourseSerializer(instance.course).data
        return representation
