const { DataTypes, Model, Sequelize } = require('sequelize');

module.exports = class VoiceLogs extends Model {
    static init(sequelize) {
        return super.init({
            ServerID: { type: DataTypes.STRING, allowNull: false},
            MemberID: { type: DataTypes.STRING, allowNull: false},
            Type: { type: DataTypes.BOOLEAN, allowNull: false },
            Date: { type: DataTypes.DATEONLY, allowNull: false},
            Hours: { type: DataTypes.TIME, allowNull: false},
        }, {
            tableName: 'VoiceLogs',
            timestamps: true,
            sequelize
        });
    }
}