import { Component } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-legal-notice',
  standalone: true,
  imports: [HeaderComponent, RouterModule],
  templateUrl: './legal-notice.component.html',
  styleUrl: './legal-notice.component.scss'
})
export class LegalNoticeComponent {

}
