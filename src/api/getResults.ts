import axios from "axios";

export const getLastRaceResult = async () => {
    const response = await axios.get("http://ergast.com/api/f1/current/last/results.json");
    return response.data.MRData.RaceTable.Races[0].Results;
}