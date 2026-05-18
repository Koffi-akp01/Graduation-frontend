"""
Script de création des comptes de test (sans supprimer les données existantes).

Usage (depuis ce dossier, avec l'environnement virtuel activé) :

    python seed_users.py

Prérequis : migrations appliquées. Pour que l'étudiant ait un profil API cohérent
(/etudiants/me/), au moins une entrée ``academic.Filiere`` doit exister
(ex. exécuter ``python seed.py`` une fois, ou créer une filière en admin).
"""
from __future__ import annotations

import os
import sys

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Graduation_Plan_backend.settings")
django.setup()

from django.db import IntegrityError

from accounts.models import User
from academic.models import Filiere, StudentProfile

# Alias "métier" / frontend -> valeur ``User.role`` (ROLE_CHOICES)
ROLE_ALIASES: dict[str, str] = {
    "ETUDIANT": "STUDENT",
    "STUDENT": "STUDENT",
    "DIRECTEUR_MEMOIRE": "INTERNAL_TRAINER",
    "DIRECTEUR": "INTERNAL_TRAINER",
    "INTERNAL_TRAINER": "INTERNAL_TRAINER",
    "EXTERNAL_TRAINER": "EXTERNAL_TRAINER",
    "DIRECTION": "ADMIN_ACADEMIC",
    "ADMIN_ACADEMIC": "ADMIN_ACADEMIC",
}


def resolve_role(role_key: str) -> str:
    key = (role_key or "").strip().upper()
    mapped = ROLE_ALIASES.get(key, key)
    valid = {c[0] for c in User.ROLE_CHOICES}
    if mapped not in valid:
        raise ValueError(
            f"Rôle inconnu : {role_key!r}. Utilisez un libellé d'alias "
            f"({sorted(ROLE_ALIASES)}) ou une valeur ROLE_CHOICES : {sorted(valid)}"
        )
    return mapped


def ensure_student_profile(user: User, matricule: str) -> None:
    if user.role != "STUDENT":
        return
    if StudentProfile.objects.filter(user=user).exists():
        print(f"    (profil étudiant déjà lié à {user.username})")
        return
    filiere = Filiere.objects.order_by("id").first()
    if not filiere:
        print(
            f"    Avertissement : aucune filière en base — "
            f"créez une ``Filiere`` pour lier l'étudiant {user.username}."
        )
        return
    try:
        StudentProfile.objects.create(
            user=user,
            filiere=filiere,
            matricule=matricule,
            has_paid_fees=False,
        )
        print(f"    Profil étudiant créé (matricule {matricule}, filière {filiere.code}).")
    except IntegrityError as exc:
        print(f"    Échec profil étudiant ({matricule}) : {exc}")


def run_seed() -> None:
    users_to_create = [
        {
            "username": "2024001",
            "email": "etudiant@ipnet.tg",
            "password": "password123",
            "role": "ETUDIANT",
            "first_name": "Koffi",
            "last_name": "Afola",
            "matricule": "2024001",
        },
        {
            "username": "directeur01",
            "email": "directeur@ipnet.tg",
            "password": "password123",
            "role": "DIRECTEUR_MEMOIRE",
            "first_name": "Jean",
            "last_name": "Dupont",
        },
        {
            "username": "admin_scolarite",
            "email": "admin@ipnet.tg",
            "password": "password123",
            "role": "DIRECTION",
            "first_name": "Alice",
            "last_name": "Vigan",
        },
    ]

    for user_data in users_to_create:
        username = user_data["username"]
        if User.objects.filter(username=username).exists():
            print(f"[skip] Utilisateur déjà présent : {username}")
            continue
        role = resolve_role(user_data["role"])
        extra: dict = {}
        if role in ("INTERNAL_TRAINER", "EXTERNAL_TRAINER"):
            extra["is_doctor"] = True
            extra["is_internal"] = True
        user = User.objects.create_user(
            username=username,
            email=user_data["email"],
            password=user_data["password"],
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            role=role,
            **extra,
        )
        print(f"[ok] Utilisateur créé : {user.username} ({role})")
        if role == "STUDENT":
            mat = user_data.get("matricule") or username
            ensure_student_profile(user, matricule=mat)


if __name__ == "__main__":
    try:
        run_seed()
    except ValueError as e:
        print(f"Erreur : {e}", file=sys.stderr)
        sys.exit(1)
