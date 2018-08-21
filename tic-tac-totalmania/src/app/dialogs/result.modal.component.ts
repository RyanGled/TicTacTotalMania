import { Component, EventEmitter, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    template: `
      <div class="mat-modal-cont">
        <ng-container [ngSwitch]="typeOfResult">
          <h1 mat-dialog-title *ngSwitchCase="0">
            DRAW
          </h1>
          <h1 mat-dialog-title *ngSwitchCase="1">
            WIN
          </h1>
          <h1 mat-dialog-title *ngSwitchCase="2">
            LOSS
          </h1>
        </ng-container>

        <mat-dialog-content>
          <ng-container [ngSwitch]="typeOfResult">
            <p mat-dialog-title *ngSwitchCase="0">
              Why not have a rematch to separate the tie?
            </p>
            <p mat-dialog-title *ngSwitchCase="1">
              Congratulations! You are a TicTacTotalGenius!
            </p>
            <p mat-dialog-title *ngSwitchCase="2">
              Unlucky, better luck next time.
            </p>
          </ng-container>
        </mat-dialog-content>

        <mat-dialog-actions>                
            <div class="btn-container">
              <ng-container [ngSwitch]="typeOfResult">
                <button mat-raised-button color="primary" class="btn btn-primary btn-large"
                  (click)="Cashout()"
                  *ngSwitchCase="0">
                  Claim Winnings
                </button>
                <button mat-raised-button color="primary" class="btn btn-primary btn-large"
                  (click)="Cashout()"
                  *ngSwitchCase="1">
                  Claim Winnings
                </button>
                <button mat-raised-button color="primary" class="btn btn-primary btn-large"
                  (click)="Close()"
                  *ngSwitchCase="2">
                  Done
                </button>
              </ng-container>
            </div>
        </mat-dialog-actions>
      </div>
    `,
    styles: []
})
export class ResultDialogComponent {
    
    cashout = new EventEmitter();
    private title: string;
    private typeOfResult: number;

    constructor(
      private _dialogRef: MatDialogRef<ResultDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data) {
        
        if (data.winningAddress === data.currentPlayerAddress) {
          this.title = "WIN";
          this.typeOfResult = 1;
        } else if (data.winningAddress !== data.currentPlayerAddress) {
          this.title = "LOSS";
          this.typeOfResult = 2;
        }
        if (data.winningAddress === null) {
          this.typeOfResult = 0;
          this.title = "DRAW";
        }

        console.log('data.winningAddress', data.winningAddress);
        console.log('data.currentPlayerAddress', data.currentPlayerAddress);
        console.log('this.typeOfResult', this.typeOfResult);

    }

    public Cashout(): void {
      this.cashout.emit();
      this.Close();
    }

    public Close(): void {
        this._dialogRef.close();
    }

}