import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
    template: `
      <div class="mat-modal-cont">
        <h1 mat-dialog-title>
          Start the game with Mutations?
        </h1>

        <mat-dialog-content>
            <p>
              Mutations cause unexpected changes to the game board.<br /><br />
              <i>BEWARE: Mutations are random, they may work with or against you!</i>
            </p>
        </mat-dialog-content>

        <mat-dialog-actions>                
            <div class="btn-container">
              <button mat-raised-button color="primary" class="btn btn-primary btn-large"
                (click)="Close(true)">
                BRING IT ON!
              </button>
              <button mat-raised-button color="accent" class="btn btn-secondary btn-large"
                (click)="Close(false)">
                No, thank you.
              </button>
            </div>
        </mat-dialog-actions>
      </div>
    `,
    styles: []
})
export class MutationDialogComponent {

    constructor(private _dialogRef: MatDialogRef<MutationDialogComponent>) { }

    public Close(mutations: boolean): void {
        this._dialogRef.close(mutations);
    }

}