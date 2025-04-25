import { Client, GatewayIntentBits, TextChannel } from 'discord.js';

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

export async function loginDiscord() {
  const token = process.env.DISCORD_TOKEN;
  if (!token) throw new Error('NO DISCORD_TOKEN en .env');
  await client.login(token);
}
