import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTooltipModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule, 
         MatFormFieldModule, MatInputModule } from '@angular/material';

import { AppComponent } from './app.component';

import { MutationDialogComponent } from './dialogs/mutation.modal.component';
import { JoinGameDialogComponent } from './dialogs/join-game.modal.component';

@NgModule({
  declarations: [
    AppComponent,

    MutationDialogComponent,
    JoinGameDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,

    MatTooltipModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  providers: [],
  entryComponents: [
    MutationDialogComponent,
    JoinGameDialogComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
