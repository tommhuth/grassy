import random from "@huth/random"
import { useMemo } from "react"
import Danger from "./Danger"
import { useStore } from "./data/store"

function cycle(list = []) {
    let i = 0

    return () => {
        let res = list[(i++) % list.length] 

        return res
    }
}

export default function Dangers() {
    let worldSize = useStore(i => i.world.size)
    let difficultyLevel = useStore(i => i.world.difficultyLevel)
    let dangers = useMemo(() => {
        let nextRadius = cycle([.15, .25, .5, .65, .75])

        return new Array(difficultyLevel).fill().map(() => {
            let halfExtends = worldSize / 2 * 1.1

            return {
                id: random.id(),
                radius: nextRadius(),
                position: [random.float(-halfExtends, halfExtends), 0, random.float(-halfExtends, halfExtends)]
            }
        })
    }, [difficultyLevel, worldSize])  

    return (
        <>
            {dangers.map((i, index) => {
                return <Danger {...i} key={i.id} index={index} />
            })}
        </>
    )
}