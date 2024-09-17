const { DataTypes, Model, Sequelize } = require('sequelize');

module.exports = class LevelConfig extends Model {
    static init(sequelize) {
        return super.init({

            ServerID: { type: DataTypes.STRING, allowNull: false},
            TextXP: { type: DataTypes.NUMBER, allowNull: false, defaultValue: 10},
            VoiceXP: { type: DataTypes.NUMBER, allowNull: false, defaultValue: 2},
            ReactionXP: { type: DataTypes.NUMBER, allowNull: true, defaultValue: 0},
            GiveawayXP: { type: DataTypes.NUMBER, allowNull: true, defaultValue: 0},
            PoolXP: { type: DataTypes.NUMBER, allowNull: true, defaultValue: 0},
            ModeratorXP: { type: DataTypes.NUMBER, allowNull: true, defaultValue: 0},
            DailyXP: { type: DataTypes.NUMBER, allowNull: true, defaultValue: 0},
            Status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
            
        }, {
            tableName: 'LevelConfig',
            timestamps: true,
            sequelize
        });
    }
}