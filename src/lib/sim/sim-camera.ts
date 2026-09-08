import { OrthographicCamera } from "three"
import { worldSize } from "./const"

export class SimCamera extends OrthographicCamera {
    constructor() {
        super(-worldSize / 2, worldSize / 2, worldSize / 2, -worldSize / 2, 0, 100)

        this.position.set(0, 10, 0)
        // explicit, the default up is parallel to the view direction and lookAt
        // only escapes that degeneracy by nudging the basis with an epsilon
        this.up.set(0, 0, -1)
        this.lookAt(0, 0, 0)
    }
}
