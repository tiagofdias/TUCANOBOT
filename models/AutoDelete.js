const { DataTypes, Model } = require('sequelize');

module.exports = class AutoDelete extends Model {
    static init(sequelize) {
        return super.init({
            IDAutoDelete: {
                type: DataTypes.INTEGER,
                unique: true,
                autoIncrement: true,
                primaryKey: true

            },
            ServerID: { type: DataTypes.STRING, allowNull: false},
            ChannelID: { type: DataTypes.STRING, allowNull: false, unique: true},
            Seconds: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false},
        }, {
            tableName: 'AutoDelete',
            timestamps: true,
            sequelize
        });
    }
}

