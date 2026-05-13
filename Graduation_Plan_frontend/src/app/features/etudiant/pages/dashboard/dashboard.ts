import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EtudiantService } from '../../../../core/services/etudiant/etudiant';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  currentStep = signal<number>(1);
  etudiantData = signal<any>(null);

  steps = [
    { id: 1, label: 'Depot du Theme', description: 'Proposez votre sujet de memoire.', isLast: false },
    { id: 2, label: 'Validation Direction', description: 'Attente de validation academique.', isLast: false },
    { id: 3, label: 'Attribution Directeur', description: 'Un enseignant vous sera affecte.', isLast: false },
    { id: 4, label: 'Encadrement', description: 'Travaillez votre memoire avec votre directeur.', isLast: false },
    { id: 5, label: 'Depot Memoire', description: 'Soumettez la version complete du memoire.', isLast: false },
    { id: 6, label: 'Verification Memoire', description: 'Controle anti-plagiat et validation du document.', isLast: false },
    { id: 7, label: 'Paiement Frais', description: 'Validation des frais de soutenance.', isLast: false },
    { id: 8, label: 'Pre-soutenance', description: 'Passage et validation de la pre-soutenance.', isLast: false },
    { id: 9, label: 'Planification', description: 'Affectation de la salle, date et jury.', isLast: false },
    { id: 10, label: 'Soutenance', description: 'Presentation devant le jury.', isLast: false },
    { id: 11, label: 'Cloture', description: 'Validation finale et generation des documents.', isLast: true },
  ];

  constructor(private etudiantService: EtudiantService) {}

  ngOnInit(): void {
    this.etudiantService.getProfile().subscribe((data) => {
      this.etudiantData.set(data);
      this.currentStep.set(data.current_phase ?? 1);
    });
  }
}
