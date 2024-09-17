const { DataTypes, Model } = require('sequelize');

module.exports = class AutoRole extends Model {
    static init(sequelize) {
        return super.init({
            serverId: { type: DataTypes.STRING, allowNull: false, unique: true, },
            botRoleId: { type: DataTypes.STRING, allowNull: true, },
            userRoleId: { type: DataTypes.STRING, allowNull: true, },
        }, {
            tableName: 'AutoRole',
            timestamps: true,
            sequelize
        });
    }
}