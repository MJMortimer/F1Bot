import axios from "axios";

export const getCurrentSeasonRaces = async () => {
    const response = await axios.get("http://ergast.com/api/f1/current.json");
    return response.data.MRData.RaceTable.Races;
}

export const getNextRace = async () => {
    const races = await getCurrentSeasonRaces()    

    const now = new Date();
    let nextRace: any;

    for (let i = 0; i < races.length; i++) {
        const race = races[i];
        const raceDate = new Date(`${race.date} ${race.time}`);

        if(raceDate > now){
            nextRace = race;
            break;
        }
    }

    return nextRace;
}