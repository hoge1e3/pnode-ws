import type { Menus, Menu, ShowModal, RootPackageJSON } from "./types.js";
import { insertBootDisk, readPackagejson, wireUI } from "./boot.js";
import { getValue } from "./global.js";
import { btn, showModal, splash, rmbtn as rmbtnWithoutQuick, uploadFile } from "./ui.js";
import { blob2arrayBuffer, can, getEnv } from "./util.js";

export function rmbtn(): void {
    rmbtnWithoutQuick();
}

wireUI({ rmbtn, showModal, splash });

export async function showMenus(): Promise<void> {
    await showMainmenus();
    btn(["💾", "Add Cartridge"], () => insertBootDisk());
    btn(["💻", "Console"], () => showConsole());
}

function showConsole(): void {
    const vConsole = getValue("vConsole");
    if (vConsole) vConsole.show();           
}

export function parseMenus(menus: Menus): Menus {
    for (let k in menus) {
        const main = menus[k];
        if (typeof main === "string") {
            menus[k] = { main };
        }
    }
    return menus;
}

export async function showMainmenus(): Promise<void> {
    const o = await readPackagejson();
    if (!o.menus) return;
    const menus = parseMenus(o.menus);
    let hasAuto: boolean | undefined;
    for (let k in menus) {
        const v = menus[k];
        if (v.auto) hasAuto = true;
        let c: string | string[] = k;
        if (v.icontext) {
            c = [v.icontext, k];
        }
        btn(c, () => runMenu(k, v));
    }
}

export async function runMenu(k: string, v: Menu): Promise<void> {
    try {
        const sp = showModal(".splash");
        await splash("Launching " + k, sp);
        const { main, auto, submenus } = v;
        rmbtn();
        const mod = await import(/* webpackIgnore: true */main);
        await splash("impored " + k, sp);
        if (v.call) {
            const [n, ...a] = v.call;
            mod[n](...a);
        } else {
            if (can(mod, "onInitCartridge")) {
                await mod.onInitCartridge(v);
            }
        }
    } finally {
        showModal(false);
    }
}
