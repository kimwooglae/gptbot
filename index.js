const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
console.log(GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages)
// const client = new Client({ intents: ['GUILDS', 'GUILD_MESSAGES'] })	// Client 객체 생성

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
        console.log(filePath, command.data.name);
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async msg => {
    if (!msg.guild) return;
    if (msg.guildId !== guildId) return;
    let mention = false;
    msg.mentions.users.forEach(user => {if (user.id === clientId) mention = true;});
    if (!mention) return;

    if (msg.author.bot) return;
    console.log("[START] MessageCreate=================");
    console.log(msg);
    console.log("[E N D] MessageCreate=================");
    try {
        const message = msg.content;
        const model = 'gpt-3.5-turbo';

        console.log('model=>', model);
        console.log('prompt=>', message);
        const completion = await openai.createChatCompletion({
            model: model,
            messages: [{ role: 'user', content: message }],
        });
        console.log('response=>', completion.data.choices[0].message.content);
        if (completion.data.choices[0].message.content.length > 2000) {
            msg.channel.send(completion.data.choices[0].message.content.substring(0, 2000));
        } else {
            msg.channel.send(completion.data.choices[0].message.content);
        }
    } catch (error) {
        console.error('chat.execute:', error);
    }
});

client.on(Events.MessageUpdate, async msg => {
    if (!msg.guild) return;
    if (msg.guildId !== guildId) return;
    let mention = false;
    msg.mentions.users.forEach(user => {if (user.id === clientId) mention = true;});
    if (!mention) return;

    if (msg.author.bot) return;
    console.log("[START] MessageUpdate=================");
    console.log(msg);
    console.log("[E N D] MessageUpdate=================");
    try {
        const message = msg.content;
        const model = 'gpt-3.5-turbo';

        console.log('model=>', model);
        console.log('prompt=>', message);
        const completion = await openai.createChatCompletion({
            model: model,
            messages: [{ role: 'user', content: message }],
        });
        console.log('response=>', completion.data.choices[0].message.content);
        if (completion.data.choices[0].message.content.length > 2000) {
            msg.channel.send(completion.data.choices[0].message.content.substring(0, 2000));
        } else {
            msg.channel.send(completion.data.choices[0].message.content);
        }
    } catch (error) {
        console.error('chat.execute:', error);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    console.log("[START] InteractionCreate=================");
    console.log(interaction);
    console.log("[E N D] InteractionCreate=================");
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

// Log in to Discord with your client's token
client.login(token);
