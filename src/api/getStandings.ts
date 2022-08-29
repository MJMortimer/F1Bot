import axios from "axios";

export const getCurrentSeasonDriverStandings = async () => {
    const response = await axios.get("http://ergast.com/api/f1/current/driverStandings.json")
    return response.data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
}

export const getCurrentSeasonConstructorStandings = async () => {
    const response = await axios.get("http://ergast.com/api/f1/current/constructorStandings.json")
    return response.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
}