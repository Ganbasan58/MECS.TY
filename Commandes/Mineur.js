const { EmbedBuilder, PermissionsBitField, AttachmentBuilder } = require('discord.js');
const fs = require('fs');

const minorRoleID = '1234937665762365563'; // ID du rôle mineur
const verificateursRoleID = '1234937665925943377'; // ID du rôle vérificateurs
const discussionsChannelID = '1241404218485637171'; // ID du salon discussions
const femmeRoleID = '1234937665879539735'; // ID du rôle Femme
const ticketCategoryID = '1234954130389340271'; // ID de la catégorie des tickets
const logsChannelID = '1262868686314934364'; // ID du salon logs ticket
const staffRoleID = '1234954130389340272'; // ID du rôle Staff
const banTimers = new Map(); // Pour stocker les minuteries de bannissement

// Fonction pour obtenir le message en fonction de l'heure
const getGreetingMessage = (user) => {
    const now = new Date();
    const hour = now.getHours();
    const userMention = `<@${user.id}>`;
    return hour >= 6 && hour < 19
        ? `Bonjour, quel est votre âge et date de naissance s'il vous plaît ? ${userMention}`
        : `Bonsoir, quel est votre âge et date de naissance s'il vous plaît ? ${userMention}`;
};

// Fonction pour bannir un membre après un délai
const scheduleBan = async (member, roleName, alertMessage) => {
    try {
        console.log(`Planification du bannissement pour ${member.user.tag} avec le rôle ${roleName}.`);
        const reason = `Bannissement automatique : Rôle ${roleName} non supprimé après 15 secondes`;
        await member.ban({ reason });
        console.log(`Le membre ${member.user.tag} a été banni pour avoir maintenu le rôle ${roleName}.`);

        if (alertMessage && alertMessage.embeds && alertMessage.embeds.length > 0) {
            const embed = alertMessage.embeds[0];
            const updatedEmbed = EmbedBuilder.from(embed).setFields([{ name: 'Statut', value: '❌ | BANNI' }]);
            await alertMessage.edit({ embeds: [updatedEmbed] });
            await alertMessage.reply(`L'alerte est mise à jour : ${member.user.tag} a été banni.`);
            await alertMessage.reactions.removeAll(); // Efface toutes les réactions du message
        } else {
            console.error('alertMessage ou alertMessage.embeds est indéfini');
        }
    } catch (error) {
        console.error(`Erreur lors du bannissement du membre ${member.user.tag}:`, error);
    }
};

// Classe Mineur
class Mineur {
    constructor() {
        this.name = 'mineur';
        this.description = 'Gère les alertes et les tickets pour les rôles mineur et femme';
    }

