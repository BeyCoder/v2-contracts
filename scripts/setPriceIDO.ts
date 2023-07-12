import { Address, toNano } from 'ton-core';
import { SwapToV2Contract } from '../wrappers/SwapToV2Contract';
import { NetworkProvider, sleep } from '@ton-community/blueprint';
import {JettonMaster} from "ton";
import {IDO} from "../wrappers/IDO";

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Contract address:'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const contract = provider.open(IDO.createFromAddress(address));

    await contract.sendSetPrice(provider.sender(), {
        price: BigInt(parseInt(await ui.input("Price for 1 TON in jettons: ")) * (10 ** parseInt(await ui.input("Decimals:")))),
    });

    ui.write('Sending message...');
}