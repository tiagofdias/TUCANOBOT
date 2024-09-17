const { DataTypes, Model } = require('sequelize');

module.exports = class BenficaDay extends Model {
    static init(sequelize) {
        return super.init({
            ServerID: { type: DataTypes.STRING, allowNull: false},
            RoleID: { type: DataTypes.STRING, allowNull: false, unique: true, },
            Colour: { type: DataTypes.STRING, allowNull: true, },
            Status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        }, {
            tableName: 'BenficaDay',
            timestamps: true,
            sequelize
        });
    }
}