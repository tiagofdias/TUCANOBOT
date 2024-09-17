const { DataTypes, Model } = require('sequelize');

module.exports = class RoleStatus extends Model {
    static init(sequelize) {
        return super.init({
            IDStatusRoles: {
                type: DataTypes.INTEGER,
                unique: true,
                autoIncrement: true,
                primaryKey: true

            },
            ServerID: { type: DataTypes.STRING, allowNull: false},
            RoleID: { type: DataTypes.STRING, allowNull: false, unique: true},
            Roletype: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false},
        }, {
            tableName: 'RoleStatus',
            timestamps: true,
            sequelize
        });
    }
}