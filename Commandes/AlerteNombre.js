const { EmbedBuilder } = require('discord.js');

// Constantes pour les IDs des canaux et rôles
const ALERT_CHANNEL_ID = '1241404218485637171'; // Remplacez par l'ID du canal d'alerte
const VERIFICATEUR_ROLE_ID = '1234937665925943377'; // Remplacez par l'ID du rôle vérificateur
const STAFF_ROLE_ID = '1234937665925943378'; // Remplacez par l'ID du rôle staff

// Liste des IDs des salons à exclure
const EXCLUDED_CHANNEL_IDS = [
    '1272275397303734293', // Roulette
    '1272275358183325738', // Commande
    '1272275437564723335', // BlackJack
    '1272275473656713339'  // Slot
];

// Objectif : Conserver les IDs des messages pour lesquels des alertes ont été créées
const alertsMap = new Map();

/**
 * Fonction pour gérer les messages et créer des alertes lorsque des nombres entre 1 et 17 sont détectés.
 * @param {Client} client - L'instance du client Discord.
 */
module.exports = (client) => {
    client.on('messageCreate', async message => {
        if (message.author.bot || !message.guild) return;

        // Ignorer les messages des salons spécifiés
        if (EXCLUDED_CHANNEL_IDS.includes(message.channel.id)) {
            return;
        }

        // Vérifiez si l'auteur du message a le rôle staff
        const member = await message.guild.members.fetch(message.author.id);
        if (member.roles.cache.has(STAFF_ROLE_ID)) {
            console.log('Un membre avec le rôle staff a envoyé ce message. Aucune alerte ne sera créée.');
            return;
        }

        const numbers = message.content.match(/\b\d+\b/g);
        if (numbers) {
            const containsNumberBetween1And17 = numbers.some(num => parseInt(num) >= 1 && parseInt(num) <= 17);
            if (containsNumberBetween1And17) {
                const alertChannel = message.guild.channels.cache.get(ALERT_CHANNEL_ID);
                const verificateurRole = message.guild.roles.cache.get(VERIFICATEUR_ROLE_ID);

                if (!alertChannel) {
                    console.error(`Le canal d'alerte avec l'ID ${ALERT_CHANNEL_ID} est introuvable.`);
                    return;
                }

                if (!verificateurRole) {
                    console.error(`Le rôle vérificateur avec l'ID ${VERIFICATEUR_ROLE_ID} est introuvable.`);
                    return;
                }

                const embed = new EmbedBuilder()
                    .setColor(0xFFFF00) // Couleur jaune
                    .setTitle('Alerte : Nombre entre 1 et 17 détecté')
                    .setDescription(`${message.author} a envoyé un message contenant un nombre entre 1 et 17 dans le salon ${message.channel}.`)
                    .addFields(
                        { name: 'Message', value: message.content },
                        { name: 'Statut', value: '❌ | Non traitée' }
                    )
                    .setTimestamp();

                try {
                    const alertMessage = await alertChannel.send({ content: `${verificateurRole}`, embeds: [embed] });
                    await alertMessage.react('🟠'); // Réaction pour "En cours de traitement"
                    await alertMessage.react('✅'); // Réaction pour "Traitée"
                    await alertMessage.react('❌'); // Réaction pour "RAS"

                    // Stocker l'alerte avec l'ID du message d'origine
                    alertsMap.set(message.id, alertMessage.id);

                    const filter = (reaction, user) => {
                        return ['🟠', '✅', '❌'].includes(reaction.emoji.name) && !user.bot;
                    };

                    const collector = alertMessage.createReactionCollector({ filter, time: 259200000 }); // 72 heures en millisecondes

                    collector.on('collect', async (reaction, user) => {
                        if (!user) return;

                        const userName = user.username;
                        // Vérifiez si l'utilisateur a le rôle vérificateur
                        const member = await message.guild.members.fetch(user.id);
                        const hasVerificateurRole = member.roles.cache.has(VERIFICATEUR_ROLE_ID);

                        if (!hasVerificateurRole) {
                            await alertMessage.reply(`${userName}, vous devez avoir le rôle vérificateur pour gérer cette alerte.`);
                            return;
                        }

                        const statusField = embed.data.fields.find(field => field.name === 'Statut');
                        if (!statusField) {
                            console.error('Le champ "Statut" est introuvable dans l\'embed.');
                            return;
                        }

                        if (reaction.emoji.name === '✅') {
                            statusField.value = `✅ | Traité par ${userName}`;
                            await alertMessage.edit({ embeds: [embed] });
                            await alertMessage.reply(`L'alerte est traitée par ${userName}`);
                            await alertMessage.reactions.removeAll(); // Efface toutes les réactions du message
                            collector.stop(); // Arrêter le collecteur après le traitement
                        } else if (reaction.emoji.name === '❌') {
                            statusField.value = `✅ | RAS`;
                            await alertMessage.edit({ embeds: [embed] });
                            await alertMessage.reply(`L'alerte est marquée RAS par ${userName}`);
                            await alertMessage.reactions.removeAll(); // Efface toutes les réactions du message
                            collector.stop(); // Arrêter le collecteur après le traitement
                        } else if (reaction.emoji.name === '🟠') {
                            statusField.value = `🟠 | En cours de traitement par ${userName}`;
                            await alertMessage.edit({ embeds: [embed] });
                            await alertMessage.reply(`L'alerte est en cours de traitement par ${userName}`);
                        }
                    });

                    collector.on('end', async collected => {
                        const statusField = embed.data.fields.find(field => field.name === 'Statut');
                        if (!collected.some(reaction => reaction.emoji.name === '✅' || reaction.emoji.name === '❌')) {
                            // Ne pas afficher le message si l'alerte est marquée comme traitée ou RAS
                            if (statusField && statusField.value === '❌ | Non traitée') {
                                statusField.value = '❌ | Non traitée';
                                await alertMessage.edit({ embeds: [embed] });
                                // Pas de message supplémentaire ici
                            }
                        }
                    });
                } catch (error) {
                    console.error('Erreur lors de l\'envoi de l\'alerte ou de la gestion des réactions :', error);
                }
            }
        }
    });

    client.on('messageDelete', async (message) => {
        // Vérifiez si l'ID du message supprimé existe dans la Map
        if (alertsMap.has(message.id)) {
            const alertMessageId = alertsMap.get(message.id);
            const alertChannel = client.channels.cache.get(ALERT_CHANNEL_ID);

            if (alertChannel) {
                try {
                    const alertMessage = await alertChannel.messages.fetch(alertMessageId);
                    const embed = alertMessage.embeds[0];
                    
                    if (embed) {
                        const statusField = embed.data.fields.find(field => field.name === 'Statut');
                        if (statusField) {
                            // Changer le statut uniquement si le statut actuel n'est pas "Traitée" ou "RAS"
                            if (statusField.value === '❌ | Non traitée') {
                                statusField.value = '🚮 | Message supprimé';
                                await alertMessage.edit({ embeds: [embed] });
                                await alertMessage.reply('Le message d\'origine a été supprimé.');
                            }
                        }
                    }
                } catch (error) {
                    console.error('Erreur lors de la récupération ou de la modification du message d\'alerte :', error);
                }
            } else {
                console.error(`Le canal d'alerte avec l'ID ${ALERT_CHANNEL_ID} est introuvable.`);
            }
        }
    });
};
