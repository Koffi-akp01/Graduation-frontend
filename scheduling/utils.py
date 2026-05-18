import os
from datetime import datetime
from django.conf import settings
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping

def generer_proces_verbal(evaluation):
    """
    Génère un procès-verbal PDF pour une évaluation validée.
    Retourne le chemin relatif du fichier généré.
    """
    soutenance = evaluation.soutenance
    etudiant = soutenance.etudiant
    
    # Créer le répertoire de destination
    pv_dir = os.path.join(settings.MEDIA_ROOT, 'pvs', str(datetime.now().year))
    os.makedirs(pv_dir, exist_ok=True)
    
    # Nom du fichier
    filename = f"PV_{etudiant.matricule}_{soutenance.date_soutenance.strftime('%Y%m%d_%H%M')}.pdf"
    filepath = os.path.join(pv_dir, filename)
    
    # Création du PDF
    c = canvas.Canvas(filepath, pagesize=A4)
    width, height = A4
    
    # Police par défaut
    c.setFont("Helvetica", 10)
    
    # ========== EN-TÊTE ==========
    c.setFont("Helvetica-Bold", 16)
    c.drawString(2*cm, height - 2*cm, "PROCÈS-VERBAL DE SOUTENANCE")
    
    c.setFont("Helvetica", 10)
    c.drawString(2*cm, height - 3*cm, f"Date de soutenance : {soutenance.date_soutenance.strftime('%d/%m/%Y à %H:%M')}")
    c.drawString(2*cm, height - 3.5*cm, f"Salle : {soutenance.salle.nom if soutenance.salle else 'Non définie'}")
    if soutenance.lien_meet:
        c.drawString(2*cm, height - 4*cm, f"Lien visio : {soutenance.lien_meet}")
    
    # ========== INFORMATIONS ÉTUDIANT ==========
    y = height - 6*cm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(2*cm, y, "IDENTITÉ DE L'ÉTUDIANT")
    y -= 0.6*cm
    c.setFont("Helvetica", 11)
    c.drawString(2*cm, y, f"Nom complet : {etudiant.user.get_full_name()}")
    y -= 0.5*cm
    c.drawString(2*cm, y, f"Matricule : {etudiant.matricule}")
    y -= 0.5*cm
    c.drawString(2*cm, y, f"Filière : {etudiant.filiere.nom if etudiant.filiere else 'Non définie'}")
    if etudiant.filiere:
        c.drawString(2*cm, y - 0.5*cm, f"Niveau : {etudiant.filiere.get_niveau_display()}")
        y -= 0.5*cm
    
    # ========== THÈME ==========
    y -= 0.8*cm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(2*cm, y, "THÈME DE LA SOUTENANCE")
    y -= 0.6*cm
    c.setFont("Helvetica", 11)
    theme = soutenance.theme
    c.drawString(2*cm, y, f"Titre : {theme.titre}")
    y -= 0.5*cm
    # Description tronquée si trop longue
    desc = theme.description[:150] + ("..." if len(theme.description) > 150 else "")
    c.drawString(2*cm, y, f"Description : {desc}")
    
    # ========== COMPOSITION DU JURY ==========
    y -= 1.2*cm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(2*cm, y, "COMPOSITION DU JURY")
    y -= 0.6*cm
    c.setFont("Helvetica", 11)
    c.drawString(2*cm, y, f"Président : {soutenance.president.get_full_name()}")
    y -= 0.5*cm
    c.drawString(2*cm, y, f"Examinateur : {soutenance.examinateur.get_full_name()}")
    y -= 0.5*cm
    c.drawString(2*cm, y, f"Directeur de mémoire : {soutenance.directeur_memoire.get_full_name()}")
    
    # ========== NOTES ET APPRÉCIATIONS ==========
    y -= 1.2*cm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(2*cm, y, "NOTES ATTRIBUÉES")
    y -= 0.6*cm
    c.setFont("Helvetica", 11)
    c.drawString(2*cm, y, f"Présentation : {evaluation.note_presentation} / 20")
    y -= 0.5*cm
    c.drawString(2*cm, y, f"Maîtrise du sujet : {evaluation.note_maitrise} / 20")
    y -= 0.5*cm
    c.drawString(2*cm, y, f"Qualité du mémoire : {evaluation.note_memoire} / 20")
    y -= 0.5*cm
    c.drawString(2*cm, y, f"Réponses aux questions : {evaluation.note_reponses} / 20")
    
    y -= 0.8*cm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(2*cm, y, f"Note finale : {evaluation.note_finale:.2f} / 20")
    y -= 0.5*cm
    c.drawString(2*cm, y, f"Mention : {evaluation.mention}")
    
    # Remarques
    if evaluation.remarques_jury:
        y -= 1*cm
        c.setFont("Helvetica-Bold", 11)
        c.drawString(2*cm, y, "REMARQUES DU JURY")
        y -= 0.5*cm
        c.setFont("Helvetica", 10)
        # Gestion du texte long
        remarques = evaluation.remarques_jury
        lignes = []
        while len(remarques) > 80:
            lignes.append(remarques[:80])
            remarques = remarques[80:]
        lignes.append(remarques)
        for ligne in lignes:
            c.drawString(2*cm, y, ligne)
            y -= 0.4*cm
    
    # ========== SIGNATURES ==========
    y = 5*cm
    c.setFont("Helvetica", 10)
    c.drawString(2*cm, y, "Signatures électroniques :")
    y -= 0.8*cm
    # Lignes de signature
    c.line(2*cm, y, 6*cm, y)
    c.drawString(2*cm, y - 0.4*cm, "Président")
    c.line(8*cm, y, 12*cm, y)
    c.drawString(8*cm, y - 0.4*cm, "Examinateur")
    c.line(14*cm, y, 18*cm, y)
    c.drawString(14*cm, y - 0.4*cm, "Directeur")
    
    # Pied de page
    c.setFont("Helvetica", 8)
    c.drawString(2*cm, 1.5*cm, f"Document généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} - IPNET")
    
    c.save()
    
    # Enregistrer le chemin relatif dans le modèle
    relative_path = os.path.join('pvs', str(datetime.now().year), filename)
    evaluation.pv_genere = relative_path
    evaluation.save(update_fields=['pv_genere'])
    
    return relative_path