// src/discordEvents.ts
import { client } from './discordClient';

export function setupDiscordEvents() {
  client.on('guildMemberAdd', async (member) => {
    try {
      const bienvenida = member.guild.channels.cache.find(
        (ch) => ch.name === 'bienvenida' && ch.isTextBased()
      );

      if (bienvenida?.isTextBased()) {
        await bienvenida.send(
          `👋 ¡Bienvenido, ${member.user.username}!\n\nPreséntate y cuéntanos qué te gustaría aprender o aportar. 🚀`
        );
      }
    } catch (err) {
      console.error('❌ Error al enviar bienvenida:', err);
    }
  });
}
