import { Component } from '@angular/core';
import { InputFieldComponent } from "../../shared/input-field/input-field.component";
import { MessageFieldComponent } from "../../shared/message-field/message-field.component";

@Component({
  selector: 'app-new-message',
  standalone: true,
  imports: [InputFieldComponent, MessageFieldComponent],
  templateUrl: './new-message.component.html',
  styleUrl: './new-message.component.scss'
})
export class NewMessageComponent {

}