    async execute(oldMember, newMember) {
        if (!newMember || !oldMember || !newMember.guild) {
            console.error("newMember, oldMember ou newMember.guild est undefined !");
            return;
        }

        const minorRole = newMember.guild.roles.cache.get(minorRoleID);
        const verificateursRole = newMember.guild.roles.cache.get(verificateursRoleID);
        const discussionsChannel = newMember.guild.channels.cache.get(discussionsChannelID);
        const femmeRole = newMember.guild.roles.cache.get(femmeRoleID);
        const logsChannel = newMember.guild.channels.cache.get(logsChannelID);
        const staffRole = newMember.guild.roles.cache.get(staffRoleID);

        if (!minorRole || !verificateursRole || !discussionsChannel || !femmeRole || !logsChannel) {
            console.error('Un ou plusieurs rôles ou salons sont manquants.');
            return;
        }

        const oldHasMinorRole = oldMember.roles.cache.has(minorRoleID);
        const newHasMinorRole = newMember.roles.cache.has(minorRoleID);
        const oldHasFemmeRole = oldMember.roles.cache.has(femmeRoleID);
        const newHasFemmeRole = newMember.roles.cache.has(femmeRoleID);

        const sendAlert = async (roleName, roleID, alertTitle) => {
            if (newMember.roles.cache.has(verificateursRoleID) || newMember.roles.cache.has(staffRoleID)) {
                console.log(`Le membre ${newMember.user.tag} a pris le rôle ${roleName}, mais possède un rôle exempté. Aucun bannissement nécessaire.`);
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0xFFFF00) // Couleur jaune
                .setTitle(alertTitle)
                .setDescription(`${newMember.user} a pris le rôle ${roleName}!`)
                .setTimestamp();

            if (roleID === minorRoleID || roleID === femmeRoleID) {
                embed.addFields(
                    { name: 'Réactions', value: '🟠 : En cours de traitement\n✅ : Définir comme traitée\n👼 : Ouvrir un ticket' }
                );
            } else {
                embed.addFields(
                    { name: 'Statut', value: '❌ | Non traitée' },
                    { name: 'Réactions', value: '❌ : Marquer comme RAS\n🟠 : En cours de traitement\n✅ : Définir comme traitée\n👼 : Ouvrir un ticket' }
                );
            }

            const alertMessage = await discussionsChannel.send({ content: `<@&${verificateursRoleID}>`, embeds: [embed] });
            if (roleID !== minorRoleID && roleID !== femmeRoleID) {
                await alertMessage.react('❌');
            }
            await alertMessage.react('🟠');
            await alertMessage.react('✅');
            await alertMessage.react('👼');

            const filter = (reaction, user) => ['❌', '🟠', '✅', '👼'].includes(reaction.emoji.name) && !user.bot;
            const collector = alertMessage.createReactionCollector({ filter, time: 259200000 }); // 72 heures en millisecondes
            let ticketInProgress = false; // Variable pour suivre si un ticket est en cours
            let ticketChannel; // Variable pour garder la référence du salon privé

            collector.on('collect', async (reaction, user) => {
                const member = await newMember.guild.members.fetch(user.id);
                if (!member || !member.roles.cache.has(verificateursRoleID)) {
                    await alertMessage.reply('Seules les personnes ayant le rôle vérificateurs peuvent réagir à ce message.');
                    return;
                }

                if (reaction.emoji.name === '✅') {
                    const updatedEmbed = EmbedBuilder.from(embed).setFields([{ name: 'Statut', value: `✅ | Traité par ${user.username}` }]);
                    await alertMessage.edit({ embeds: [updatedEmbed] });
                    await alertMessage.reply(`L'alerte est traitée par ${user.username}`);
                    await alertMessage.reactions.removeAll();
                    ticketInProgress = false;
                    collector.stop();
                    if (ticketChannel) {
                        const messages = await ticketChannel.messages.fetch({ limit: 100 });
                        const messageLog = messages.map(m => `${m.author.tag}: ${m.content}`).reverse().join('\n');
                        const filePath = `./transcription-${newMember.user.id}.txt`;
                        fs.writeFileSync(filePath, messageLog);
                        const attachment = new AttachmentBuilder(filePath);
                        await logsChannel.send({ content: `Transcription du ticket de ${newMember.user.tag}:`, files: [attachment] });
                        fs.unlinkSync(filePath);
                        await ticketChannel.delete();
                        console.log(`Le salon ${ticketChannel.name} a été supprimé.`);
                    }
                } else if (reaction.emoji.name === '❌') {
                    const updatedEmbed = EmbedBuilder.from(embed).setFields([{ name: 'Statut', value: `❌ | RAS` }]);
                    await alertMessage.edit({ embeds: [updatedEmbed] });
                    await alertMessage.reply(`L'alerte est traitée comme RAS par ${user.username}`);
                    await alertMessage.reactions.removeAll();
                    ticketInProgress = false;
                    collector.stop();
                    if (ticketChannel) {
                        const messages = await ticketChannel.messages.fetch({ limit: 100 });
                        const messageLog = messages.map(m => `${m.author.tag}: ${m.content}`).reverse().join('\n');
                        const filePath = `./transcription-${newMember.user.id}.txt`;
                        fs.writeFileSync(filePath, messageLog);
                        const attachment = new AttachmentBuilder(filePath);
                        await logsChannel.send({ content: `Transcription du ticket de ${newMember.user.tag}:`, files: [attachment] });
                        fs.unlinkSync(filePath);
                        await ticketChannel.delete();
                        console.log(`Le salon ${ticketChannel.name} a été supprimé.`);
                    }
                } else if (reaction.emoji.name === '🟠') {
                    const updatedEmbed = EmbedBuilder.from(embed).setFields([{ name: 'Statut', value: `🟠 | En cours de traitement par ${user.username}` }]);
                    await alertMessage.edit({ embeds: [updatedEmbed] });
                    await alertMessage.reply(`L'alerte est en cours de traitement par ${user.username}`);
                } else if (reaction.emoji.name === '👼') {
                    if (ticketInProgress) {
                        await alertMessage.reply('Un ticket est déjà en cours pour cette alerte.');
                        return;
                    }
                    ticketChannel = await newMember.guild.channels.create({
                        name: `ticket-${newMember.user.username}`,
                        type: 0,
                        parent: ticketCategoryID,
                        permissionOverwrites: [
                            { id: newMember.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                            { id: verificateursRoleID, allow: [PermissionsBitField.Flags.ViewChannel] },
                            { id: newMember.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                            { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        ],
                    });
                    ticketInProgress = true;
                    const ticketEmbed = new EmbedBuilder()
                        .setColor(0x00FFFF)
                        .setTitle('Ticket de vérification')
                        .setDescription(`Ce salon a été ouvert pour discuter avec ${newMember.user}. \n\n**Créé par :** ${user.username}`)
                        .setTimestamp();
                    await ticketChannel.send({ embeds: [ticketEmbed] });
                    const greetingMessage = getGreetingMessage(newMember.user);
                    await ticketChannel.send(greetingMessage);
                    await alertMessage.reply('Un salon privé a été créé pour discuter de l\'alerte.');
                    await reaction.users.remove(user.id);
                }
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    const updatedEmbed = EmbedBuilder.from(embed).setFields([{ name: 'Statut', value: `❌ | Le temps de l'alerte est dépassé` }])
                        .setColor(0xFF0000);
                    await alertMessage.edit({ embeds: [updatedEmbed] });
                    await alertMessage.reply('La période de traitement de cette alerte est terminée.');
                }
            });

            // Gestion du timer pour bannissement
            if (roleID === minorRoleID || roleID === femmeRoleID) {
                if (banTimers.has(newMember.id)) {
                    clearTimeout(banTimers.get(newMember.id));
                    banTimers.delete(newMember.id);
                }
                const timer = setTimeout(() => {
                    scheduleBan(newMember, roleName, alertMessage);
                }, 15000); // 15 secondes
                banTimers.set(newMember.id, timer);
            }
        };

        // Traitement des rôles ajoutés ou retirés
        if (!oldHasMinorRole && newHasMinorRole) {
            sendAlert('mineur', minorRoleID, 'Alerte Mineur !');
        }
        if (!oldHasFemmeRole && newHasFemmeRole) {
            sendAlert('Femme', femmeRoleID, 'Alerte Femme !');
        }
        if (oldHasMinorRole && !newHasMinorRole) {
            console.log(`Le membre ${newMember.user.tag} a perdu le rôle mineur.`);
            if (banTimers.has(newMember.id)) {
                clearTimeout(banTimers.get(newMember.id));
                banTimers.delete(newMember.id);
                console.log(`Minuterie de bannissement annulée pour ${newMember.user.tag}.`);
            }
        }
        if (oldHasFemmeRole && !newHasFemmeRole) {
            console.log(`Le membre ${newMember.user.tag} a perdu le rôle femme.`);
            if (banTimers.has(newMember.id)) {
                clearTimeout(banTimers.get(newMember.id));
                banTimers.delete(newMember.id);
                console.log(`Minuterie de bannissement annulée pour ${newMember.user.tag}.`);
            }
        }
    }
}

module.exports = Mineur;
