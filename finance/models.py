from django.db import models
from django.conf import settings
from academic.models import StudentProfile

class Bordereau(models.Model):
    # On lie le paiement à l'étudiant
    etudiant = models.ForeignKey(
        StudentProfile, 
        on_delete=models.CASCADE, 
        related_name="paiements"
    )
    
    # Références de transaction
    numero_bordereau = models.CharField(max_length=100, unique=True, verbose_name="N° du Bordereau")
    banque = models.CharField(max_length=100, default="ECOBANK", help_text="Banque de dépôt")
    
    # Montants spécifiques IPNET (Règle 4.4 : 100.000 ou 150.000)
    MONTANT_CHOICES = [
        (100000, '100.000 F (Licence)'),
        (150000, '150.000 F (Master)'),
    ]
    montant = models.IntegerField(choices=MONTANT_CHOICES)
    
    # Preuve numérique
    image_bordereau = models.ImageField(upload_to='paiements/bordereaux/', verbose_name="Scan du bordereau")
    
    # Workflow de validation par le service recouvrement
    est_valide = models.BooleanField(default=False, verbose_name="Paiement Confirmé")
    valide_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        limit_choices_to={'role': 'SERVICE_RECOUVREMENT'}
    )
    
    date_depot = models.DateTimeField(auto_now_add=True)
    date_validation = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Paiement"
        verbose_name_plural = "Paiements"

    def __str__(self):
        status = "Validé" if self.est_valide else "En attente"
        return f"Bordereau {self.numero_bordereau} - {self.etudiant.user.last_name} ({status})"

    def save(self, *args, **kwargs):
        # Si le bordereau est validé, on met à jour automatiquement le profil académique
        super().save(*args, **kwargs)
        if self.est_valide:
            self.etudiant.has_paid_fees = True
            self.etudiant.date_paiement = self.date_validation or self.date_depot
            self.etudiant.save()