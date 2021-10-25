let qs = new URLSearchParams(location.search)

export default {
    DEBUG: qs.has("debug")
}