import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { seedDefaultCourseDays } from "./services/course-day.service.js";
import { migrateCurriculumTracks } from "./utils/migrate-curriculum-tracks.js";

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    await migrateCurriculumTracks();
    await seedDefaultCourseDays();

    app.listen(env.PORT, () => {
      console.log(`Server is running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

void startServer();
