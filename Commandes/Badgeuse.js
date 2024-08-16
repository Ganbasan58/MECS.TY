const { Events, ChannelType } = require('discord.js');

const STAFF_MEMBERS = {
    'Créateurs': [
        { name: 'Slayzox', id: '1233497513349222421' }
    ],
    'Co-Créateurs': [
        { name: 'Dada', id: '1030600858544656405' },
        { name: 'Illuzory', id: '637095720184315904' }
    ],
    'Administrateurs': [
        { name: 'Kevone', id: '1117215289118036039' },
        { name: 'Dark Angel', id: '959402622304006144' }
    ],
    'Modérateurs': [
        { name: 'Lockey', id: '967846828647252048' }
    ]
};

const COLORS = {
    'vert': '🟢',
    'rouge': '🔴',
    'orange': '🟠'
};

const staffColors = Object.fromEntries(
    Object.values(STAFF_MEMBERS).flat().map(member => [member.id, COLORS['rouge']])
);

let lastPresenceMessageId = null;
let lastUpdate = 0;
const UPDATE_INTERVAL = 60000;

module.exports = (client, presenceChannelId) => {
    let presenceChannel = null;

    client.once(Events.ClientReady, () => {
        console.log('Badgeuse module: Client is ready');
        presenceChannel = client.channels.cache.get(presenceChannelId);

        if (presenceChannel && presenceChannel.type === ChannelType.GuildText) {
            updatePresenceMessage(presenceChannel);
        } else {
            console.error(`Channel with ID ${presenceChannelId} is not a text channel or does not exist.`);
        }
    });

    client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
        if (!newPresence.member) return;

        const member = newPresence.member;

        const isStaff = Object.values(STAFF_MEMBERS).flat().some(staff => staff.id === member.id);
        if (!isStaff) return;

        const memberId = member.id;
        let newColor = COLORS['rouge'];

        if (newPresence.status === 'online' || newPresence.status === 'idle') {
            newColor = COLORS['vert'];
        } else if (newPresence.status === 'dnd') {
            newColor = COLORS['orange'];
        }

        if (staffColors[memberId] !== newColor) {
            staffColors[memberId] = newColor;

            const now = Date.now();
            if (now - lastUpdate >= UPDATE_INTERVAL) {
                lastUpdate = now;
                try {
                    await updatePresenceMessage(presenceChannel);
                } catch (error) {
                    console.error('Error updating presence message:', error);
                }
            }
        }
    });

    async function updatePresenceMessage(channel) {
        try {
            const presenceList = Object.values(STAFF_MEMBERS).flat().map(({ name, id }) => {
                const color = staffColors[id] || COLORS['rouge'];
                return `${color} ${name}`;
            }).join('\n');

            if (lastPresenceMessageId) {
                try {
                    const oldPresenceMessage = await channel.messages.fetch(lastPresenceMessageId);
                    if (oldPresenceMessage) await oldPresenceMessage.delete();
                } catch (error) {
                    console.error('Error fetching or deleting old presence message:', error);
                }
            }

            const legend = `
**Légende des couleurs :**
- 🟢 : Présent
- 🟠 : Ne pas déranger
- 🔴 : Non présent`;

            const newMessage = await channel.send(`**Présences :**\n${presenceList}\n\n${legend}`);
            lastPresenceMessageId = newMessage.id;
        } catch (error) {
            console.error('Error during presence message update:', error);
        }
    }
};
