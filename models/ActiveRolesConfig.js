const { DataTypes, Model } = require('sequelize');

module.exports = class ActiveRolesConfig extends Model {
    static init(sequelize) {
        return super.init({
            ServerID: { type: DataTypes.STRING, allowNull: false, unique: true},
            RoleID: { type: DataTypes.STRING, allowNull: false, unique: true},
            PointsPerVoice: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
            PointsPerMsg: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
            PointsLost: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
            PointsLimit: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
            PointsCeiling: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
            Enabled: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
            BonusPoints: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        }, {
            tableName: 'ActiveRolesConfig',
            timestamps: true,
            sequelize
        });
    }
}