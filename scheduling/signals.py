from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Soutenance, Evaluation

@receiver(post_save, sender=Soutenance)
def creer_evaluation(sender, instance, created, **kwargs):
    if created:
        Evaluation.objects.create(soutenance=instance)