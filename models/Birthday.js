const { DataTypes, Model, Sequelize } = require('sequelize');

module.exports = class Birthday extends Model {
    static init(sequelize) {
        return super.init({
            ServerID: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
            MemberID: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
            Month: { type: DataTypes.INTEGER, allowNull: false },
            Day: { type: DataTypes.INTEGER, allowNull: false },
        }, {
            tableName: 'Birthday',
            timestamps: true,
            sequelize
        });
    }
}
