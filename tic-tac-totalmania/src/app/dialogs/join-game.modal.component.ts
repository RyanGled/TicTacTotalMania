import { Component, EventEmitter } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
    template: `
      <div class="mat-modal-cont">
        <h1 mat-dialog-title>
          Join an existing game
        </h1>

        <mat-dialog-content>
            <p>
              Please enter an existing game contract address to join.
            </p>

            <form [formGroup]="form" *ngIf="form">
              <mat-form-field>
                <input matInput
                  placeholder="Contract Address"
                  formControlName="contractAddress">
              </mat-form-field>
            </form>
        </mat-dialog-content>

        <mat-dialog-actions>                
            <div class="btn-container">
              <button mat-raised-button color="primary" class="btn btn-primary btn-large"
                (click)="CloseAndJoin()">
                Join Game
              </button>
              <button mat-raised-button color="accent" class="btn btn-transp"
                (click)="Close()">
                Cancel
              </button>
            </div>
        </mat-dialog-actions>
      </div>
    `,
    styles: []
})
export class JoinGameDialogComponent {
    
    form: FormGroup;
    closeAndJoin = new EventEmitter();

    constructor(private _dialogRef: MatDialogRef<JoinGameDialogComponent>) {
      this.form = new FormGroup({
        //Hexadecimal addreses only
        contractAddress: new FormControl('', Validators.pattern('0[xX][0-9a-fA-F]+'))
      });
    }

    public CloseAndJoin(): void {
      this.closeAndJoin.emit(this.form.value);
      this.Close();
    }

    public Close(): void {
        this._dialogRef.close();
    }

}