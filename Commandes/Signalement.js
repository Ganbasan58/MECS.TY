const { EmbedBuilder, Events } = require('discord.js');

// Identifiants des canaux et des rôles
const ALERT_CHANNEL_ID = '1241404218485637171';
const VERIFICATEUR_ROLE_ID = '1234937665925943377'; // Remplacez par l'ID réel du rôle vérificateur

module.exports = (client) => {
    client.on(Events.MessageReactionAdd, async (reaction, user) => {
        if (user.bot) return;

        if (reaction.emoji.name === '⚠️') {
            console.log('Réaction avec ⚠️ détectée !');

            const alertChannel = client.channels.cache.get(ALERT_CHANNEL_ID);
            if (!alertChannel) {
                console.error('Le salon d\'alerte est introuvable.');
                return;
            }

            try {
                const message = await reaction.message.fetch();
                const messageAuthor = message.author;
                const verificateurRole = message.guild.roles.cache.get(VERIFICATEUR_ROLE_ID);

                if (!messageAuthor) {
                    console.error('Auteur du message introuvable.');
                    return;
                }
                if (!verificateurRole) {
                    console.error('Le rôle vérificateur est introuvable.');
                    return;
                }

                const color = parseInt('FFFF00', 16);

                // Créer l'embed initial
                let embed = new EmbedBuilder()
                    .setTitle('Alerte')
                    .setColor(color)
                    .addFields(
                        { name: 'Alerte par', value: user.tag, inline: true },
                        { name: 'Auteur du message', value: messageAuthor.tag, inline: true },
                        { name: 'Salon', value: message.channel.toString(), inline: true },
                        { name: 'Message', value: message.content },
                        { name: 'Statut', value: '❌ | Non traité', inline: true }
                    )
                    .setTimestamp();

                const alertMessage = await alertChannel.send({ content: verificateurRole ? `**Mention Vérificateurs :** ${verificateurRole}` : '', embeds: [embed] });
                await alertMessage.react('❌');
                await alertMessage.react('🟠');
                await alertMessage.react('✅');

                const filter = (reaction, user) => ['❌', '🟠', '✅'].includes(reaction.emoji.name) && !user.bot;
                const collector = alertMessage.createReactionCollector({ filter, time: 86400000 });

                collector.on('collect', async (reaction, user) => {
                    if (!user) return;

                    const userName = user.username;
                    const member = await message.guild.members.fetch(user.id);
                    const hasVerificateurRole = member.roles.cache.has(VERIFICATEUR_ROLE_ID);

                    if (!hasVerificateurRole) {
                        await alertMessage.reply(`${userName}, vous devez avoir le rôle vérificateur pour gérer cette alerte.`);
                        return;
                    }

                    // Recréer l'embed avec les modifications
                    embed = new EmbedBuilder()
                        .setTitle('Alerte')
                        .setColor(color)
                        .addFields(
                            { name: 'Alerte par', value: user.tag, inline: true },
                            { name: 'Auteur du message', value: messageAuthor.tag, inline: true },
                            { name: 'Salon', value: message.channel.toString(), inline: true },
                            { name: 'Message', value: message.content }
                        );

                    if (reaction.emoji.name === '✅') {
                        embed.addFields({ name: 'Statut', value: `✅ | Traité par ${userName}`, inline: true });
                        await alertMessage.edit({ embeds: [embed] });
                        await alertMessage.reply(`L'alerte a été traitée par ${userName}`);
                        await alertMessage.reactions.removeAll();
                        collector.stop();
                    } else if (reaction.emoji.name === '❌') {
                        embed.addFields({ name: 'Statut', value: `✅ | RAS`, inline: true });
                        await alertMessage.edit({ embeds: [embed] });
                        await alertMessage.reply(`L'alerte est marquée RAS par ${userName}`);
                        await alertMessage.reactions.removeAll();
                        collector.stop();
                    } else if (reaction.emoji.name === '🟠') {
                        embed.addFields({ name: 'Statut', value: `🟠 | En cours de traitement par ${userName}`, inline: true });
                        await alertMessage.edit({ embeds: [embed] });
                        await alertMessage.reply(`L'alerte est en cours de traitement par ${userName}`);
                    }
                });

                collector.on('end', async collected => {
                    if (!collected.some(r => r.emoji.name === '✅' || r.emoji.name === '❌')) {
                        embed = new EmbedBuilder()
                            .setTitle('Alerte')
                            .setColor(color)
                            .addFields(
                                { name: 'Alerte par', value: user.tag, inline: true },
                                { name: 'Auteur du message', value: messageAuthor.tag, inline: true },
                                { name: 'Salon', value: message.channel.toString(), inline: true },
                                { name: 'Message', value: message.content },
                                { name: 'Statut', value: '❌ | Non traité', inline: true }
                            );

                        await alertMessage.edit({ embeds: [embed] });
                        await alertMessage.reply('La période de traitement de cette alerte est terminée.');
                    }
                });
            } catch (error) {
                console.error('Erreur lors de la gestion de la réaction:', error);
            }
        }
    });
};
