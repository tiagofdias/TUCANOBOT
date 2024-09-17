const { DataTypes, Model } = require('sequelize');

module.exports = class AutoPublish extends Model {
    static init(sequelize) {
        return super.init({
            IDAutoPublish: {
                type: DataTypes.INTEGER,
                unique: true,
                autoIncrement: true,
                primaryKey: true

            },
            ServerID: { type: DataTypes.STRING, allowNull: false},
            ChannelID: { type: DataTypes.STRING, allowNull: false, unique: true},
        }, {
            tableName: 'AutoPublish',
            timestamps: true,
            sequelize
        });
    }
}