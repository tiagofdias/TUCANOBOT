const { DataTypes, Model, Sequelize } = require('sequelize');

module.exports = class TempVCS extends Model {
    static init(sequelize) {
        return super.init({
            ServerID: { type: DataTypes.STRING, allowNull: false},
            VCID: { type: DataTypes.STRING, allowNull: false, unique: true},
            UserLimit: { type: DataTypes.NUMBER, defaultValue: 5},
            BitRate: { type: DataTypes.NUMBER, defaultValue: 96000},
        }, {
            tableName: 'TempVCS',
            timestamps: true,
            sequelize
        });
    }
}