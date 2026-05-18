from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # Liste des 10 rôles définis dans ton planning et cahier des charges
    ROLE_CHOICES = [
        ('ADMIN_ACADEMIC', 'Direction Académique'),
        ('CHEF_SERVICE_EXAM', 'Chef Service Examen'),
        ('SERVICE_RECOUVREMENT', 'Service de Recouvrement'),
        ('CHARGE_ORGANISATION', 'Chargé d\'Organisation'),
        ('STUDENT', 'Étudiant'),
        ('INTERNAL_TRAINER', 'Formateur Interne'),
        ('EXTERNAL_TRAINER', 'Formateur Externe'),
        ('EXAMINER', 'Examinateur'),
        ('PRESIDENT_JURY', 'Président du Jury'),
        ('MC', 'Maître de Cérémonie'),
    ]

    role = models.CharField(
        max_length=30, 
        choices=ROLE_CHOICES, 
        default='STUDENT',
        verbose_name="Rôle utilisateur"
    )
    
    # Informations de contact professionnelles
    phone_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="Numéro de téléphone")
    
    # Pour les règles Master (Règle 5 : 2 docteurs minimum)
    is_doctor = models.BooleanField(
        default=False, 
        verbose_name="Est Docteur ?",
        help_text="Obligatoire pour être Président ou Examinateur en Master"
    )

    # Pour la Règle 3 : Priorité aux formateurs internes
    is_internal = models.BooleanField(
        default=True, 
        verbose_name="Personnel Interne IPNET"
    )

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def get_charge_travail(self):
        if self.role in ['INTERNAL_TRAINER', 'EXTERNAL_TRAINER']:
            return self.directions.count()
        return 0

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"
