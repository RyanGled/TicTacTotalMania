import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';

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
        </mat-dialog-content>

        <mat-dialog-actions>                
            <div class="btn-container">
              <button mat-raised-button color="primary" class="btn btn-primary btn-large"
                (click)="Close(true)">
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

    constructor(private _dialogRef: MatDialogRef<JoinGameDialogComponent>) { }

    public Close(address: string): void {
        this._dialogRef.close(address);
    }

}