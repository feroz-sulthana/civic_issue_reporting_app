const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const issueRoutes = require("./routes/issueRoutes");
const adminRoutes = require("./routes/adminRoutes");

const passport = require("./config/passport");

const app = express();

/* ================= CREATE HTTP SERVER ================= */

const server = http.createServer(app);

/* ================= SOCKET.IO ================= */

const io = new Server(server,{
  cors:{
    origin:[process.env.CLIENT_URL,"http://localhost:5173"],
    methods:["GET","POST","PATCH"],
    credentials:true
  }
});

/* Make io accessible inside routes */

app.set("io", io);

io.on("connection",(socket)=>{
  console.log("⚡ User connected:", socket.id);

  socket.on("disconnect",()=>{
    console.log("❌ User disconnected:", socket.id);
  });
});

/* ================= DATABASE ================= */

connectDB();

/* ================= CORS ================= */

app.use(cors({
  origin:[process.env.CLIENT_URL,"http://localhost:5173"],
  credentials:true
}));

/* ================= MIDDLEWARE ================= */

app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret:process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

/* ================= ROUTES ================= */

app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/admin", adminRoutes);

/* ================= ROOT ================= */

app.get("/", (_,res)=>{
  res.send("🚀 CleanStreet API Running");
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, ()=>{
  console.log(`🚀 Server running on port ${PORT}`);
});