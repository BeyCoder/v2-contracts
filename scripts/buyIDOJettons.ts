import {Address, beginCell, SendMode, toNano} from 'ton-core';
import { SwapToV2Contract } from '../wrappers/SwapToV2Contract';
import { NetworkProvider, sleep } from '@ton-community/blueprint';
import {JettonMaster, JettonWallet} from "ton";
import {IDO} from "../wrappers/IDO";

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Contract address:'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const contract = provider.open(IDO.createFromAddress(address));

    const contractBefore = await contract.getSoldJettonAmount();

    contract.sendBuy(provider.sender(), {
        amount: toNano(await ui.input("Amount of TON: "))
    })

    ui.write(`Handling... Total sold: ${contractBefore}`);

    let contractAfter = await contract.getSoldJettonAmount();
    let attempt = 1;
    while (contractAfter === contractBefore) {
        ui.setActionPrompt(`Attempt ${attempt}`);
        await sleep(2000);
        contractAfter = await contract.getSoldJettonAmount();
        attempt++;
    }

    ui.clearActionPrompt();
    ui.write(`Buy operation is success! Total sold: ${contractAfter}`);
}