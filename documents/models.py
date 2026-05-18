import os
from django.db import models
from django.conf import settings
from academic.models import StudentProfile
from scheduling.models import Soutenance

def student_directory_path(instance, filename):
    # Les fichiers seront stockés dans : media/memoires/etudiant_<id>/<filename>
    return f'memoires/student_{instance.etudiant.id}/{filename}'

class Memoire(models.Model):
    etudiant = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="documents_memoire")
    titre_final = models.CharField(max_length=255)
    
    # Dépôt multiple (Règle g du cahier des charges)
    fichier_pdf = models.FileField(upload_to=student_directory_path, verbose_name="Version PDF (Immuable)")
    fichier_word = models.FileField(upload_to=student_directory_path, verbose_name="Version Word (Anti-plagiat)")
    support_presentation = models.FileField(upload_to=student_directory_path, verbose_name="Support PowerPoint", null=True, blank=True)
    
    # Contrôles de validation (Règle 7 & 8)
    est_valide_par_directeur = models.BooleanField(default=False, verbose_name="Quitus du Directeur")
    verifie_anti_plagiat = models.BooleanField(default=False, verbose_name="Vérification Plagiat/IA")
    score_similarite = models.FloatField(default=0.0, help_text="Pourcentage de similarité détecté")
    
    nb_pages = models.IntegerField(verbose_name="Nombre de pages", help_text="Licence: max 90, Master: 100-120")
    date_depot = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Mémoire de {self.etudiant.user.last_name} ({self.date_depot.strftime('%d/%m/%Y')})"

class ProcesVerbal(models.Model):
    soutenance = models.OneToOneField(Soutenance, on_delete=models.CASCADE, related_name="pv_officiel")
    
    # Génération et Archivage (Règle h)
    fichier_pv = models.FileField(upload_to='pvs/%Y/%m/', null=True, blank=True)
    code_archive = models.CharField(max_length=50, unique=True, verbose_name="Code d'archivage bibliothèque")
    
    # Signature électronique (Simulation de la Règle 8)
    signe_par_president = models.BooleanField(default=False)
    signe_par_examinateur = models.BooleanField(default=False)
    signe_par_directeur = models.BooleanField(default=False)
    
    date_generation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Procès-Verbal"
        verbose_name_plural = "Procès-Verbaux"

    def __str__(self):
        return f"PV - {self.soutenance.etudiant.user.last_name} - {self.soutenance.session}"

class Attestation(models.Model):
    TYPE_CHOICES = [('DEPOT', 'Attestation de Dépôt'), ('RECURRENCE', 'Attestation de Réussite')]
    etudiant = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    type_document = models.CharField(max_length=20, choices=TYPE_CHOICES)
    fichier_genere = models.FileField(upload_to='attestations/')
    date_emission = models.DateField(auto_now_add=True)


class Document(models.Model):
    TYPE_CHOICES = [
        ('memoire', 'Mémoire'),
        ('pv', 'Procès-verbal'),
        ('attestation', 'Attestation'),
    ]
    
    etudiant = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='documents')
    type_document = models.CharField(max_length=20, choices=TYPE_CHOICES)
    fichier = models.FileField(upload_to='documents/%Y/%m/%d/')
    version = models.IntegerField(default=1)
    est_valide = models.BooleanField(default=False)
    commentaire = models.TextField(blank=True, null=True)
    date_upload = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['etudiant', 'type_document', 'version']
        ordering = ['-date_upload']
    
    def __str__(self):
        return f"{self.get_type_document_display()} v{self.version} - {self.etudiant.matricule}"
    
    def save(self, *args, **kwargs):
        if not self.pk:
            last_doc = Document.objects.filter(
                etudiant=self.etudiant,
                type_document=self.type_document
            ).order_by('-version').first()
            
            if last_doc:
                self.version = last_doc.version + 1
            else:
                self.version = 1
        
        super().save(*args, **kwargs)
    
    def valider(self, commentaire=None):
        self.est_valide = True
        if commentaire:
            self.commentaire = commentaire
        self.save()
    
    @property
    def est_derniere_version(self):
        dernier = Document.objects.filter(
            etudiant=self.etudiant,
            type_document=self.type_document
        ).order_by('-version').first()
        return self.id == dernier.id if dernier else True
    
class LogEntry(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Création'),
        ('UPDATE', 'Modification'),
        ('DELETE', 'Suppression'),
        ('UPLOAD', 'Upload'),
        ('VALIDATE', 'Validation'),
        ('BLOCK', 'Blocage'),
    ]
    
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='documents_log_entries'  # ← Ajoute ceci
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    objet_type = models.CharField(max_length=100)
    objet_id = models.IntegerField()
    details = models.JSONField(default=dict)
    date_heure = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date_heure']
        db_table = 'documents_log_entry'  # ← Nom de table unique
    
    def __str__(self):
        return f"{self.date_heure} - {self.utilisateur} - {self.action}"