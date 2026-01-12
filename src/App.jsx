const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://blog.marck0101.com.br",
  "https://www.blog.marck0101.com.br"
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
