import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { client } from './discordClient';
import { model } from './geminiClient';
import { octokit } from './githubClient';
import type { RoleCreateOptions, TextChannel } from 'discord.js';

const StateAnnotation = Annotation.Root({
  roles: Annotation<RoleCreateOptions[]>(),
  channels: Annotation<string[]>(),
  guildId: Annotation<string | undefined>(),
  channelId: Annotation<string>(),
  messages: Annotation<string[]>(),
  summary: Annotation<string>(),
  repoOwner: Annotation<string>(),
  repoName: Annotation<string>(),
  issueTitle: Annotation<string>(),
  issueUrl: Annotation<string>()
});

export const agentGraph = new StateGraph(StateAnnotation)
  .addNode('fetchGuild', async (state) => {
    const guild = await client.guilds.fetch(state.guildId!);
    return { guildId: guild.id };
  })

  .addNode('createRoles', async (state) => {
    const guild = await client.guilds.fetch(state.guildId!);
    for (const r of state.roles) await guild.roles.create(r);
    return {};
  })

  .addNode('createChannels', async (state) => {
    if (!state.guildId) throw new Error('Guild ID not defined');

    const guild = await client.guilds.fetch(state.guildId);

    await Promise.all(
      state.channels
        .filter((name): name is string => !!name && typeof name === 'string')
        .map(async (name) => {
          const existing = guild.channels.cache.find(
            (ch) => ch.name === name && ch.type === 0
          );

          if (existing) {
            console.log(`⚠️ Channel '${name}' already exists. Not creating again.`);
            return;
          }

          await guild.channels.create({ name, type: 0 });
          console.log(`✅ Channel '${name}' created successfully.`);
        })
    );

    return {};
  })

  .addNode('fetchMessages', async (state) => {
    console.log('🔎 Searching for channel by ID:', state.channelId);

    try {
      const rawChannel = await client.channels.fetch(state.channelId);
      if (!rawChannel) throw new Error('Channel does not exist or is not accessible');

      if (rawChannel.type !== 0) throw new Error('Channel is not a text channel');

      const channel = rawChannel as TextChannel;

      console.log('📥 Reading messages from channel:', channel.name);
      const msgs = await channel.messages.fetch({ limit: 20 });

      const messages = Array.from(msgs.values()).map(
        (m) => `${m.author.username}: ${m.content}`
      );

      return { messages };
    } catch (err: any) {
      console.error('❌ Error accessing channel:', err.message);
      throw new Error(`fetchMessages: ${err.message}`);
    }
  })

  .addNode('summarize', async (state) => {
    const result = await model.generateContent(state.messages.join('\n'));
    return { summary: result.response.text() };
  })

  .addNode('createIssue', async (state) => {
    const { data } = await octokit.issues.create({
      owner: state.repoOwner,
      repo: state.repoName,
      title: state.issueTitle,
      body: state.summary
    });
    return { issueUrl: data.html_url };
  })

  .addEdge(START, 'fetchGuild')
  .addEdge('fetchGuild', 'createRoles')
  .addEdge('createRoles', 'createChannels')
  .addEdge('createChannels', 'fetchMessages')
  .addEdge('fetchMessages', 'summarize')
  .addEdge('summarize', 'createIssue')
  .addEdge('createIssue', END)
  .compile();