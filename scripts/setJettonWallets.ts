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

    const old_jetton_address = Address.parse("kQCKL0wsvuI83eVeKXHRgNNgFUBLsvCUpX1SFEoOyOxEx_nl");
    const new_jetton_address = Address.parse("kQAnGinz-2A3HS28SETLF0XnDJkR25mTyyg_4W6r99YJsTTK");

    const old_masterContract_code = JettonMaster.create(old_jetton_address);
    const old_masterContract = provider.open(old_masterContract_code);
    const old_jetton_wallet = await old_masterContract.getWalletAddress(address);

    const new_masterContract_code = JettonMaster.create(new_jetton_address);
    const new_masterContract = provider.open(new_masterContract_code);
    const new_jetton_wallet = await new_masterContract.getWalletAddress(address);

    await contract.sendSetJettonWallets(provider.sender(), {
        old_jetton_wallet: old_jetton_wallet,
        old_jetton_decimals: 5,
        new_jetton_wallet: new_jetton_wallet,
        new_jetton_decimals: 9,
    });

    ui.write('Saving jetton wallets...');

    let contractAfter = await contract.getJettonWallets();
    let attempt = 1;
    while (contractAfter === contractBefore) {
        ui.setActionPrompt(`Attempt ${attempt}`);
        await sleep(2000);
        contractAfter = await contract.getJettonWallets();
        attempt++;
    }

    ui.clearActionPrompt();
    ui.write('Jetton wallets saved successfully!');
}