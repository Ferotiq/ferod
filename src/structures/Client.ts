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
  GuildMember
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
import { existsSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

const envPath: string = join(process.cwd(), ".env");

function dotenvConfig() {
  config({ path: envPath });
}

dotenvConfig();

// Client class
class Client extends DiscordClient {
  public override options: ClientOptions;
  public commands = new Collection<string, Command>();
  public prefix: string | undefined;
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

    this.checkPaths();
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

    if (this.options.commandLoadedMessage)
      console.table(
        Object.fromEntries(
          this.commands.map(command => [
            command.name,
            { ...command, build: command.build.toString() }
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
            (slash.guildId ? cmd.guildID === slash.guildId : true)
        );

        if (slashCommand && this.options.editSlashCommands) {
          cmd.editApplicationCommand(this);
          uploadedSlashCommands++;
        } else if (!slashCommand) {
          cmd.createApplicationCommand(this);
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
    const context: Context = {
      args: [],
      command: null,
      channel: null,
      author: null,
      mentions: null
    };

    if (interactionOrMessage instanceof Message) {
      context.message = interactionOrMessage;

      const [cmd, args] = context.message.content
        .substring(this.prefix?.length || 0)
        .split(/ +/);

      context.command = cmd;

      context.args.push(...args);

      context.author = context.message.author;

      context.channel = context.message.channel;

      context.guild = context.message.guild;

      context.mentions = context.message.mentions;
    } else if (interactionOrMessage instanceof CommandInteraction) {
      context.interaction = interactionOrMessage;

      const args =
        context.interaction.options.data.map(
          v => context.interaction?.options.get(v.name)?.value?.toString() || ""
        ) || [];

      context.args.push(...args);

      context.command = context.interaction.commandName;

      context.author = context.interaction.user;

      context.channel = context.interaction.channel;

      context.guild = context.interaction.guild;

      context.mentions = this.convertOptionsToMentions(context);
    }

    return context;
  }

  /** @description Converts interaction options to a Mentions object. */
  private convertOptionsToMentions(context: Context): Mentions | undefined {
    if (!context.guild || !context.interaction) return undefined;

    const mentions: Mentions = {
      channels: new Collection(),
      client: this,
      everyone: false,
      guild: context.guild,
      members: new Collection(),
      repliedUser: null,
      roles: new Collection(),
      users: new Collection(),
      crosspostedChannels: new Collection()
    };

    const interaction = context.interaction;

    const types = ["ROLE", "USER", "CHANNEL", "MENTIONABLE"];

    const options = interaction.options.data
      .filter(v => v.role || v.channel || v.member || v.user)
      .map(v => [v.name, v.type]);

    options.forEach(option => {
      const [name, type] = option;
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
