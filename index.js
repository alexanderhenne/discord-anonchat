const config = require('./config.js');
const crypto = require('crypto');

const Discord = require('discord.js');
const client = new Discord.Client();

const userCooldownTimes = new Map();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    if (config.discord.activity.length > 0) {
        client.user.setActivity(config.discord.activity, {type: config.discord.activityType});
    }

    // When booting, check if there are any users that don't have a channel
    var guild = client.guilds.get(config.discord.guildId);
    guild.fetchMembers()
        .then(guild => {
            Array.from(guild.members.values())
                .forEach(function(member) {
                    if (member.user.id === client.user.id) {
                        return;
                    }
                    if (member.guild.channels.find('name', member.user.id) === null) {
                        initializeUser(member);
                    }
                });
        });
});

client.on('guildMemberAdd', (member) => {
    if (member.guild.id !== config.discord.guildId) {
        return;
    }

    if (member.user.bot) {
        return;
    }

    var channel = member.guild.channels.find('name', member.user.id);
    if (channel === null) {
        initializeUser(member);
    }
});

client.on('guildMemberRemove', (member) => {
    if (member.guild.id !== config.discord.guildId) {
        return;
    }

    if (member.user.bot) {
        return;
    }

    var channel = member.guild.channels.find('name', member.user.id);
    if (channel !== null) {
        channel.delete()
            .catch(console.error);
    }
});

client.on('message', msg => {
    if (msg.author === client.user) {
        return;
    }

    // Reply to the user if they sent a direct message
    if (msg.channel instanceof Discord.DMChannel) {
        msg.reply(":speak_no_evil: I don't support direct messages anymore! Chat in the Chat Anonymously server (https://discord.gg/cH3atfA). :hear_no_evil:");
        return;
    }

    // Only process the message if it was sent in the anonchat guild
    if (msg.guild.id !== config.discord.guildId) {
        return;
    }

    // Only process the message if it was sent in the user's channel
    if (msg.channel.name !== msg.author.id) {
        return;
    }

    // Rate limit sending messages
    if (config.anonchat.rateLimit > 0) {
        var cooldownTime = userCooldownTimes.get(msg.author.id);
        if (cooldownTime !== undefined && Date.now() < cooldownTime) {
            msg.react(config.anonchat.reactionOnFailed)
                .catch(console.error);
            return;
        }
        userCooldownTimes.set(msg.author.id, Date.now() + config.anonchat.rateLimit);
    }

    broadcastMessage(msg);
});

/*
    Broadcasts the passed in message to all users,
    and then deletes the message when it has been broadcast
*/
function broadcastMessage(msg) {
    var date = new Date();

    var userId = crypto
        .createHash(config.anonchat.userId.hash)
        .update(`${msg.author.id} ${date.getFullYear()} ${date.getMonth()} ${date.getDate()} ${config.anonchat.userId.salt}`)
        .digest(config.anonchat.userId.digest)
        .substring(0, config.anonchat.userId.length)
        .toLowerCase()
        .replace('/', '0');

    var str = format(config.anonchat.message.format, { id: userId, content: msg.content });

    if (str.length <= config.anonchat.maxMessageLength) {
        var guild = client.guilds.get(config.discord.guildId);
        guild.channels
            .forEach(function (c, snowflake, map) {
                c.send(str).catch(console.error);
            });
    }

    if (config.anonchat.deleteWhenSent) {
        msg.delete();
    }
}

/*
    Creates the passed in member's channel for typing messages in
*/
function initializeUser(member) {
    member.guild.createChannel(member.user.id, 'text', [
        {
            id: member.user.id,
            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
        },
        {
            id: member.guild.defaultRole, //@everyone
            deny: ['VIEW_CHANNEL']
        }]
    )
        .then(channel => sendWelcomeMessage(channel))
        .catch(console.error);
}

/*
    Sends a welcoming message to the passed in channel
*/
function sendWelcomeMessage(channel) {
    var embed = new Discord.RichEmbed()
        .setColor('DARK_GOLD')
        .addField("Welcome", "Type a message here to start the conversation!")
        .addField("Rate limit", "You can send a message once every 2 seconds.\n\n:red_circle: reaction on your message = it was NOT sent.")
        .addField("Mute", "If you would like to mute the chat and don't know how: right-click the channel and press Mute (https://i.imgur.com/1PE0wiH.png).")
        .addField("Unique ID", "Messages contain an identifier that is unique to each user (eg. 'alykekd'). This id changes every day.");

    channel.send(embed).catch(console.error);
}

function format(template, params) {
    let tpl = template.replace(/\${(?!this\.)/g, "${this.");
    let tpl_func = new Function(`return \`${tpl}\``);
    return tpl_func.call(params);
}

if (config.anonchat.userId.salt === 'RANDOM STRING') {
    console.log("The salt in the config.js file must be changed to a random string!");
    return;
}

if (config.discord.loginToken === 'LOGIN TOKEN') {
    console.log("The login token in the config.js file must be changed!");
    return;
}

if (config.discord.guildId === 'GUILD ID') {
    console.log("The guild ID in the config.js file must be changed!");
    return;
}

client.login(config.discord.loginToken);
