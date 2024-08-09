const { ActionRowBuilder, ButtonBuilder } = require("@discordjs/builders");
const MemberChecking = require("./MemberChecking");
const { ButtonStyle } = require("discord.js");

class AllMembers {
    constructor () {
        this.members = null;
        this.numberInvalid = 0;
    }

    async fetchAllMembers(guild) {
        this.members = await guild.members.fetch();
    }

    async checkAllMembers() {
        this.members.forEach(async (member) => {
            member.checking = new MemberChecking(member);
            await member.checking.check();
        });
    }

    async sendResults(thread) {
        this.members.forEach(async (member) => {
            if (member.user.bot) return;

            const memberChecking = member.checking;
            if (!memberChecking.valid) {
                this.numberInvalid++;
                const missingRoles = memberChecking.missing.join(', ');
                await thread.send({
                    content: `👦 | Membre : ${member.user.tag} (${member}) \n> ❌ | Rôles manquants : ${missingRoles}`,
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`dm_${member.id}`)
                                .setLabel("Avertir")
                                .setStyle(ButtonStyle.Danger)
                        )
                    ]
                });
            }
        });
        await thread.send(`**__NOMBRE DE MEMBRES INVALIDES__**: ${this.numberInvalid}`);
    }
}

module.exports = AllMembers;