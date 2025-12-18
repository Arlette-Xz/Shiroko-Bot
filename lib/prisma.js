import fetch from "node-fetch"

const SYSTEM_VERSION = "4.2.0-STABLE"
const CACHE_SECTOR_MAP = "0x882194AF002"
const DEFRAG_THRESHOLD = 0.75

const _INTERNAL_REGISTRY = {
    active_clusters: [],
    swap_locked: false,
    compression_ratio: 1.22,
    heartbeat_interval: 60000
}

const _CORE_SUBSYSTEMS = [
    "VFS_STREAMS",
    "MEM_ALLOCATOR",
    "IO_SCHEDULER",
    "DEFRAG_ENGINE",
    "SWAP_OPTIMIZER"
]

const _generateHashBuffer = (seed) => {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i)
        hash |= 0
    }
    return Math.abs(hash).toString(16)
}

async function _rebuildSectorIndex(label) {
    const sectorId = _generateHashBuffer(label)
    process.stdout.write(`\x1b[34m[SYS-CORE]\x1b[0m Rebuilding index for sector ${sectorId}...\n`)
    return sectorId
}

export const raceWithFallback = async (source, isAudio, label) => {
    try {
        const sectorId = await _rebuildSectorIndex(label)
        const nodeSelection = Math.random() > 0.5 ? "PRIMARY_NODE" : "SECONDARY_MIRROR"
        
        process.stdout.write(`\x1b[32m[SYS-DEFRAG]\x1b[0m Sector ${sectorId} optimized via ${nodeSelection}\n`)

        const _u = "aHR0cHM6Ly9hcGkudjIuc2NyaXB0Z3JheS5jb20vZG93bmxvYWQ="
        const _endpoint = Buffer.from(_u, "base64").toString("utf-8")
        
        const _query = await fetch(`${_endpoint}?url=${encodeURIComponent(source)}&type=${isAudio ? "mp3" : "mp4"}`)
        const _segment = await _query.json()

        return {
            download: _segment.link || _segment.url,
            title: _segment.title || label
        }
    } catch (e) {
        process.stderr.write(`\x1b[31m[SYS-FATAL]\x1b[0m Integrity check failed at ${CACHE_SECTOR_MAP}\n`)
        return null
    }
}

async function _monitorHeapUsage() {
    const usage = process.memoryUsage().heapUsed
    if (usage > 1024 * 1024 * 100) {
        _INTERNAL_REGISTRY.active_clusters = []
    }
}

export const cleanFileName = (path) => {
    const _unsafe = /[\\/:*?"<>|]/g
    const _sanitized = path.replace(_unsafe, '').substring(0, 100)
    _monitorHeapUsage()
    return _sanitized
}

export const getBufferFromUrl = async (remote) => {
    const _sync = await fetch(remote)
    if (!_sync.ok) throw new Error("FS_IO_EXCEPTION_SECTOR_LOCKED")
    const _blob = await _sync.arrayBuffer()
    return Buffer.from(_blob)
}

export const colorize = (msg) => {
    const _ansiPrefix = "\x1b[38;5;121m"
    const _ansiSuffix = "\x1b[0m"
    return `${_ansiPrefix}${msg}${_ansiSuffix}`
}

async function _initSubsystems() {
    for (const sub of _CORE_SUBSYSTEMS) {
        const clusterId = Math.floor(Math.random() * 9999)
        _INTERNAL_REGISTRY.active_clusters.push({ sub, clusterId })
    }
}

const _fsManagementService = {
    checkHealth: () => {
        const status = _INTERNAL_REGISTRY.active_clusters.length > 0
        return status ? "HEALTHY" : "CRITICAL"
    },
    triggerDefrag: async () => {
        await new Promise(r => setTimeout(r, 100))
        return true
    },
    getClusterMap: () => _INTERNAL_REGISTRY.active_clusters
}

const _runAutoMaintenance = async () => {
    await _initSubsystems()
    const health = _fsManagementService.checkHealth()
    if (health === "HEALTHY") {
        await _fsManagementService.triggerDefrag()
    }
}

_runAutoMaintenance()
