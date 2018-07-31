import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { BigNumber } from "bignumber.js";

import BrowserDetection from '../../../../core/BrowserDetection';
import EventService from '../../../../core/EventService';

@Injectable({
  providedIn: 'root'
})
export class Web3Service {

    private accounts: string[];
    private activeAccount: string;
    private ethBalance: string;
    private web3: any;
    private web3Ready: boolean = false;

    constructor() {
        this.Init();
    }

    private async Init() {
        new EventService();
        await this.CheckBrowserCompatibility();
        await this.SetWeb3();
        this.RetrieveEthAccounts();
    }
    
    private CheckBrowserCompatibility(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (BrowserDetection.InternetExplorer()) {
                reject("Browser not compatable");
                console.error('Browser not compatable');
            }
            resolve();
        });
    }
    
    private SetWeb3(): Promise<any> {

        return new Promise(async (resolve, reject) => {
            if (typeof (<any>window).web3 !== 'undefined') {
                //using metamask provider
                (<any>window).web3 = new Web3(Web3.givenProvider);
                resolve();
            } else {
                console.warn("No external web3 available, looking for a local ethereum node");

                try {
                    // fallback - attempt to connect to local node, if one exists
                    (<any>window).web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
                    if ((<any>window).web3 !== undefined) {
                        console.log("No external web3 provider found. Fallback to local node failed.");
                        throw new Error();
                    } else {
                        resolve();
                    }
                } catch (error) {
                    console.error("No external web3 provider found", error);
                    reject("No Web3 provider found.");
                }
            }
            this.web3Ready = true;
        });
    };

    private RetrieveEthAccounts(): void {        
        (<any>window).web3.eth.getAccounts((err, accs) => {
            if (err != null || accs.length === 0) {
                return;
            }
            this.accounts = accs;
            this.activeAccount = this.accounts[0];
        });
    }

    public GetAccounts(): string[] {
        return this.accounts;
    }

    public GetActiveAccount(): string {
        return this.activeAccount;
    }

    public GetEthBalance(): Promise<string> {
        return new Promise(async (resolve, reject) => {

            this.GetBalance(this.activeAccount, "pending", async (error, result) => {

                if (!error) {
                    //store it as a BigNumber
                    this.ethBalance = this.FromWei(result, "ether");

                    resolve(this.ethBalance);
                } else {
                    console.error("Error: Account balance not set");
                    reject(0);
                }
            });

        });
    }
    
    public GetBalance(address: string, defaultBlock?: number | string, callback?: Function): Promise<string> {
        return (<any>window).web3.eth.getBalance(address, defaultBlock, callback);
    }

    public FromWei(number: string | number | BigNumber, unit?: string): string {
        return (<any>window).web3.utils.fromWei(number, unit);
    }
    
    public GetIsWeb3Ready(): boolean {
        return this.web3Ready;
    }

}