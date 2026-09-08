import { ClampToEdgeWrapping, LinearFilter, WebGLRenderTarget } from "three"

export class SimRenderTarget extends WebGLRenderTarget {
    constructor(size: number, name: string) {
        super(size, size, {
            depthBuffer: false,
            stencilBuffer: false,
            samples: 0,
            generateMipmaps: false,
            minFilter: LinearFilter, // load bearing: the blur taps land between texel centers
            magFilter: LinearFilter,
            wrapS: ClampToEdgeWrapping,
            wrapT: ClampToEdgeWrapping,
        })

        this.texture.name = name
    }
}
