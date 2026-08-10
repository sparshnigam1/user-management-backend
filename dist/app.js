import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import routes from "./routes/index.js";
export function createApp() {
    const app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true }));
    if (process.env.NODE_ENV !== "test") {
        app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
    }
    app.use(routes);
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map