const { Events, ChannelType } = require('discord.js');

// Définir les membres du staff avec leurs IDs
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
        { name: 'Romain', id: '689538185310502917' },
        { name: 'Lockey', id: '967846828647252048' }
    ]
};

// Couleurs et leurs emojis
const COLORS = {
    'vert': '🟢',
    'rouge': '🔴',
    'orange': '🟠'
};

// Stocker les couleurs en mémoire
const staffColors = Object.fromEntries(
    Object.values(STAFF_MEMBERS).flat().map(member => [member.id, COLORS['rouge']]) // Rouge par défaut
);

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
        console.log('Presence Update Event Triggered');

        if (!newPresence.member) {
            console.error('PresenceUpdate event does not have a member.');
            return;
        }

        const member = newPresence.member;

        // Vérifiez si le membre appartient au staff
        const isStaff = Object.values(STAFF_MEMBERS).flat().some(staff => staff.id === member.id);
        if (!isStaff) {
            console.log(`Member ${member.user.tag} (${member.id}) is not in the staff.`);
            return; // Si le membre n'est pas dans le staff, ne rien faire
        }

        // Log de vérification pour s'assurer que le membre est dans le staff
        console.log(`Member ${member.user.tag} (${member.id}) is in the staff.`);

        const memberId = member.id;
        let newColor = COLORS['rouge']; // Valeur par défaut

        // Vérifiez les statuts de présence
        if (newPresence.status === 'online' || newPresence.status === 'idle') {
            newColor = COLORS['vert']; // En ligne ou inactif (en ligne sur mobile)
        } else if (newPresence.status === 'dnd') {
            newColor = COLORS['orange']; // Ne pas déranger
        } else {
            newColor = COLORS['rouge']; // Hors ligne ou invisible
        }

        // Mettre à jour la couleur en mémoire
        staffColors[memberId] = newColor;
        console.log(`Updated color for ${member.user.tag} to ${newColor}`);

        // Mettre à jour le message de présence
        if (presenceChannel && presenceChannel.type === ChannelType.GuildText) {
            try {
                await updatePresenceMessage(presenceChannel);
            } catch (error) {
                console.error('Error updating presence message:', error);
            }
        } else {
            console.error(`Channel with ID ${presenceChannelId} is not a text channel or does not exist.`);
        }
    });

    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isCommand()) return;

        const { commandName } = interaction;

        if (commandName === 'présences') {
            if (presenceChannel && presenceChannel.type === ChannelType.GuildText) {
                try {
                    await updatePresenceMessage(presenceChannel);
                } catch (error) {
                    console.error('Error updating presence message:', error);
                }
            } else {
                console.error(`Channel with ID ${presenceChannelId} is not a text channel or does not exist.`);
            }
        }
    });

    async function updatePresenceMessage(channel) {
        console.log('Updating Presence Message');
        try {
            const staffEntries = Object.values(STAFF_MEMBERS).flat();
            const presenceList = staffEntries.map(({ name, id }) => {
                const color = staffColors[id] || COLORS['rouge']; // Rouge par défaut
                return `${color} ${name}`;
            }).join('\n');

            // Effacer l'ancien message et envoyer le nouveau
            const messages = await channel.messages.fetch();
            const oldPresenceMessage = messages.find(msg => msg.author.id === client.user.id);
            if (oldPresenceMessage) {
                console.log('Deleting old presence message.');
                await oldPresenceMessage.delete();
            }

            const legend = `
**Légende des couleurs :**
- 🟢 : Présent
- 🟠 : Ne pas déranger
- 🔴 : Non présent`;

            console.log('Sending new presence message.');
            await channel.send(`**Présences :**\n${presenceList}\n\n${legend}`);
        } catch (error) {
            console.error('Error during presence message update:', error);
        }
    }
};
