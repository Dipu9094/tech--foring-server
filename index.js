const express = require("express");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());

process.env.TOKEN_SECRET;

const ObjectId = require("mongodb").ObjectId;
const app = express();
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fs9pd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

//JWT Auth
const generateJWTToken = (user) => {
    return jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: "500s" });
};

const verifyJWTToken = (req, res, next) => {
    try {
        const { authorization } = req.headers;
        const decoded = jwt.verify(authorization, process.env.TOKEN_SECRET);
        req.decodedEmail = decoded.email;
        console.log("demail", req.decodedEmail);
        console.log("decoded", decoded);
        next();
    } catch {}
};

async function run() {
    try {
        await client.connect();
        const database = client.db("stDBAll");

        const jobPortalUsers = database.collection("jobUsers");
        const jobPortalAllJobs = database.collection("jobPortalAllJobs");

        // POST API

        app.post("/jobPortalUserlogin", async (req, res) => {
            const userInfo = req.body;
            console.log("login hit");

            const newUser = {
                email: userInfo.email,
                password: "jwttoken",
            };
            const token = generateJWTToken(newUser);
            const query = { email: userInfo.email };
            const user = await jobPortalUsers.findOne(query);

            const matchedUser = {
                name: user.name,
                email: user.email,
            };

            if (user.password === userInfo.password) {
                console.log("pass milche");
                res.json({ token: token, status: "login", user: matchedUser });
            } else {
                console.log("pass mele nai");
                res.json({ status: "notlogin" });
            }
        });

        //-----------------------------------------

        app.post("/jobPortalUsers", async (req, res) => {
            const newUser = req.body;
            const result = await jobPortalUsers.insertOne(newUser);
            res.json(result);
        });

        app.post("/jobPortalAllJobs", verifyJWTToken, async (req, res) => {
            const newUser = req.body;

            const requester = req.decodedEmail;

            if (requester) {
                const result = await jobPortalAllJobs.insertOne(newUser);
                res.json({ message: "added successfully" });
            } else {
                res.json({ message: "you do not have access " });
            }
        });

        app.get("/jobPortalAllJobs", async (req, res) => {
            const cursor = jobPortalAllJobs.find({});
            const blogs = await cursor.toArray();
            res.send(blogs);
        });

        // // DELETE  API

        //Delete Single Product
        app.delete("/jobs/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await jobPortalAllJobs.deleteOne(query);
            res.json(result);
        });
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Running ST ");
});
app.get("/morning", (req, res) => {
    res.send("Morning");
});
app.get("/hello", (req, res) => {
    res.send("Hello ST Blogs");
});

app.listen(port, () => {
    console.log("ST running at", port);
});
