import { Guild } from "discord.js";

export enum F1ScheduleBotCommand {
    NEXT_RACE = "nextrace",
    DRIVER_STANDINGS = "driverstandings",
    CONSTRUCTOR_STANDINGS = "constructorstandings",
}

export const setCommands = (guild: Guild) => {
    console.log("Setting guild commands for", guild.name);
    guild.commands.set([        
        {
            name: F1ScheduleBotCommand.NEXT_RACE,
            description: "Will tell you when the next race is."
        },
        {
            name: F1ScheduleBotCommand.DRIVER_STANDINGS,
            description: "Will list out the current driver standings"
        },
        {
            name: F1ScheduleBotCommand.CONSTRUCTOR_STANDINGS,
            description: "Will list out the current constructor standings"
        },
    ]);
}