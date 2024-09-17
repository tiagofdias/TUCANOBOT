const { DataTypes, Model } = require('sequelize');

module.exports = class VanityRoles extends Model {
    static init(sequelize) {
        return super.init({
            IDVanity: {
                type: DataTypes.INTEGER,
                unique: true,
                autoIncrement: true,
                primaryKey: true

            },
            ServerID: { type: DataTypes.STRING, allowNull: false},
            RoleID: { type: DataTypes.STRING, allowNull: false},
            CustomStatus: { type: DataTypes.STRING, allowNull: false},
        }, {
            tableName: 'VanityRoles',
            timestamps: true,
            sequelize
        });
    }
}

