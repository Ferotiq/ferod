/** @format */

// imports
/// discord.js
import {
  Client as DiscordClient,
  Collection,
  ApplicationCommand,
  FetchApplicationCommandOptions,
  ClientEvents,
  CommandInteraction,
  Message,
  Role,
  User,
  Channel,
  GuildMember,
  Guild
} from "discord.js";

/// structures
import { Command } from "./Command";

/// interfaces
import { Event } from "../interfaces/Event";
import { Context } from "../interfaces/Context";
import { Mentions } from "../interfaces/Mentions";
import { ClientOptions } from "../interfaces/ClientOptions";

/// file system
import glob from "glob";
import { promisify } from "util";
import { existsSync, writeFileSync, mkdirSync, copyFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

const envPath: string = join(process.cwd(), ".env");

function dotenvConfig() {
  config({ path: envPath });
}

dotenvConfig();

// Client class
class Client extends DiscordClient {
  public declare options: ClientOptions;
  public commands = new Collection<string, Command>();
  public prefix: string | undefined;
  public categories: string[] = [];
  private glob = promisify(glob);

  public constructor(options: ClientOptions) {
    super(options);

    if (options.token === "env") {
      if (!existsSync(envPath)) {
        writeFileSync(envPath, 'TOKEN = "your_bot_token_here"');
        throw new Error(
          "A .env file has been created in your root directoy. Please add your token to this file or instead put it in the config.json"
        );
      }
      options.token = process.env.TOKEN as string;
    }

    this.options = options;
    this.prefix = options.prefix;
  }

  /** @description Checks and adds commands/events folders. */
  private checkPaths() {
    // commands
    if (!existsSync(this.options.commandsPath)) {
      mkdirSync(this.options.commandsPath, { recursive: true });
      console.warn(
        "The commands directory has been created using the path provided."
      );
    }

    // events
    if (!existsSync(this.options.eventsPath)) {
      mkdirSync(this.options.eventsPath, { recursive: true });
      console.warn(
        "The events directory has been created using the path provided."
      );
    }
  }

  /** @description (Re)loads commands, events, and slash commands into the bot. */
  public async reload(token: string = this.options.token): Promise<string> {
    this.checkPaths();

    // help command
    if (
      (this.options.builtInHelpCommand === "js" ||
        this.options.builtInHelpCommand === "ts") &&
      !existsSync(
        join(
          this.options.commandsPath,
          `help.${this.options.builtInHelpCommand}`
        )
      )
    )
      copyFileSync(
        join(
          __dirname,
          "../../",
          this.options.builtInHelpCommand === "ts" ? "src" : "dist",
          "commands",
          `help.${this.options.builtInHelpCommand}`
        ),
        join(
          this.options.commandsPath,
          `help.${this.options.builtInHelpCommand}`
        )
      );

    // add commands
    const commandFiles = await this.glob(
      `${this.options.commandsPath}/**/*{.ts,.js}`
    );

    const commands: Command[] = await Promise.all(
      commandFiles.map(
        async filePath =>
          ((await import(filePath)).default ||
            (await import(filePath))) as Command
      )
    );

    commands.forEach(command => this.commands.set(command.name, command));

    this.categories.push(...new Set(commands.map(v => v.category)));

    if (this.options.commandLoadedMessage)
      console.table(
        Object.fromEntries(
          this.commands.map(command => [
            command.name,
            {
              ...command,
              aliases: command.aliases || "None",
              options: command.options
            }
          ])
        ),
        ["description", "aliases", "build"]
      );

    // add events
    const eventFiles = await this.glob(
      `${this.options.eventsPath}/**/*{.ts,.js}`
    );

    const events = await Promise.all(
      eventFiles.map(
        async filePath =>
          (await import(filePath)).default ||
          ((await import(filePath)) as Event<keyof ClientEvents>)
      )
    );

    events.forEach(event => this.on(event.event, event.run.bind(null, this)));

    if (this.options.eventLoadedMessage)
      console.table(
        Object.fromEntries(events.map(event => [event.event, event])),
        ["run"]
      );

    await this.login(token);

    const slashCommands = await this.fetchSlashCommands();

    let uploadedSlashCommands = 0,
      deletedSlashCommands = 0;

    if (slashCommands) {
      // edit slash commands
      this.commands.forEach(cmd => {
        const slashCommand = slashCommands.find(
          slash =>
            cmd.name === slash.name &&
            (slash.guildId ? cmd.guildIDs.includes(slash.guildId) : true)
        );

        if (slashCommand && this.options.editSlashCommands) {
          cmd.edit(this);
          uploadedSlashCommands++;
        } else if (!slashCommand) {
          cmd.create(this);
          uploadedSlashCommands++;
        }
      });

      // delete slash commands
      slashCommands.forEach(slashCommand => {
        if (
          this.options.deleteUnusedSlashCommands &&
          !this.commands.find(cmd => cmd.name === slashCommand.name)
        ) {
          slashCommand.delete();
          deletedSlashCommands++;
        }
      });
    }

    return `Reloaded ${commandFiles.length} commands;\nReloaded ${eventFiles.length} events;\nUpdated/Uploaded ${uploadedSlashCommands} slash commands;\nDeleted ${deletedSlashCommands} slash commands;`;
  }

  /** @description Fetch Slash Commands */
  public async fetchSlashCommands(
    guildID?: string
  ): Promise<Collection<string, ApplicationCommand> | undefined> {
    const options: FetchApplicationCommandOptions = {
      cache: true,
      force: true
    };

    if (guildID) options.guildId = guildID;

    const commands = await this.application?.commands.fetch(options);

    return commands;
  }

  /** @description Converts a message or interaction to a Context object. */
  public async getContext(
    interactionOrMessage: CommandInteraction | Message
  ): Promise<Context> {
    if (
      !(interactionOrMessage instanceof Message) &&
      !(interactionOrMessage instanceof CommandInteraction)
    )
      throw Error(
        "Could not make context because interactionOrMessage was neither an interaction nor a message"
      );

    const context: Context = {
      client: this,
      command: (interactionOrMessage instanceof Message
        ? interactionOrMessage.content
            .substring(this.prefix?.length || 0)
            .split(/ +/)[0]
        : interactionOrMessage.commandName) as string,
      args:
        (interactionOrMessage instanceof Message
          ? interactionOrMessage.content
              .substring(this.prefix?.length || 0)
              .split(/ +/)
              .slice(1)
          : interactionOrMessage.options.data.map(
              v =>
                interactionOrMessage.options.get(v.name)?.value?.toString() ||
                ""
            )) || [],
      message:
        interactionOrMessage instanceof Message
          ? interactionOrMessage
          : undefined,
      interaction:
        interactionOrMessage instanceof CommandInteraction
          ? interactionOrMessage
          : undefined,
      channel: interactionOrMessage.channel,
      author:
        interactionOrMessage instanceof Message
          ? interactionOrMessage.author
          : interactionOrMessage.user,
      member:
        interactionOrMessage instanceof Message
          ? interactionOrMessage.member
          : await interactionOrMessage.guild?.members.fetch(
              interactionOrMessage.user.id
            ),
      guild: interactionOrMessage.guild,
      mentions:
        interactionOrMessage instanceof Message
          ? interactionOrMessage.mentions
          : this.convertOptionsToMentions(
              interactionOrMessage,
              interactionOrMessage.guild
            )
    };

    return context;
  }

  /** @description Converts interaction options to a Mentions object. */
  private convertOptionsToMentions(
    interaction: CommandInteraction,
    guild: Guild | null
  ): Mentions | undefined {
    if (!guild || !interaction) return undefined;

    const mentions: Mentions = {
      channels: new Collection(),
      client: this,
      everyone: false,
      guild: guild,
      members: new Collection(),
      repliedUser: null,
      roles: new Collection(),
      users: new Collection(),
      crosspostedChannels: new Collection()
    };
    const types = ["ROLE", "USER", "CHANNEL", "MENTIONABLE"];

    const options = interaction.options.data
      .filter(v => v.role || v.channel || v.member || v.user)
      .map(v => [v.name, v.type]);

    options.forEach(option => {
      const [name, type] = option;
      if (name === undefined || type === undefined) return;
      switch (type) {
        case types[0]:
          // role

          const role = interaction.options.getRole(name);

          if (role && role instanceof Role) mentions.roles.set(role.id, role);

          break;

        case types[1]:
          // user

          const user = interaction.options.getUser(name);

          if (user && user instanceof User) mentions.users.set(user.id, user);

          break;

        case types[2]:
          // channel

          const channel = interaction.options.getChannel(name);

          if (channel && channel instanceof Channel)
            mentions.channels.set(channel.id, channel);

          break;

        case types[3]:
          // mentionable

          const mentionable = interaction.options.getMentionable(name);

          if (mentionable && mentionable instanceof GuildMember)
            mentions.members.set(mentionable.id, mentionable);
          else if (mentionable && mentionable instanceof User)
            mentions.users.set(mentionable.id, mentionable);

          break;

        default:
          break;
      }
    });

    return mentions;
  }

  /** @description Gets all the commands that are in the specified category. */
  public getCommandsByCategory(category: string): Collection<string, Command> {
    return this.commands.filter(cmd => cmd.category === category);
  }
}

// exports
export { Client };
