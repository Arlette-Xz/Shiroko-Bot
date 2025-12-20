import { readFileSync, writeFileSync, existsSync } from 'fs'

const { initAuthCreds, BufferJSON, proto } = (await import('@whiskeysockets/baileys')).default

function bind(conn) {
    if (!conn.chats) conn.chats = {}
    
    function updateNameToDb(contacts) {
        if (!contacts) return
        try {
            const list = contacts.contacts || contacts
            for (const contact of list) {
                const id = conn.decodeJid(contact.id)
                if (!id || id === 'status@broadcast') continue
                
                let chats = conn.chats[id]
                if (!chats) chats = conn.chats[id] = { ...contact, id }
                
                const isGroup = id.endsWith('@g.us')
                const extraData = isGroup ? 
                    { subject: contact.subject || contact.name || chats.subject || '' } : 
                    { name: contact.notify || contact.name || chats.name || chats.notify || '' }

                conn.chats[id] = {
                    ...chats,
                    ...contact,
                    id,
                    ...extraData
                }
            }
        } catch (e) {
            console.error(e)
        }
    }

    conn.ev.on('contacts.upsert', updateNameToDb)
    conn.ev.on('groups.update', updateNameToDb)
    conn.ev.on('contacts.set', updateNameToDb)
    
    conn.ev.on('chats.set', async ({ chats }) => {
        try {
            for (let chat of chats) {
                let id = conn.decodeJid(chat.id)
                if (!id || id === 'status@broadcast') continue
                
                const isGroup = id.endsWith('@g.us')
                let storedChat = conn.chats[id]
                if (!storedChat) storedChat = conn.chats[id] = { id }
                
                storedChat.isChats = !chat.readOnly
                if (chat.name) storedChat[isGroup ? 'subject' : 'name'] = chat.name
                
                if (isGroup) {
                    const metadata = await conn.groupMetadata(id).catch(() => null)
                    if (chat.name || (metadata && metadata.subject)) {
                        storedChat.subject = chat.name || metadata.subject
                    }
                    if (!metadata) continue
                    storedChat.metadata = metadata
                }
            }
        } catch (e) {
            console.error(e)
        }
    })

    conn.ev.on('group-participants.update', async ({ id, participants, action }) => {
        if (!id) return
        id = conn.decodeJid(id)
        if (id === 'status@broadcast') return
        if (!(id in conn.chats)) conn.chats[id] = { id }
        let chats = conn.chats[id]
        chats.isChats = true
        const groupMetadata = await conn.groupMetadata(id).catch(() => null)
        if (!groupMetadata) return
        chats.subject = groupMetadata.subject
        chats.metadata = groupMetadata
    })

    conn.ev.on('groups.update', async (groupsUpdates) => {
        try {
            for (const update of groupsUpdates) {
                const id = conn.decodeJid(update.id)
                if (!id || id === 'status@broadcast') continue
                if (!id.endsWith('@g.us')) continue
                
                let chats = conn.chats[id]
                if (!chats) chats = conn.chats[id] = { id }
                chats.isChats = true
                const metadata = await conn.groupMetadata(id).catch(() => null)
                if (metadata) chats.metadata = metadata
                if (update.subject || (metadata && metadata.subject)) {
                    chats.subject = update.subject || metadata.subject
                }
            }
        } catch (e) {
            console.error(e)
        }
    })

    conn.ev.on('chats.upsert', (chatsUpsert) => {
        try {
            const { id } = chatsUpsert
            if (!id || id === 'status@broadcast') return
            conn.chats[id] = { ...(conn.chats[id] || {}), ...chatsUpsert, isChats: true }
            if (id.endsWith('@g.us')) conn.insertAllGroup().catch(() => null)
        } catch (e) {
            console.error(e)
        }
    })

    conn.ev.on('presence.update', async ({ id, presences }) => {
        try {
            const sender = Object.keys(presences)[0] || id
            const _sender = conn.decodeJid(sender)
            const presence = presences[sender] && presences[sender].lastKnownPresence ? presences[sender].lastKnownPresence : 'composing'
            
            let chats = conn.chats[_sender]
            if (!chats) chats = conn.chats[_sender] = { id: sender }
            chats.presences = presence
            
            if (id.endsWith('@g.us')) {
                if (!conn.chats[id]) conn.chats[id] = { id }
            }
        } catch (e) {
            console.error(e)
        }
    })
}

const KEY_MAP = {
    'pre-key': 'preKeys',
    'session': 'sessions',
    'sender-key': 'senderKeys',
    'app-state-sync-key': 'appStateSyncKeys',
    'app-state-sync-version': 'appStateVersions',
    'sender-key-memory': 'senderKeyMemory'
}

function useSingleFileAuthState(filename, logger) {
    let creds, keys = {}, saveCount = 0
    
    const saveState = (forceSave) => {
        if (logger && logger.trace) logger.trace('saving auth state')
        saveCount++
        if (forceSave || saveCount > 5) {
            writeFileSync(
                filename,
                JSON.stringify({ creds, keys }, BufferJSON.replacer, 2)
            )
            saveCount = 0
        }
    }

    if (existsSync(filename)) {
        const result = JSON.parse(
            readFileSync(filename, { encoding: 'utf-8' }),
            BufferJSON.reviver
        )
        creds = result.creds
        keys = result.keys
    } else {
        creds = initAuthCreds()
        keys = {}
    }

    return {
        state: {
            creds,
            keys: {
                get: (type, ids) => {
                    const key = KEY_MAP[type]
                    return ids.reduce((dict, id) => {
                        let value = keys[key] && keys[key][id] ? keys[key][id] : null
                        if (value) {
                            if (type === 'app-state-sync-key') {
                                value = proto.AppStateSyncKeyData.fromObject(value)
                            }
                            dict[id] = value
                        }
                        return dict
                    }, {})
                },
                set: (data) => {
                    for (const _key in data) {
                        const key = KEY_MAP[_key]
                        keys[key] = keys[key] || {}
                        Object.assign(keys[key], data[_key])
                    }
                    saveState()
                }
            }
        },
        saveState
    }
}

export default {
    bind,
    useSingleFileAuthState
}
