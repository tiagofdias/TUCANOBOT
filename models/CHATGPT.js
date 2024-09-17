const { DataTypes, Model } = require('sequelize');

module.exports = class CHATGPT extends Model {
    static init(sequelize) {
        return super.init({
            IDCHATGPT: {
                type: DataTypes.INTEGER,
                unique: true,
                autoIncrement: true,
                primaryKey: true

            },
            ServerID: { type: DataTypes.STRING, allowNull: false},
            ChannelID: { type: DataTypes.STRING, allowNull: false, unique: true},
        }, {
            tableName: 'CHATGPT',
            timestamps: true,
            sequelize
        });
    }
}