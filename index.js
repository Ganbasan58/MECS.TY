const { Client, GatewayIntentBits, Partials, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

// Import des modules de commande
const ListBans = require('./Commandes/ListBans');
const Mineur = require('./Commandes/Mineur');
const Signalement = require('./Commandes/Signalement');
const Confession = require('./Commandes/Confession');
const AlerteNombre = require('./Commandes/AlerteNombre');

// Import du module Badgeuse
const Badgeuse = require('./Commandes/Badgeuse');

const TOKEN = process.env.TOKEN;
const ALERT_CHANNEL_ID = '1241404218485637171'; // ID du salon d'alerte
const VERIFICATEUR_ROLE_ID = '1234937665925943377'; // ID du rôle de vérificateur
const GUILD_ID = process.env.GUILD_ID;
const PRESENCE_CHANNEL_ID = '1271912933139419176'; // ID du salon de présence
const ETAT_CHANNEL_ID = '1273665218693828699'; // ID du salon d'état
const ATTENTE_MOOVE_CHANNEL_ID = '1256901861449928714'; // ID du salon "attente moove"

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates, // Nécessaire pour détecter les changements de salon vocal
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildPresences
    ],
    partials: [
        Partials.User,
        Partials.Message,
        Partials.GuildMember,
        Partials.ThreadMember,
        Partials.Channel
    ]
});

const listBans = new ListBans();
const mineur = new Mineur();
const confession = new Confession();

// Appeler le module Signalement avec le client
Signalement(client);

// Appeler le module AlerteNombre avec le client et les IDs appropriés
AlerteNombre(client, ALERT_CHANNEL_ID, VERIFICATEUR_ROLE_ID);

// Appeler le module Badgeuse avec le client
Badgeuse(client, PRESENCE_CHANNEL_ID);

client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    // Récupérer le salon d'état
    const etatChannel = client.channels.cache.get(ETAT_CHANNEL_ID);
    if (etatChannel) {
        // Créer l'embed vert
        const embed = new EmbedBuilder()
            .setColor(0x00FF00) // Couleur verte
            .setDescription('✅ | Le bot vient d\'être redémarré avec succès !');
        
        // Envoyer l'embed dans le salon d'état
        etatChannel.send({ embeds: [embed] });
    } else {
        console.error(`Le salon avec l'ID ${ETAT_CHANNEL_ID} n'a pas été trouvé.`);
    }
});

client.on(Events.MessageCreate, (message) => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    switch (command) {
        case 'listbans':
            listBans.execute(message);
            break;
        case 'mineur':
            break;
        case 'signalement':
            Signalement.execute(message, args);
            break;
        case 'confession':
            confession.execute(message, args);
            break;
    }
});

client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
    console.log('Old Member:', oldMember);
    console.log('New Member:', newMember);

    if (!oldMember || !newMember || !newMember.guild) {
        console.error('Error: Missing data in GuildMemberUpdate event');
        return;
    }

    mineur.execute(oldMember, newMember);
});

// Détecter quand un membre rejoint le salon "attente moove"
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    if (newState.channelId === ATTENTE_MOOVE_CHANNEL_ID && oldState.channelId !== ATTENTE_MOOVE_CHANNEL_ID) {
        sendAlertEmbed(client, newState.member);
    }
});

// Fonction pour envoyer un embed d'alerte
function sendAlertEmbed(client, member) {
    const alertChannel = client.channels.cache.get(ALERT_CHANNEL_ID);
    if (!alertChannel) {
        console.error(`Le salon avec l'ID ${ALERT_CHANNEL_ID} n'a pas été trouvé.`);
        return;
    }

    const embed = new EmbedBuilder()
        .setColor('#6010ff') // Couleur spécifiée
        .setTitle('🚨 Nouvelle alerte !')
        .setDescription(`Un membre a rejoint le salon "attente moove". <@&${VERIFICATEUR_ROLE_ID}>, veuillez vérifier cela dès que possible.`)
        .addFields({ name: 'Membre', value: `<@${member.id}>`, inline: true });

    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('handleAlert')
                .setLabel('Traiter la demande')
                .setStyle(ButtonStyle.Success) // Bouton vert
        );

    alertChannel.send({ embeds: [embed], components: [actionRow] });
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    // Vérifier si le bouton cliqué est pour traiter l'alerte
    if (interaction.customId === 'handleAlert') {
        const message = interaction.message;

        // Vérifier si le bouton a déjà été cliqué (couleur grise)
        const row = message.components[0];
        const button = row.components[0];

        if (button.style === ButtonStyle.Secondary) {
            // Si le bouton est déjà gris, informer l'utilisateur que la demande a déjà été traitée
            await interaction.reply({ content: 'La demande a déjà été traitée.', ephemeral: true });
        } else {
            // Répondre immédiatement pour éviter l'erreur d'interaction inconnue
            await interaction.deferUpdate();

            // Ensuite, mettre à jour le message avec le bouton désactivé
            await interaction.editReply({
                content: '',
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('handleAlert')
                                .setLabel('Demande traitée')
                                .setStyle(ButtonStyle.Secondary) // Bouton gris
                                .setDisabled(true) // Désactiver le bouton
                        )
                ]
            });
        }
    }
});

client.on(Events.Error, (error) => {
    console.error('An error occurred:', error);
});

client.login(TOKEN);
