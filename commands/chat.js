const { SlashCommandBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chat')
        .setDescription('OpenAI chatbot')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('메시지를 입력하세요. (최대 2000자)')
                .setMaxLength(2000))
        .addStringOption(option =>
            option.setName('model')
                .setDescription('GPT 모델 선택')
                .addChoices(
                    { name: '3.5', value: 'gpt-3.5-turbo' },
                    { name: '4', value: 'gpt-4' },
                )),
    async execute(interaction) {
        try {
            const message = interaction.options.getString('message');
            const model = interaction.options.getString('model') ?? 'gpt-3.5-turbo';
            // await interaction.deferReply({ ephemeral: true });
            await interaction.deferReply();
            console.log('model=>', model);
            console.log('prompt=>', message);
            const completion = await openai.createChatCompletion({
                model: model,
                messages: [{ role: 'user', content: message }],
            });
            console.log('response=>', completion.data.choices[0].message.content);
            if (completion.data.choices[0].message.content.length > 2000) {
                await interaction.editReply(completion.data.choices[0].message.content.substring(0, 2000));
            } else if ((message + '\n------------------------------------------------\n' + completion.data.choices[0].message.content).length > 2000) {
                await interaction.editReply(completion.data.choices[0].message.content);
            } else {
                await interaction.editReply(message + '\n------------------------------------------------\n' + completion.data.choices[0].message.content);
            }
        } catch (error) {
            console.error('chat.execute:', error);
        }

    },
};
