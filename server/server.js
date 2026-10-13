
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const startServer = async () => {
  try {
    await connectDB();

    const app = require("./app");
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
