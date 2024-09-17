const { DataTypes, Model } = require('sequelize');

module.exports = class ActiveRoles extends Model {
    static init(sequelize) {
        return super.init({
            ServerID: { type: DataTypes.STRING, allowNull: false},
            MemberID: { type: DataTypes.STRING, allowNull: false},
            Points: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0}
        }, {
            tableName: 'ActiveRoles',
            timestamps: true,
            sequelize
        });
    }
}