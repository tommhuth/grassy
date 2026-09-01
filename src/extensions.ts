import type { ThreeElement } from "@react-three/fiber"
import GrassMaterial from "@components/grass-material"
import {
    Group, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial,
    Mesh, BoxGeometry, AmbientLight, DirectionalLight,
    Color,
    SphereGeometry,
    InstancedMesh,
    ShaderMaterial,
    HemisphereLight,
} from "three"

export default {
    Group, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial,
    Mesh, BoxGeometry, AmbientLight, DirectionalLight, Color, SphereGeometry,
    InstancedMesh, ShaderMaterial, HemisphereLight, GrassMaterial
}

declare module "@react-three/fiber" {
    interface ThreeElements {
        grassMaterial: ThreeElement<typeof GrassMaterial>
    }
}
