import { Client, TextChannel } from 'discord.js';
import pingSchema from '../models/ping-schema';
import usersSchema from '../models/users-schema';

export default (client: Client) => {
    client.on('channelCreate', async (channel) => {
        const { guild, type } = channel;

        const resultsC = await pingSchema.findById(guild.id);

        if (!resultsC) {
            return;
        }

        const { channelId } = resultsC;
        const channelC = guild.channels.cache.get(channelId) as TextChannel;
        const data = channelC;

        const results = await usersSchema.findById(guild.id);

        if (!results) {
            return;
        }

        const userdata = results.usersId;

        if (type === 'GUILD_TEXT') {
            return;
        } else if (type === 'GUILD_VOICE') {
            const pings = userdata.toString();
            data.send({
                content: `<a:DinkDonk:896623009945747486> NEW VC: ${channel.name}\n${pings}`,
            });
        } else {
            return;
        }
    });
};

export const config = {
    displayName: 'pinging members',
    dbName: 'PINGING_MEMBER', // Database Name, DO NOT CHANGE.
};
