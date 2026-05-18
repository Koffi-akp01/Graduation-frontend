import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Graduation_Plan_backend.settings')
django.setup()

from accounts.models import User
from academic.models import Filiere, UniteEnseignement, StudentProfile, ThemeSoutenance
from scheduling.models import Salle

print("Nettoyage des anciennes données...")
Salle.objects.all().delete()
ThemeSoutenance.objects.all().delete()
StudentProfile.objects.all().delete()
UniteEnseignement.objects.all().delete()
Filiere.objects.all().delete()
User.objects.filter(is_superuser=False).delete()

print("Création des filières...")
licence_gl = Filiere.objects.create(nom="Génie Logiciel", code="GL", niveau="LICENCE")
master_gl  = Filiere.objects.create(nom="Génie Logiciel", code="GL-M", niveau="MASTER")
licence_sr = Filiere.objects.create(nom="Systèmes Réseaux", code="SR", niveau="LICENCE")

print("Création des unités d'enseignement...")
# UE Licence GL
ue_algo  = UniteEnseignement.objects.create(filiere=licence_gl, libelle="Algorithmique", code_ue="GL-101", credits_ects=6)
ue_bdd   = UniteEnseignement.objects.create(filiere=licence_gl, libelle="Base de données", code_ue="GL-102", credits_ects=6)
ue_web   = UniteEnseignement.objects.create(filiere=licence_gl, libelle="Développement Web", code_ue="GL-103", credits_ects=6)
ue_poo   = UniteEnseignement.objects.create(filiere=licence_gl, libelle="Programmation Orientée Objet", code_ue="GL-104", credits_ects=6)
# UE Master GL
ue_ia    = UniteEnseignement.objects.create(filiere=master_gl, libelle="Intelligence Artificielle", code_ue="GLM-101", credits_ects=6)
ue_arch  = UniteEnseignement.objects.create(filiere=master_gl, libelle="Architecture Logicielle", code_ue="GLM-102", credits_ects=6)

print("Création des utilisateurs...")
# Direction académique
admin = User.objects.create_user(
    username="direction", password="ipnet2024",
    first_name="Directeur", last_name="Académique",
    email="direction@ipnet.tg", role="ADMIN_ACADEMIC"
)
# Service examen
exam_service = User.objects.create_user(
    username="service_exam", password="ipnet2024",
    first_name="Chef", last_name="Service Examen",
    email="exam@ipnet.tg", role="CHEF_SERVICE_EXAM"
)
# Service recouvrement
recouvrement = User.objects.create_user(
    username="recouvrement", password="ipnet2024",
    first_name="Service", last_name="Recouvrement",
    email="recouvrement@ipnet.tg", role="SERVICE_RECOUVREMENT"
)
# Formateurs internes (docteurs)
formateur1 = User.objects.create_user(
    username="prof_koffi", password="ipnet2024",
    first_name="Koffi", last_name="Mensah",
    email="koffi@ipnet.tg", role="INTERNAL_TRAINER",
    is_doctor=True, is_internal=True
)
formateur2 = User.objects.create_user(
    username="prof_ama", password="ipnet2024",
    first_name="Ama", last_name="Kpodo",
    email="ama@ipnet.tg", role="INTERNAL_TRAINER",
    is_doctor=True, is_internal=True
)
# Examinateur
examinateur = User.objects.create_user(
    username="examinateur1", password="ipnet2024",
    first_name="Kodjo", last_name="Agbeko",
    email="kodjo@ipnet.tg", role="EXAMINER",
    is_doctor=True, is_internal=True
)
# Président jury
president = User.objects.create_user(
    username="president1", password="ipnet2024",
    first_name="Yao", last_name="Attivor",
    email="yao@ipnet.tg", role="PRESIDENT_JURY",
    is_doctor=True, is_internal=True
)
# Étudiants
user_nika = User.objects.create_user(
    username="nika", password="ipnet2024",
    first_name="Nika", last_name="Dupont",
    email="nika@etudiant.ipnet.tg", role="STUDENT"
)
user_kofi = User.objects.create_user(
    username="kofi", password="ipnet2024",
    first_name="Kofi", last_name="Amoussou",
    email="kofi@etudiant.ipnet.tg", role="STUDENT"
)
user_ada = User.objects.create_user(
    username="ada", password="ipnet2024",
    first_name="Ada", last_name="Gbedji",
    email="ada@etudiant.ipnet.tg", role="STUDENT"
)

print("Création des profils étudiants...")
# Étudiant éligible (toutes UE validées + frais payés)
profil_nika = StudentProfile.objects.create(
    user=user_nika, filiere=licence_gl,
    matricule="GL-2024-001", has_paid_fees=True
)
profil_nika.ue_validees.set([ue_algo, ue_bdd, ue_web, ue_poo])

# Étudiant non éligible (frais non payés)
profil_kofi = StudentProfile.objects.create(
    user=user_kofi, filiere=licence_gl,
    matricule="GL-2024-002", has_paid_fees=False
)
profil_kofi.ue_validees.set([ue_algo, ue_bdd, ue_web, ue_poo])

# Étudiant non éligible (UE manquante)
profil_ada = StudentProfile.objects.create(
    user=user_ada, filiere=licence_gl,
    matricule="GL-2024-003", has_paid_fees=True
)
profil_ada.ue_validees.set([ue_algo, ue_bdd])  # UE web et poo manquantes

print("Création des thèmes...")
ThemeSoutenance.objects.create(
    etudiant=profil_nika,
    titre="Plateforme de gestion des soutenances académiques",
    description="Conception d'une plateforme intelligente pour IPNET Institute",
    statut="VALIDATED",
    examinateur_assigne=examinateur
)
ThemeSoutenance.objects.create(
    etudiant=profil_kofi,
    titre="Système de gestion des notes en ligne",
    description="Application web de gestion des notes pour établissements scolaires",
    statut="PENDING",
    examinateur_assigne=examinateur
)

print("Création des salles...")
Salle.objects.create(nom="Salle A", capacite=30, equipements="Vidéoprojecteur, Sonorisation", est_disponible=True)
Salle.objects.create(nom="Salle B", capacite=25, equipements="Vidéoprojecteur, Tableau blanc", est_disponible=True)
Salle.objects.create(nom="Amphi 1", capacite=100, equipements="Vidéoprojecteur, Sonorisation, Climatisation", est_disponible=True)

print("")
print("Données de test créées avec succès !")
print("Comptes disponibles (mot de passe : ipnet2024) :")
print("  direction      → Direction Académique")
print("  service_exam   → Chef Service Examen")
print("  recouvrement   → Service Recouvrement")
print("  prof_koffi     → Formateur Interne (Docteur)")
print("  prof_ama       → Formateur Interne (Docteur)")
print("  examinateur1   → Examinateur (Docteur)")
print("  president1     → Président Jury (Docteur)")
print("  nika           → Étudiant ÉLIGIBLE ✓")
print("  kofi           → Étudiant NON éligible (frais non payés) ✗")
print("  ada            → Étudiant NON éligible (UE manquantes) ✗")