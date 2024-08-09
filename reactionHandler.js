const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.MessageReactions,
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (reaction.emoji.name === '⚠') {
    try {
      const alertChannel = await client.channels.fetch('1241404218485637171');
      const message = reaction.message;
      await alertChannel.send(`Alert: ${message.content}`);
    } catch (error) {
      console.error('Error fetching channel or sending message: ', error);
    }
  }
});

module.exports = {
    Avertissements
};