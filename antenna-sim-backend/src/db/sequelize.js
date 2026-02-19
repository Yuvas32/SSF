import { sequelize as sequelizeInstance } from "../db.js";

// re-export to keep your existing db.js as-is
export const sequelize = sequelizeInstance;
