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

    const contractBefore = await contract.getJettonWallet();

    const jetton_address = Address.parse(await ui.input("Jetton address: "));

    const masterContract_code = JettonMaster.create(jetton_address);
    const masterContract = provider.open(masterContract_code);
    const jetton_wallet = await masterContract.getWalletAddress(address);

    await contract.sendSetJettonWallet(provider.sender(), {
        jetton_wallet: jetton_wallet,
    });

    ui.write('Saving jetton wallet...');

    let contractAfter = await contract.getJettonWallet();
    let attempt = 1;
    while (contractAfter === contractBefore) {
        ui.setActionPrompt(`Attempt ${attempt}`);
        await sleep(2000);
        contractAfter = await contract.getJettonWallet();
        attempt++;
    }

    ui.clearActionPrompt();
    ui.write('Jetton wallet saved successfully!');
}