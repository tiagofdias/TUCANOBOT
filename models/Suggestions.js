const { DataTypes, Model } = require('sequelize');

module.exports = class Suggestions extends Model {
    static init(sequelize) {
        return super.init({
            IDSuggestions: {
                type: DataTypes.INTEGER,
                unique: true,
                autoIncrement: true,
                primaryKey: true

            },
            ServerID: { type: DataTypes.STRING, allowNull: false},
            ChannelID: { type: DataTypes.STRING, allowNull: false, unique: true},
        }, {
            tableName: 'Suggestions',
            timestamps: true,
            sequelize
        });
    }
}