from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import TokenAccount, UserProfile


@receiver(post_save, sender=User)
def create_token_account(sender, instance, created, **kwargs):
    if created:
        TokenAccount.objects.create(
            user=instance,
            locked_tokens=0,
            total_tokens=10
        )
        
        @receiver(post_save, sender=User)
        def create_user_profile(sender, instance, created, **kwargs):
         if created:
          UserProfile.objects.get_or_create(user=instance)