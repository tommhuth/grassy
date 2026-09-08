import { MeshBasicMaterial } from "three"

export class FadeMaterial extends MeshBasicMaterial {
    constructor() {
        super({
            color: 0x000000,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            toneMapped: false,
        })
    }
}
