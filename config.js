module.exports = {
    discord: {
        // get from https://discordapp.com/developers/applications/me
        loginToken: 'LOGIN TOKEN',
        // right-click and press 'Copy ID' on your server
        guildId: 'GUILD ID',
        // displays an activity beneath the bot's name in your server
        activityType: 'LISTENING',
        activity: 'the chat..'
    },
    anonchat: {
        message: {
            format: '${content} (${id})'
        },
        userId: {
            length: 7,
            hash: 'sha256',
            digest: 'base64',
            // CHANGE THIS TO A RANDOM STRING!
            salt: 'RANDOM STRING'
        },
        // limits the message to x amount of characters, as to not flood users or discord
        maxMessageLength: 2000,
        // emoji to react with if message was not sent
        reactionOnFailed: '🔴',
        // rate limit in milliseconds for sending messages.
        // use 0 to disable this rate limit
        rateLimit: 2000,
        // delete sender's message when it has been broadcasted successfully
        deleteWhenSent: true
    }
};
