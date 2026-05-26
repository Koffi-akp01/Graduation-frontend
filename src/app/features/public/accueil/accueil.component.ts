import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideIconComponent } from 'lucide-angular';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    LucideIconComponent
  ],
  templateUrl: './accueil.component.html'
})
export class AccueilComponent {
  features = [
    { icon: 'users', title: 'Gestion des acteurs', desc: 'Comptes sécurisés pour chaque acteur avec droits spécifiques. Contrôle d\'accès RBAC.', colorClass: 'text-blue-600' },
    { icon: 'lightbulb', title: 'Dépôt des thèmes', desc: 'Soumission dématérialisée et validation progressive par la direction et l\'examinateur.', colorClass: 'text-amber-500' },
    { icon: 'book', title: 'Encadrement', desc: 'Désignation des directeurs avec priorité aux formateurs internes de l\'IPNET.', colorClass: 'text-blue-400' },
    { icon: 'check-circle', title: 'Vérifications & éligibilité', desc: 'Contrôle automatique des UE validées et paiement des frais de scolarité.', colorClass: 'text-green-500' },
    { icon: 'folder', title: 'Gestion documentaire', desc: 'Archivage et vérification anti-plagiat / détection IA intégrée.', colorClass: 'text-amber-600' },
    { icon: 'gavel', title: 'Composition des jurys', desc: 'Constitution automatique selon les règles (2 docteurs min pour Master).', colorClass: 'text-gray-700' },
  ];

  processus = [
    { step: 'Dépôt thème', icon: 'lightbulb' },
    { step: 'Validation', icon: 'check-circle' },
    { step: 'Dépôt mémoire', icon: 'file-text' },
    { step: 'Constitution jury', icon: 'users' },
    { step: 'Soutenance', icon: 'gavel' },
    { step: 'Publication', icon: 'graduation-cap' }
  ];
}
