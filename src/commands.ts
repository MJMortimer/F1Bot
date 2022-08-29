import { Guild } from "discord.js";

export enum F1ScheduleBotCommand {
    NEXT_RACE = "nextrace"
}

export const setCommands = (guild: Guild) => {
    console.log("Setting guild commands for", guild.name);
    guild.commands.set([        
        {
            name: F1ScheduleBotCommand.NEXT_RACE,
            description: "Will tell you when the next race is."
        }
    ]);
}