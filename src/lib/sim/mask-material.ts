import { ColorRepresentation, CustomBlending, MaxEquation, MeshBasicMaterial, OneFactor } from "three"

// writes a flat channel with union blending: order independent, per channel,
// and keeps antialiased edge pixels 
export class MaskMaterial extends MeshBasicMaterial {
    constructor(color: ColorRepresentation = 0xffffff) {
        super({
            color,
            fog: false,
            toneMapped: false,
            depthTest: false,
            depthWrite: false,
            blending: CustomBlending,
            blendEquation: MaxEquation,
            blendSrc: OneFactor,
            blendDst: OneFactor,
        })
    }
}
