export const worldSize = 40
export const textureSize = 400
// 1:1 with the source. the ao pass is only textsize^2 fragments, so
// downsampling bought nothing but resampling math to get wrong, and a low res
// mask magnified onto the ground reads boxy no matter how good the kernel is
export const aoSize = textureSize
// world units
export const dilation = .5

// uDirection is in texels, so scale is the tap spacing: the coarse radius knob.
// iterations compose two gaussians into a wider one, sigma adding in quadrature
// (sqrt(n)), and they also fill the gaps that a spacing above 2 leaves behind
export const blurScale = 2
export const blurIterations = 2

// scale of noise height
export const grassWildness = .975
// xz footprint of the patch in grass.glb (bbox is 5.97 x 5.86)
export const grassPatchSize = 6
// patches step less than their footprint so the random per patch rotation cannot open a seam
export const grassStep = grassPatchSize * .85
// smallest grid that still covers worldsize: (n - 1) steps plus one whole patch
export const grassCount = Math.ceil((worldSize - grassPatchSize) / grassStep) + 1

export const layers = {
    obstacle: 2,
    player: 3
} as const
