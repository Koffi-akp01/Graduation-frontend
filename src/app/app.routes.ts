import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { JuryComponent } from './features/jury/jury';
import { UploadMemoireComponent } from './features/etudiant/upload-memoire/upload-memoire';
import { ExamenComponent } from './features/examen/examen/examen';
import { RecouvrementComponent } from './features/recouvrement/recouvrement/recouvrement';
import { DirectionComponent } from './features/direction/direction';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    
    children: [
      { path: 'etudiant/memoire', component: UploadMemoireComponent },
      { path: 'examen', component: ExamenComponent },
      { path: 'recouvrement', component: RecouvrementComponent },
      { path: 'jury', component: JuryComponent },
      { path: 'direction', component: DirectionComponent },
      { path: '**', redirectTo: 'etudiant/memoire' }
    ]
  }
];