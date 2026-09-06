const search = window.location.search.toLowerCase()

const config = {
    debug: search.includes("debug"),
    stats: search.includes("stats"),
} as const

export default config