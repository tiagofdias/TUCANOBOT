const { DataTypes, Model, Sequelize } = require('sequelize');

module.exports = class Maintenance extends Model {
    static init(sequelize) {
        return super.init({
            ServerID: { type: DataTypes.STRING, allowNull: false},
            RoleID: { type: DataTypes.STRING, allowNull: false, unique:true},
            Status: { type: DataTypes.BOOLEAN, allowNull: false},
        }, {
            tableName: 'Maintenance',
            timestamps: true,
            sequelize
        });
    }
}