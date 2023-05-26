const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running http://localhost:3000/");
    });
  } catch (err) {
    console.log(`DB Error is ${err.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertNames = (dbResponse) => {
  return dbResponse.map((each) => ({
    playerId: each.player_id,
    playerName: each.player_name,
  }));
};

const convertMatchNames = (dbResponse) => {
  return dbResponse.map((each) => ({
    matchId: each.match_id,
    match: each.match,
    year: each.year,
  }));
};

app.get("/players/", async (request, response) => {
  const getPlayers = `
    SELECT 
      *
    FROM
      player_details;`;
  const dbResponse = await db.all(getPlayers);
  response.send(convertNames(dbResponse));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayers = `
    SELECT 
      *
    FROM
      player_details
    WHERE 
      player_id = '${playerId}';`;
  const dbResponse = await db.get(getPlayers);
  response.send({
    playerId: dbResponse.player_id,
    playerName: dbResponse.player_name,
  });
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const putPlayers = `
    UPDATE 
      player_details
    SET 
      player_name = '${playerName}'
    WHERE 
      player_id = '${playerId}';`;
  const dbResponse = await db.all(putPlayers);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatch = `
    SELECT 
      *
    FROM
      match_details
    WHERE 
      match_id = '${matchId}';`;
  const dbResponse = await db.get(getMatch);
  response.send({
    matchId: dbResponse.match_id,
    match: dbResponse.match,
    year: dbResponse.year,
  });
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
    SELECT 
      *
    FROM
      match_details 
        NATURAL JOIN player_match_score
    WHERE 
     player_id = '${playerId}';`;
  const dbResponse = await db.all(getPlayer);
  response.send(convertMatchNames(dbResponse));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatch = `
    SELECT 
      *
    FROM
      player_details
        NATURAL JOIN player_match_score
    WHERE 
     match_id = '${matchId}';`;
  const dbResponse = await db.all(getMatch);
  response.send(convertNames(dbResponse));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersStatistics = `
    SELECT  
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM 
      player_details
        NATURAL JOIN player_match_score
    WHERE 
      player_id = '${playerId}';`;
  const dbResponse = await db.get(getPlayersStatistics);
  response.send(dbResponse);
});

module.exports = app;
