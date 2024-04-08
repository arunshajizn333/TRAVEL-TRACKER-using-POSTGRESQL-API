import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "TRAVEL TRACKER",
  password: "password",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Set the view engine to EJS
app.set('view engine', 'ejs');

async function checkVisited() {
  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

// GET home page
app.get("/", async (req, res) => {
  try {
    const countries = await checkVisited();
    res.render("index.ejs", { countries: countries, total: countries.length });
  } catch (error) {
    console.error("Error retrieving visited countries:", error);
    res.status(500).send("Internal Server Error");
  }
});

// INSERT new country
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE country_name= $1 ;",
      [input]
    );
    const data = result.rows[0];
    if (!data) {
      throw new Error("Country name does not exist, try again.");
    }

    const countryCode = data.country_code;

    // Check if the country code already exists in the visited_countries table
    const existingCountry = await db.query("SELECT country_code FROM visited_countries WHERE country_code = $1", [countryCode]);
    if (existingCountry.rows.length > 0) {
      throw new Error("Already Visited The Country");
    }

    // Insert the new country code into visited_countries table
    await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [countryCode]);
    res.redirect("/");
  } catch (error) {
    console.error("Error adding country to visited list:", error);
    const countries = await checkVisited();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
