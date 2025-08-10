import {
  type Channel,
  ChannelType,
  Client,
  type ClientOptions,
  type TextChannel,
} from "discord.js";

export const isTextChannel = (channel: Channel | undefined): channel is TextChannel => {
  return channel?.type === ChannelType.GuildText;
};

export const createDiscordClient = async (
  options: ClientOptions,
  { token, channelId }: { token: string; channelId: string }
) => {
  const client = new Client(options);
  await client.login(token);
  await new Promise<void>((resolve) => {
    client.once("ready", () => {
      resolve();
    });
  });

  const channel = client.channels.cache.get(channelId);
  if (!isTextChannel(channel)) {
    throw new Error(`Channel with ID ${channelId} is not a text channel`);
  }

  const sendMessageSystem = async (message: string) => {
    await channel.send(`[System] ${message}`);
  };
  const sendMessage = async (username: string, message: string) => {
    await channel.send(`**${username}**: ${message}`);
  };
  const sendMessageRaw = async (message: string) => {
    await channel.send(message);
  };

  return { client, channel, sendMessageSystem, sendMessage, sendMessageRaw };
};
