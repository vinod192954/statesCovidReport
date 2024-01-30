const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dbPath = path.join(__dirname, "covid19IndiaPortal.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API 1

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "secretToken");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
// API 2
const ReturnAllStates = (eachState) => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  };
};
app.get("/states/", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  jwtToken = authHeader.split(" ")[1];
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "secretToken", async (error, payload) => {
      if (error) {
        response.send("Invalid JWT Token");
      } else {
        const getAllStatesQuery = `
              SELECT 
                * 
             FROM  
               state 
             ORDER BY state_id`;
        const states = await db.all(getAllStatesQuery);
        const result = states.map((eachState) => {
          return ReturnAllStates(eachState);
        });
        response.send(result);
      }
    });
  }
});

// API 3

app.get("/states/:stateId/", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  jwtToken = authHeader.split(" ")[1];
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "secretToken", async (error, payload) => {
      if (error) {
        response.send("Invalid JWT Token");
      } else {
        const { stateId } = request.params;
        const getStateQuery = `
        SELECT 
            * 
         FROM 
            state 
         WHERE 
            state_id=${stateId}`;
        const state = await db.get(getStateQuery);
        const result = ReturnAllStates(state);
        response.send(result);
      }
    });
  }
});

//API 4
app.post("/districts/", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  jwtToken = authHeader.split(" ")[1];
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "secretToken", async (error, payload) => {
      if (error) {
        response.send("Invalid JWT Token");
      } else {
        const {
          districtName,
          stateId,
          cases,
          cured,
          active,
          deaths,
        } = request.body;
        const createNewDistrictQuery = `
  INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
  VALUES(
        '${districtName}',
        '${stateId}',
        '${cases}',
        '${cases}',
        '${cured}',
        '${active}',
        '${deaths}'
  )`;
        await db.run(createNewDistrictQuery);
        response.send("District Successfully Added");
      }
    });
  }
});

//API 5

const ReturningDistrict = (DistrictDetails) => {
  return {
    districtId: DistrictDetails.district_id,
    districtName: DistrictDetails.district_name,
    stateId: DistrictDetails.state_id,
    cases: DistrictDetails.cases,
    cured: DistrictDetails.cured,
    active: DistrictDetails.active,
    deaths: DistrictDetails.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  jwtToken = authHeader.split(" ")[1];
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "secretToken", async (error, payload) => {
      if (error) {
        response.send("Invalid JWT Token");
      } else {
        const { districtId } = request.params;
        const getDistrictQuery = `
            SELECT * 
                FROM district 
                WHERE district_id=${districtId}`;
        const district = await db.get(getDistrictQuery);
        const result = ReturningDistrict(district);
        response.send(result);
      }
    });
  }
});

// API 6
app.delete("/districts/districtId", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  jwtToken = authHeader.split(" ")[1];
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "secretToken", async (error, payload) => {
      if (error) {
        response.send("Invalid JWT Token");
      } else {
        const { districtId } = request.params;
        const deleteDistrictQuery = `DELETE FROM district WHERE district_id=${districtId}`;
        await db.run(deleteDistrictQuery);
        response.send("District Removed");
      }
    });
  }
});

//API 7
app.put("/districts/:districtId/", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  jwtToken = authHeader.split(" ")[1];
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "secretToken", async (error, payload) => {
      if (error) {
        response.send("Invalid JWT Token");
      } else {
        const { districtId } = request.params;
        const {
          districtName,
          stateId,
          cases,
          cured,
          active,
          deaths,
        } = request.body;
        const updateDistrictQuery = `
        UPDATE  
            district 
            SET 
            district_name='${districtName}',
            state_id='${stateId}',
            cases='${cases}',
            cured='${cured}',
            active='${active}',
            deaths='${deaths}'
            WHERE 
            district_id=${districtId}`;
        await db.run(updateDistrictQuery);
        response.send("District Details Updated");
      }
    });
  }
});

// API 8

const ReturningStatesStats = (stateReport) => {
  return {
    totalCases: stateReport.cases,
    totalCured: stateReport.cured,
    totalActive: stateReport.active,
    totalDeaths: stateReport.deaths,
  };
};

app.get("/states/:stateId/stats/", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  jwtToken = authHeader.split(" ")[1];
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "secretToken", async (error, payload) => {
      if (error) {
        response.send("Invalid JWT Token");
      } else {
        const { stateId } = request.params;
        const getStateReport = `
            SELECT 
                    SUM(cases) AS cases,
                    SUM(cured) AS cured,
                    SUM(active) AS active,
                    SUM(deaths) AS deaths 
            FROM 
                district 
            WHERE state_id=${stateId}`;
        const stateReport = await db.get(getStateReport);
        const result = ReturningStatesStats(stateReport);
        response.send(result);
      }
    });
  }
});

module.exports = app;
