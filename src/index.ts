import { GatewayIntentBits } from "discord.js";
import { config } from "dotenv";
import { createDiscordClient } from "./discord.js";
import { createLineNotifyClient } from "./lineNotify.js";
import { createMinecraftClient, getTranslation } from "./minecraft.js";
import { numberOr } from "./utils.js";

config();

const HOST = process.env.HOST;
const PORT = numberOr(process.env.PORT);
const REALMS_INVITE_KEY = process.env.REALMS_INVITE_KEY;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const LINE_NOTIFY_URL = process.env.LINE_NOTIFY_URL;
const LINE_NOTIFY_TOKEN = process.env.LINE_NOTIFY_TOKEN;
const LINE_WHITE_MESSAGE = process.env.LINE_WHITE_MESSAGE;

if (!REALMS_INVITE_KEY || !DISCORD_BOT_TOKEN || !DISCORD_CHANNEL_ID) {
  console.error("Missing required environment variables");
  process.exit(1);
}

(async () => {
  const [minecraftClient, discordClient, translation, lineNotifyClient] = await Promise.all([
    (async () => {
      const client = await createMinecraftClient({
        host: HOST,
        port: PORT,
        realms: {
          realmInvite: REALMS_INVITE_KEY,
        },
      });
      await client.sendMessageSystem("Starting integration with Minecraft");
      return client;
    })(),
    (async () => {
      const client = await createDiscordClient(
        {
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
          ],
        },
        {
          token: DISCORD_BOT_TOKEN,
          channelId: DISCORD_CHANNEL_ID,
        }
      );
      await client.sendMessageSystem("Starting integration with Discord");
      return client;
    })(),
    (async () => {
      return await getTranslation(process.env.LANGUAGE || "en_US");
    })(),
    (async () => {
      if (!LINE_NOTIFY_URL || !LINE_NOTIFY_TOKEN) {
        return null;
      }
      return createLineNotifyClient({ url: LINE_NOTIFY_URL, token: LINE_NOTIFY_TOKEN });
    })(),
  ]);

  process.on("SIGINT", () => {
    console.log("Received SIGINT. Shutting down...");
    discordClient.client.destroy();
    minecraftClient.client.disconnect();
    process.exit(0);
  });

  discordClient.client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== DISCORD_CHANNEL_ID) return;
    console.log(`[Discord] ${message.author.username}: ${message.content}`);
    await minecraftClient.sendMessage(message.author.username, message.content);
  });

  minecraftClient.event.onText(async ({ message, source_name, type, parameters }) => {
    if (source_name === minecraftClient.client.username) return;
    if (type === "chat") {
      console.log(`[Minecraft] ${source_name}: ${message}`);
      await discordClient.sendMessage(source_name, message);
    } else if (type === "translation") {
      const text = translation.getTranslation(message, parameters);
      await discordClient.sendMessageRaw(text);
      if (LINE_WHITE_MESSAGE && text.match(LINE_WHITE_MESSAGE)) {
        await lineNotifyClient?.sendMessage(text);
      }
    }

    const args = message.toLowerCase().split(" ");

    if (args[0] === "!tps") {
      const countRuntimeId = await new Promise<number>((resolve) => {
        minecraftClient.client.once("move_player", ({ runtime_id }) => resolve(runtime_id));
      });
      let counter = 0;
      const callback = ({ runtime_id }: { runtime_id: number }) => {
        if (runtime_id === countRuntimeId) {
          counter++;
        }
      };
      minecraftClient.client.on("move_player", callback);
      for (let i = 1; i <= 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        minecraftClient.sendMessageSystem(`TPS: ${counter / i}`);
        discordClient.sendMessageSystem(`TPS: ${counter / i}`);
      }
      minecraftClient.client.removeListener("move_player", callback);
    } else if (args[0] === "!entity") {
      const entityIds = new Set<number>();
      const callback = ({ runtime_entity_id }: { runtime_entity_id: number }) => {
        entityIds.add(runtime_entity_id);
      };
      minecraftClient.client.on("move_entity_delta", callback);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      minecraftClient.client.removeListener("move_entity_delta", callback);
      minecraftClient.sendMessageSystem(`Entity: ${entityIds.size}`);
      discordClient.sendMessageSystem(`Entity: ${entityIds.size}`);
    }
  });

  minecraftClient.event.onError((error: any) => {
    console.error("Minecraft client error:", error);
    discordClient.sendMessageSystem(`❌ Minecraft client error: ${error.message}`);
  });

  minecraftClient.event.onDisconnect((packet: any) => {
    console.log("Disconnected from Minecraft:", packet);
    discordClient.sendMessageSystem("🔌 Disconnected from Minecraft");
  });
})();
