import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ɵEmptyOutletComponent } from '@angular/router';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [ɵEmptyOutletComponent, CommonModule],
  templateUrl: './profile-card.component.html',
  styleUrl: './profile-card.component.scss',
})
export class ProfileCardComponent {
  @Input({ required: true }) src!: string;
  @Input({ required: true }) name!: string;
  @Input({ required: true }) active: boolean = false;
  @Input({ required: true }) email!: string;
}

// example how to implement this in other components whitout button

// <app-profile-card [src]="'./../../assets/images/profile-images/head-1.png'" [name]="'Aldin'" [active]="true" [email]="'aldin@gmail.com'">
// Ich habe hier ngcontent implementiert, damit ein Button für die verschiedenen Profilkarten verwendet werden kann
// </app-profile-card>

// example with button
// <app-profile-card [src]="'./../../assets/images/profile-images/head-1.png'" [name]="'Aldin'" [active]="true" [email]="'aldin@gmail.com'">
// <button>Nachricht</button>
// </app-profile-card>
//
