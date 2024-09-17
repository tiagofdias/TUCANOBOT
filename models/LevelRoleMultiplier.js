const { DataTypes, Model, Sequelize } = require('sequelize');

module.exports = class LevelRoleMultiplier extends Model {
    static init(sequelize) {
        return super.init({
            ServerID: { type: DataTypes.STRING, allowNull: false},
            RoleID: { type: DataTypes.STRING, allowNull: false},
            Boost: { type: DataTypes.NUMBER, allowNull: false, defaultValue: 1},
        }, {
            tableName: 'LevelRoleMultiplier',
            timestamps: true,
            sequelize
        });
    }
}