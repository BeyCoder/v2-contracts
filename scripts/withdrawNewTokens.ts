import { Address, toNano } from 'ton-core';
import { SwapToV2Contract } from '../wrappers/SwapToV2Contract';
import { NetworkProvider, sleep } from '@ton-community/blueprint';
import {JettonMaster} from "ton";

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Contract address:'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const contract = provider.open(SwapToV2Contract.createFromAddress(address));

    const contractBefore = await contract.getJettonWallets();

    const jetton_address = Address.parse(await ui.input("New jetton address:"));

    const masterContract_code = JettonMaster.create(jetton_address);
    const masterContract = provider.open(masterContract_code);

    const amount = parseInt(await ui.input("New jettons for withdraw:"));
    await contract.sendWithdrawNewJettons(provider.sender(), {
        amount: amount,
        decimals: contractBefore.new_jetton_decimals,
    });

    ui.write('Sending...');

    let contractAfter = await contract.getJettonWallets();
    let attempt = 1;
    while (contractAfter === contractBefore) {
        ui.setActionPrompt(`Attempt ${attempt}`);
        await sleep(2000);
        contractAfter = await contract.getJettonWallets();
        attempt++;
    }

    ui.clearActionPrompt();
    ui.write('Transaction sent!');
}