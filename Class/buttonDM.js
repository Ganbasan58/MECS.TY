const AllMembers = require("./AllMembers");

async function declareEventVerif(client)
{
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        if (message.content === '!verif' && message.author.id == "1233497513349222421") {

            let thread = await message.startThread({
                name: `Vérification des membres`,
                autoArchiveDuration: 60
            });

            let AllMembersList = new AllMembers()
            await AllMembersList.fetchAllMembers(message.guild);
            await AllMembersList.checkAllMembers();
            await AllMembersList.sendResults(thread);
        }
    })

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;

        if (interaction.customId.startsWith('dm') == false) return;
        const [action, userID] = interaction.customId.split('_');

        const guild = interaction.guild;
        const member = guild.members.cache.get(userID);

        if (!member) return;
        await interaction.deferReply({ ephemeral: true })
        await member.send({
            content: `Bonjour !\n` +
                `Nous avons remarqué que vous ne possédez pas certains rôles sur le serveur ${guild.name}.\n` +
                `Merci de vous rendre dans le salon <#1234937666605158485> pour les obtenir dans les plus brefs délais.\n` +
                `Cordialement, le staff de ${guild.name}.`
        }).catch(async () => {
            await interaction.editReply({ content: `Impossible d'envoyer un message privé à ${member.user.tag}.`, ephemeral: true });
        })

        await interaction.editReply({ content: `Message envoyé à ${member.user.tag}.`, ephemeral: true });
    })

    console.log('La vérification des membres peut démarer !');
}

module.exports = {
    declareEventVerif
}