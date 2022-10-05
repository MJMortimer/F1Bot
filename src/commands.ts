import { ApplicationCommandOptionType, Guild } from "discord.js";

export enum F1ScheduleBotCommand {
    NEXT_RACE = "nextrace",
    NEXT_SESSION = "nextsession",
    DRIVER_STANDINGS = "driverstandings",
    CONSTRUCTOR_STANDINGS = "constructorstandings",
    RACE_RESULT = "raceresult",
    SCHEDULE = "schedule",
    TEST = "test"
}

export enum RaceResultOptions {
    YEAR = "year",
    ROUND = "round"
}

export enum SendOptions {
    SENDTOALL = "sendtoall"
}

export const setCommands = (guild: Guild) => {
    console.log("Setting guild commands for", guild.name);
    guild.commands.set([        
        {
            name: F1ScheduleBotCommand.NEXT_RACE,
            description: "Will tell you when the next race is.",
            options: [
                {
                    name: SendOptions.SENDTOALL,
                    description: "[OPTIONAL] Should everyone see the response. Defaults to false",
                    type: ApplicationCommandOptionType.Boolean,
                    required: false
                }
            ]
        },
        {
            name: F1ScheduleBotCommand.NEXT_SESSION,
            description: "Will tell you when the next session is.",
            options: [
                {
                    name: SendOptions.SENDTOALL,
                    description: "[OPTIONAL] Should everyone see the response. Defaults to false",
                    type: ApplicationCommandOptionType.Boolean,
                    required: false
                }
            ]
        },
        {
            name: F1ScheduleBotCommand.SCHEDULE,
            description: "Will tell you when the schedule of an event",
            options: [
                {
                    name: RaceResultOptions.YEAR,
                    description:"[OPTIONAL] The year the race was held. Defaults to current.",
                    type: ApplicationCommandOptionType.String,
                    required: false                    
                },
                {
                    name: RaceResultOptions.ROUND,
                    description:"[OPTIONAL] The round number. Defaults to next or the running event if midway through.",
                    type: ApplicationCommandOptionType.String,
                    required: false
                },
                {
                    name: SendOptions.SENDTOALL,
                    description: "[OPTIONAL] Should everyone see the response. Defaults to false",
                    type: ApplicationCommandOptionType.Boolean,
                    required: false
                }
            ]
        },
        {
            name: F1ScheduleBotCommand.DRIVER_STANDINGS,
            description: "Will list out the current driver standings",
            options: [
                {
                    name: SendOptions.SENDTOALL,
                    description: "[OPTIONAL] Should everyone see the response. Defaults to false",
                    type: ApplicationCommandOptionType.Boolean,
                    required: false
                }
            ]
        },
        {
            name: F1ScheduleBotCommand.CONSTRUCTOR_STANDINGS,
            description: "Will list out the current constructor standings",
            options: [
                {
                    name: SendOptions.SENDTOALL,
                    description: "[OPTIONAL] Should everyone see the response. Defaults to false",
                    type: ApplicationCommandOptionType.Boolean,
                    required: false
                }
            ]
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
                },
                {
                    name: SendOptions.SENDTOALL,
                    description: "[OPTIONAL] Should everyone see the response. Defaults to false",
                    type: ApplicationCommandOptionType.Boolean,
                    required: false
                }
            ]
        },
        {
            name: F1ScheduleBotCommand.TEST,
            description: "Command used for testing",
            options: [
                {
                    name: SendOptions.SENDTOALL,
                    description: "[OPTIONAL] Should everyone see the response. Defaults to false",
                    type: ApplicationCommandOptionType.Boolean,
                    required: false
                }
            ]
        },
    ]);
}