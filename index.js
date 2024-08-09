const { Client, GatewayIntentBits, Partials, Events } = require('discord.js');
require('dotenv').config();
const fs = require('fs');

// Import des modules de commande
const ListBans = require('./Commandes/ListBans');
const Mineur = require('./Commandes/Mineur');
const Signalement = require('./Commandes/Signalement');
const Confession = require('./Commandes/Confession');
const AlerteNombre = require('./Commandes/AlerteNombre'); // Assurez-vous que le chemin est correct

const TOKEN = process.env.TOKEN;
const ALERT_CHANNEL_ID = process.env.ALERT_CHANNEL_ID;
const VERIFICATEUR_ROLE_ID = process.env.VERIFICATEUR_ROLE_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages
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


client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}`);
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

client.on(Events.Error, (error) => {
    console.error('An error occurred:', error);
});

client.login(TOKEN);
