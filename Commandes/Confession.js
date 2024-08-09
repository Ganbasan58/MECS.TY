// Commandes/Confession.js
const { EmbedBuilder } = require('discord.js');

class Confession {
    async execute(message, args) {
        const confession = args.join(' ');
        if (confession.length === 0) {
            await message.reply('Veuillez fournir le contenu de votre confession après la commande !confession.');
            return;
        }

        try {
            // Récupérer les canaux
            const confessionChannel = await message.client.channels.fetch('1250834477878480977'); // ID du canal de confession
            const logChannel = await message.client.channels.fetch('1243642249238155295'); // ID du canal de log

            if (confessionChannel && logChannel) {
                // Créer et envoyer le message de confession
                const confessionEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Confession Anonyme')
                    .setDescription(confession)
                    .setTimestamp();
                
                const sentConfessionMessage = await confessionChannel.send({ embeds: [confessionEmbed] });
                await sentConfessionMessage.react('✅');
                
                // Envoyer le message de suivi
                const followUpMessage = '## ▶️ Pour confesser, veuillez utiliser la commande !confession dans le serveur.';
                await confessionChannel.send(followUpMessage);

                // Créer et envoyer le log de confession
                const logEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Nouvelle Confession')
                    .setDescription(confession)
                    .addFields({ name: 'Auteur', value: `${message.author.tag} (ID: ${message.author.id})` })
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] });

                // Supprimer le message de la commande
                await message.delete();
            } else {
                await message.reply("Une erreur s'est produite lors du traitement de votre confession. Veuillez réessayer plus tard.");
            }
        } catch (error) {
            console.error('Erreur lors du traitement de la confession:', error);
            await message.reply("Une erreur s'est produite lors du traitement de votre confession. Veuillez réessayer plus tard.");
        }
    }
}

module.exports = Confession;
