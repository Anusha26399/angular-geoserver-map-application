// datastore.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface NewDatastore {
  name: string;
  description: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  schema: string;
}

@Component({
  selector: 'app-datastore',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './datastore.html',
  styleUrls: ['./datastore.css']
})
export class DatastoreComponent {
  @Input() selectedWorkspace: string = '';
  
  @Output() datastoreCreated = new EventEmitter<NewDatastore>();

  newDatastore: NewDatastore = {
    name: '',
    description: '',
    host: 'hostname',
    port: 'portname',
    database: 'Dbname',
    username: 'username',
    password: 'password',
    schema: 'schemaname'
  };

  onCreateDatastore(): void {
    if (!this.newDatastore.name.trim()) {
      alert('Please enter datastore name');
      return;
    }

    if (!this.newDatastore.database.trim()) {
      alert('Please enter database name');
      return;
    }

    this.datastoreCreated.emit({ ...this.newDatastore });
    
    // Reset form
    this.newDatastore = {
      name: '',
      description: '',
      host: 'hostname',
      port: 'portname',
      database: '',
      username: 'username',
      password: 'password',
      schema: 'schema name'
    };
  }
}
