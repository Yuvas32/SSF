import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const Frequency = sequelize.define(
  "Frequency",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    start: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    end: {
      type: DataTypes.DOUBLE,
      allowNull: false
    }
  },
  {
    tableName: "frequencies",
    timestamps: true // adds createdAt, updatedAt
  }
);
