import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TopNav } from '../../core/components/top-nav/top-nav';

@Component({
  selector: 'app-calendrier',
  standalone: true,
  imports: [TopNav, RouterLink],
  templateUrl: './calendrier.html',
})
export class CalendrierComponent {
  phases = [
    { num: 1,  status: 'done',  titre: 'Dépôt des thèmes de mémoire',           desc: 'Les étudiants soumettent leur sujet de mémoire pour validation par la direction académique.',   periode: 'Jan – Fév 2026',  duree: '6 semaines', acteurs: 'Étudiants, Direction académique' },
    { num: 2,  status: 'done',  titre: 'Validation des thèmes & affectation des directeurs', desc: 'La direction valide les thèmes et désigne un directeur de mémoire pour chaque étudiant.', periode: 'Fév – Mar 2026', duree: '3 semaines', acteurs: 'Direction académique, Directeurs' },
    { num: 3,  status: 'done',  titre: 'Rédaction du mémoire',                   desc: 'Phase de rédaction encadrée par le directeur de mémoire. Suivi régulier et corrections.',       periode: 'Mar – Mai 2026',  duree: '10 semaines', acteurs: 'Étudiants, Directeurs de mémoire' },
    { num: 4,  status: 'actif', titre: 'Dépôt du mémoire final',                 desc: 'Les étudiants déposent leur mémoire finalisé pour vérification de conformité et anti-plagiat.',  periode: 'Mai 2026',        duree: '2 semaines', acteurs: 'Étudiants, Service Examen' },
    { num: 5,  status: 'wait',  titre: 'Vérification anti-plagiat / anti-IA',    desc: 'Le service examen vérifie la conformité des mémoires (taux plagiat < 20%, IA < 25%).',          periode: 'Juin 2026',       duree: '2 semaines', acteurs: 'Service Examen' },
    { num: 6,  status: 'wait',  titre: 'Validation paiement des frais',           desc: 'Le service recouvrement confirme la réception des frais de soutenance (20 000 FCFA M2).',        periode: 'Juin 2026',       duree: '1 semaine',  acteurs: 'Service Recouvrement, Étudiants' },
    { num: 7,  status: 'wait',  titre: 'Constitution des jurys',                  desc: 'La direction académique constitue les jurys (président + examinateur). Règle : 2 docteurs en M2.', periode: 'Juin 2026',    duree: '2 semaines', acteurs: 'Direction académique' },
    { num: 8,  status: 'wait',  titre: 'Planification des soutenances',           desc: 'La chargée d\'organisation planifie les créneaux, salles et convocations.',                       periode: 'Juin 2026',       duree: '1 semaine',  acteurs: 'Chargée d\'organisation' },
    { num: 9,  status: 'wait',  titre: 'Pré-soutenances',                         desc: 'Répétitions obligatoires devant le directeur et le jury. Identification des points à améliorer.', periode: 'Fin Juin 2026',   duree: '1 semaine',  acteurs: 'Étudiants, Directeurs, Jury' },
    { num: 10, status: 'final', titre: 'Soutenances officielles',                 desc: 'Sessions de soutenance publiques. Le jury évalue et délibère. Durée : 1h par étudiant.',         periode: 'Juil 2026',       duree: '2 semaines', acteurs: 'Étudiants, Jury, Direction' },
    { num: 11, status: 'final', titre: 'Publication des résultats & remise des diplômes', desc: 'La direction publie les notes finales, PV et organise la cérémonie de remise des diplômes.', periode: 'Juil – Août 2026', duree: '2 semaines', acteurs: 'Direction, MC Cérémonie' },
  ];
}
