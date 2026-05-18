from datetime import timedelta

from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from academic.models import StudentProfile, ThemeSoutenance  # import ajouté



class Salle(models.Model):
    nom = models.CharField(max_length=50, verbose_name="Nom de la salle")
    capacite = models.IntegerField(default=30)
    equipements = models.TextField(help_text="Videoprojecteur, Sonorisation, etc.")
    est_disponible = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nom} ({self.capacite} places)"


class Soutenance(models.Model):
    SESSION_CHOICES = [(str(i), f"Session {i}") for i in range(1, 13)]

    etudiant = models.OneToOneField(StudentProfile, on_delete=models.CASCADE, related_name="soutenance")
    theme = models.ForeignKey(ThemeSoutenance, on_delete=models.PROTECT)
    salle = models.ForeignKey(Salle, on_delete=models.SET_NULL, null=True)
    date_soutenance = models.DateTimeField(verbose_name="Date et Heure")
    session = models.CharField(max_length=2, choices=SESSION_CHOICES, verbose_name="Session Mensuelle")

    president = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="presidences",
        limit_choices_to={'role': 'PRESIDENT_JURY'}
    )
    examinateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="examinations",
        limit_choices_to={'role': 'EXAMINER'}
    )
    directeur_memoire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="directions",
        limit_choices_to={'role__in': ['INTERNAL_TRAINER', 'EXTERNAL_TRAINER']}
    )

    pre_soutenance_validee = models.BooleanField(default=False)
    est_cloturee = models.BooleanField(default=False)
    lien_meet = models.URLField(blank=True, null=True)

    class Meta:
        verbose_name = "Soutenance"
        constraints = [
            models.UniqueConstraint(fields=['salle', 'date_soutenance'], name='unique_salle_par_date')
        ]

    def clean(self):
        from .models import Indisponibilite

        # 1. Étudiant éligible
        if not self.etudiant.is_eligible:
            raise ValidationError("L'étudiant n'est pas éligible.")

        # 2. Conflit salle (±59 min)
        if self.salle and self.date_soutenance:
            start = self.date_soutenance - timedelta(minutes=59)
            end = self.date_soutenance + timedelta(minutes=59)

            conflit = Soutenance.objects.filter(
                salle=self.salle,
                date_soutenance__range=(start, end)
            ).exclude(id=self.id)

            if conflit.exists():
                raise ValidationError(f"La salle {self.salle.nom} est déjà occupée.")

        # 3. Niveau Master
        if self.etudiant.filiere.niveau == 'MASTER':
            if not getattr(self.president, 'is_doctor', False):
                raise ValidationError("Président doit être Docteur.")
            if not getattr(self.examinateur, 'is_doctor', False):
                raise ValidationError("Examinateur doit être Docteur.")

        # 4. Pré-soutenance
        try:
            pre = self.etudiant.pre_soutenance
            if pre.statut != 'VALIDE':
                raise ValidationError("Pré-soutenance non validée.")
        except PreSoutenance.DoesNotExist:
            raise ValidationError("Aucune pré-soutenance trouvée.")

        # 5. Indisponibilités jurés
        for membre in [self.president, self.examinateur, self.directeur_memoire]:
            if Indisponibilite.objects.filter(
                utilisateur=membre,
                date_debut__lt=self.date_soutenance,
                date_fin__gt=self.date_soutenance
            ).exists():
                raise ValidationError(f"{membre.get_full_name()} est indisponible.")

        # 6. Indisponibilité salle
        if self.salle and Indisponibilite.objects.filter(
            salle=self.salle,
            date_debut__lt=self.date_soutenance,
            date_fin__gt=self.date_soutenance
        ).exists():
            raise ValidationError(f"La salle {self.salle.nom} est indisponible.")
    pre_soutenance_validee = models.BooleanField(default=False, verbose_name="Pre-soutenance effectuee")
    est_cloturee = models.BooleanField(default=False)
    lien_meet = models.URLField(blank=True, null=True, help_text="En cas d'absence physique (Regle Meet)")

    class Meta:
        verbose_name = "Soutenance"
        unique_together = ['salle', 'date_soutenance']

    def clean(self):
        """Algorithme de verification des regles metier IPNET."""
        if not self.etudiant.is_eligible:
            raise ValidationError("L'etudiant n'est pas eligible (UE non validees ou frais non payes).")

        if self.salle and self.date_soutenance:
            start_time = self.date_soutenance - timedelta(minutes=59)
            end_time = self.date_soutenance + timedelta(minutes=59)

            conflit = Soutenance.objects.filter(
                salle=self.salle,
                date_soutenance__range=(start_time, end_time)
            ).exclude(id=self.id)

            if conflit.exists():
                raise ValidationError(
                    f"La salle {self.salle.nom} est deja occupee sur ce creneau horaire."
                )

        if self.etudiant.filiere.niveau == 'MASTER':
            if not self.president.is_doctor:
                raise ValidationError("Le President du jury doit etre Docteur pour une soutenance de Master.")
            if not self.examinateur.is_doctor:
                raise ValidationError("L'Examinateur doit etre Docteur pour une soutenance de Master.")

        if not self.pre_soutenance_validee:
            pass

    def save(self, *args, **kwargs):
        if self.pk:
            original = Soutenance.objects.get(pk=self.pk)
            if original.est_cloturee:
                raise ValidationError("Soutenance clôturée, modification interdite.")
                raise ValidationError("Cette soutenance est cloturee. Les modifications sont interdites.")

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Soutenance de {self.etudiant.user.last_name} - {self.date_soutenance}"


