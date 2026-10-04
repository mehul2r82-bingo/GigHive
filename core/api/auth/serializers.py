from django.contrib.auth.models import User
from rest_framework import serializers
from core.models import UserProfile

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    registration_number = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "registration_number"]

    def validate_username(self, value):
        value = str(value).strip().replace(" ", "_")
        return value

    def validate_registration_number(self, value):
        value = str(value).strip()
        if not value:
            raise serializers.ValidationError("Registration number is required.")
        if UserProfile.objects.filter(registration_number__iexact=value).exists():
            raise serializers.ValidationError("An account with this student registration number already exists.")
        return value

    def create(self, validated_data):
        reg_no = validated_data.pop("registration_number").strip()
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"]
        )
        if hasattr(user, "profile"):
            profile = user.profile
            profile.registration_number = reg_no
            profile.save(update_fields=["registration_number"])
        return user