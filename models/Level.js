const { DataTypes, Model, Sequelize } = require('sequelize');

module.exports = class Level extends Model {
    static init(sequelize) {
        return super.init({
            ServerID: { type: DataTypes.STRING, allowNull: false},
            MemberID: { type: DataTypes.STRING, allowNull: false},
            xp: { type: DataTypes.NUMBER, defaultValue: 0},
            xplevel: { type: DataTypes.NUMBER, defaultValue: 0},
            level: { type: DataTypes.NUMBER, defaultValue: 1},
        }, {
            tableName: 'Level',
            timestamps: true,
            sequelize
        });
    }
}