class Evaluation(models.Model):
    soutenance = models.OneToOneField(Soutenance, on_delete=models.CASCADE, related_name="resultat")

    note_presentation = models.FloatField(default=0)
    note_maitrise = models.FloatField(default=0)
    note_memoire = models.FloatField(default=0)
    note_reponses = models.FloatField(default=0)
    remarques_jury = models.TextField(blank=True)
    mention = models.CharField(max_length=50, blank=True)
    pv_genere = models.FileField(upload_to='pvs/', blank=True, null=True)
    est_signe_par_tous = models.BooleanField(default=False)

    @property
    def note_finale(self):
        return (self.note_presentation + self.note_maitrise + self.note_memoire + self.note_reponses) / 4
    
    def save(self, *args, **kwargs):
        # Calcul de la note finale à partir des quatre notes
        note = (self.note_presentation + self.note_maitrise + self.note_memoire + self.note_reponses) / 4
        if note >= 16:
            self.mention = "Très bien"
        elif note >= 14:
            self.mention = "Bien"
        elif note >= 12:
            self.mention = "Assez bien"
        elif note >= 10:
            self.mention = "Passable"
        else:
            self.mention = "Non admis"
        super().save(*args, **kwargs)


class Indisponibilite(models.Model):
    TYPE_CHOICES = [
        ('JURY', 'Membre du jury'),
        ('SALLE', 'Salle'),
    ]

    type_indisponible = models.CharField(max_length=10, choices=TYPE_CHOICES)
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='indisponibilites',
        limit_choices_to={'role__in': ['EXAMINER', 'PRESIDENT_JURY', 'DIRECTOR']}
    )
    salle = models.ForeignKey(
        Salle,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='indisponibilites'
    )
    date_debut = models.DateTimeField()
    date_fin = models.DateTimeField()
    raison = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ['date_debut']

    def clean(self):
        if not self.utilisateur and not self.salle:
            raise ValidationError("L'indisponibilité doit concerner un utilisateur ou une salle.")
        if self.utilisateur and self.salle:
            raise ValidationError("L'indisponibilité ne peut concerner à la fois un utilisateur et une salle.")
        if self.date_debut >= self.date_fin:
            raise ValidationError("La date de début doit être antérieure à la date de fin.")

    def __str__(self):
        if self.utilisateur:
            return f"{self.utilisateur.get_full_name()} indisponible du {self.date_debut} au {self.date_fin}"
        return f"Salle {self.salle.nom} indisponible du {self.date_debut} au {self.date_fin}"
