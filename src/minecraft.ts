import { type Client, type ClientOptions, createClient } from "bedrock-protocol";

import { promises as fs } from "node:fs";

type MinecraftClientType = Client & { username: string };
type OnTextType = {
  message: string;
  source_name: string;
  type: string;
  parameters: string[];
};

export const getTranslation = async (lang: string) => {
  const getReadDir = async (dir: string) => {
    try {
      return await fs.readdir(dir);
    } catch (err) {
      throw new Error("No translation files found, please add submodules");
    }
  };

  const dir = "./MCBVanillaResourcePack/texts";
  const files = (await getReadDir(dir)).filter((file) => file.endsWith(".lang"));

  const langPath = files.find((file) => file.startsWith(lang));

  if (!langPath) {
    throw new Error(`Translation file not found: ${lang}, choose from: ${files.join(", ")}`);
  }

  const data = await fs.readFile(`${dir}/${langPath}`, "utf-8");
  const raw = data
    .split(/\r\n|\r|\n/)
    .map((line) => line.split("="))
    .filter(([key, value]) => key.length > 1)
    .sort((a, b) => b[0].length - a[0].length);

  const getTranslation = (text: string, parameters: (string | number)[]) => {
    let count = 0;
    const placeholder = Array.from({ length: 3 }, (_, i) => [
      ...raw.map(([key, value]) => {
        return (acc: string) => acc.replace(`%${key}`, value);
      }),
      ...raw.map(([key, value]) => {
        return (acc: string) => (acc === key ? value : acc);
      }),
      ...parameters.map((param, index) => {
        return (acc: string) => acc.replace(`%${index + 1}$s`, String(param));
      }),
      (acc: string) => acc.replace("%s", String(parameters[count++])),
      ...parameters.map((param, index) => {
        return (acc: string) => acc.replace(`%${index + 1}$d`, String(param));
      }),
      (acc: string) => acc.replace("%d", String(parameters[count++])),
    ]).flat();

    const data = placeholder.reduce((acc, fn) => fn(acc), text);

    return data;
  };
  return { raw, getTranslation };
};

export const removeColorCodes = (text: string) => {
  return text.replace(/§[0-9a-fk-or]/g, "");
};

export const createMinecraftClient = async (options: Partial<ClientOptions>) => {
  const client = createClient(options as any) as MinecraftClientType;

  const sendMessageRaw = async (message: string) => {
    return client.write("text", {
      type: "chat",
      needs_translation: false,
      source_name: client.username,
      xuid: "",
      platform_chat_id: "",
      filtered_message: "",
      message: message,
    });
  };

  await new Promise<void>((resolve, reject) => {
    client.once("spawn", () => {
      resolve();
    });
    setTimeout(() => reject(new Error("Timed out waiting for spawn event")), 10000);
  });

  const sendMessage = async (username: string, message: string) => {
    return sendMessageRaw(`§b§l[Discord]§r §e${username}§r: §f${message}`);
  };

  const sendMessageSystem = async (message: string) => {
    return sendMessageRaw(`§b§l[Discord]§r §f${message}`);
  };

  const onText = async (fn: ({ message, source_name, type, parameters }: OnTextType) => void) => {
    client.on("text", fn);
  };

  const onError = async (fn: (error: any) => void) => {
    client.on("error", fn);
  };

  const onDisconnect = async (fn: (packet: any) => void) => {
    client.on("disconnect", fn);
  };

  return {
    client,
    sendMessageRaw,
    sendMessage,
    sendMessageSystem,
    event: {
      onText,
      onError,
      onDisconnect,
    },
  };
};
