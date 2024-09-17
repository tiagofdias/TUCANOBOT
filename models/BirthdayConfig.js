const { DataTypes, Model, Sequelize } = require('sequelize');

module.exports = class BirthdayConfig extends Model {
    static init(sequelize) {
        return super.init({
            ServerID: { type: DataTypes.STRING, allowNull: false, primaryKey: true , unique:true},
            RoleID: { type: DataTypes.STRING, allowNull: false, primaryKey: true, unique:true },
        }, {
            tableName: 'BirthdayConfig',
            timestamps: true,
            sequelize
        });
    }
}