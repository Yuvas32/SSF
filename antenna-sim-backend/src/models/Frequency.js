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
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
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
    timestamps: true, // adds createdAt, updatedAt
    hooks: {
      async afterCreate(instance, options) {
        if (!instance.name) {
          const nameValue = String(instance.id);
          await instance.update(
            { name: nameValue },
            { transaction: options.transaction, hooks: false }
          );
        }
      }
    }
  }
);
