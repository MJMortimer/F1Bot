import { ApplicationCommandOptionType, Guild } from "discord.js";

export enum F1ScheduleBotCommand {
    NEXT_RACE = "nextrace",
    DRIVER_STANDINGS = "driverstandings",
    CONSTRUCTOR_STANDINGS = "constructorstandings",
    RACE_RESULT = "raceresult"
}

export enum RaceResultOptions {
    YEAR = "year",
    ROUND = "round"
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
        {
            name: F1ScheduleBotCommand.RACE_RESULT,
            description: "Will list out the results of the last race",
            options: [
                {
                    name: RaceResultOptions.YEAR,
                    description:"[OPTIONAL] The year the race was held. Defaults to current.",
                    type: ApplicationCommandOptionType.String,
                    required: false                    
                },
                {
                    name: RaceResultOptions.ROUND,
                    description:"[OPTIONAL] The round the race was held. Defaults to last.",
                    type: ApplicationCommandOptionType.String,
                    required: false
                }
            ]
        },
    ]);
}