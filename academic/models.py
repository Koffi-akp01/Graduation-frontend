from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Filiere(models.Model):
    LEVEL_CHOICES = [('LICENCE', 'Licence'), ('MASTER', 'Master')]

    nom = models.CharField(max_length=100, verbose_name="Nom de la filiere")
    code = models.CharField(max_length=10, unique=True)  # Ex: GL, SRI, BI
    niveau = models.CharField(max_length=10, choices=LEVEL_CHOICES)

    def __str__(self):
        return f"{self.code} - {self.get_niveau_display()}"


class UniteEnseignement(models.Model):
    filiere = models.ForeignKey(Filiere, on_delete=models.CASCADE, related_name="ue_list")
    libelle = models.CharField(max_length=200)
    code_ue = models.CharField(max_length=20, unique=True)
    credits_ects = models.IntegerField(default=6)

    def __str__(self):
        return f"[{self.code_ue}] {self.libelle}"


class StudentProfile(models.Model):
    # Lien vers l'utilisateur cree dans le module 'accounts'
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'STUDENT'},
        related_name="student_data"
    )
    filiere = models.ForeignKey(Filiere, on_delete=models.SET_NULL, null=True)
    matricule = models.CharField(max_length=20, unique=True)

    # Regle 2 : Statut de paiement (100k ou 150k)
    has_paid_fees = models.BooleanField(default=False, verbose_name="Frais de soutenance payes")
    date_paiement = models.DateField(null=True, blank=True)

    # Regle 1 : Validation des UE
    # On utilise une relation Many-to-Many pour lister les UE validees
    ue_validees = models.ManyToManyField(UniteEnseignement, blank=True, related_name="students_who_passed")

    @property
    def is_eligible(self):
        """Verifie si l'etudiant remplit toutes les conditions IPNET pour soutenir."""
        total_ue_filiere = UniteEnseignement.objects.filter(filiere=self.filiere).count()
        ues_validees_count = self.ue_validees.count()

        if ues_validees_count < total_ue_filiere:
            return False

        if not self.has_paid_fees:
            return False

        return True

    def verifier_conformite_dossier(self):
        erreurs = []

        total_ue_requises = UniteEnseignement.objects.filter(filiere=self.filiere).count()
        if self.ue_validees.count() < total_ue_requises:
            erreurs.append("Toutes les UE ne sont pas validees.")

        if not self.has_paid_fees:
            erreurs.append("Frais de soutenance non soldes.")

        theme = ThemeSoutenance.objects.filter(etudiant=self, statut='VALIDATED').first()
        if not theme:
            erreurs.append("Theme non valide par la direction.")

        return erreurs

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.matricule}"


class ThemeSoutenance(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'En attente'),
        ('VALIDATED', 'Valide (OK)'),
        ('REJECTED', 'Rejete/A modifier'),
    ]

    etudiant = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    titre = models.CharField(max_length=255, verbose_name="Thème proposé")
    description = models.TextField(verbose_name="Problématique et Objectifs")
    
    examinateur_assigne = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        limit_choices_to={'role': 'EXAMINER'},
        related_name="themes_to_review"
    )

    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    remarques_examinateur = models.TextField(blank=True, null=True)
    date_soumission = models.DateTimeField(auto_now_add=True)
    
    # ✅ NOUVEAUX CHAMPS - Anti-fraude et anti-IA
    verifie_plagiat = models.BooleanField(default=False, verbose_name="Vérification anti-plagiat effectuée")
    verifie_ia = models.BooleanField(default=False, verbose_name="Vérification anti-IA effectuée")
    date_verification = models.DateTimeField(null=True, blank=True, verbose_name="Date de vérification")
    verifie_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role__in': ['CHEF_SERVICE_EXAM', 'ADMIN_ACADEMIC']},
        related_name="verifications_effectuees"
    )
    rapport_verification = models.FileField(upload_to='verifications/%Y/%m/', null=True, blank=True)
    commentaire_verification = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.etudiant.user.last_name} : {self.titre[:30]}..."

    
    @property
    def est_verifie(self):
        """Vérifie si le mémoire a passé toutes les vérifications"""
        return self.verifie_plagiat and self.verifie_ia
    
    def marquer_verifie(self, utilisateur, plagiat_ok=True, ia_ok=True, commentaire=None, rapport=None):
        """Marque le thème/mémoire comme vérifié"""
        self.verifie_plagiat = plagiat_ok
        self.verifie_ia = ia_ok
        self.date_verification = timezone.now()
        self.verifie_par = utilisateur
        if commentaire:
            self.commentaire_verification = commentaire
        if rapport:
            self.rapport_verification = rapport
        self.save()
